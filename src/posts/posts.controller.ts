import { 
  Controller, 
  Get, 
  Post as HttpPost, // Renamed Post to HttpPost to avoid clash with Post entity
  Body, 
  Param, 
  Delete, 
  Put, // Using Put for idempotent update
  UseGuards,
  Req,
  Logger,
  NotFoundException,
  ParseIntPipe
} from '@nestjs/common'; 
import { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../user/user.service'; // Required for public API routes
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

// Interface matching the JwtStrategy return (for req.user typing)
interface AuthRequest extends Request {
  user: { id: number, username: string, email: string };
}

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name); 

  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService, // Injected for public API
  ) {}

  // =========================================================
  // AUTHENTICATED ROUTES (Require JWT)
  // Ownership is checked in the service via Project ownership.
  // =========================================================

  @UseGuards(JwtAuthGuard) 
  @HttpPost()
  async create(
    @Body() body: any, // Use 'any' for manual mapping of the 'project' field
    @Req() req: AuthRequest
  ) {
    const userId = req.user.id;

    // Manual mapping from body.project to createPostDto.projectId
    const createPostDto: CreatePostDto = {
        title: body.title,
        slug: body.slug,
        content: body.content,
        tags: body.tags,
        projectId: body.projectId, // Map the incoming 'project' key to 'projectId'
    };
    
    // 🛑 FIX: Calling the service with (userId, createPostDto) to match the service signature
    // The service verifies that userId owns the projectId before creation.
    return this.postsService.create(userId, createPostDto);
  }

  @UseGuards(JwtAuthGuard) 
  @Get()
  /**
   * Retrieves all posts belonging to the projects owned by the authenticated user (Dashboard view).
   */
  findAllByProjects(@Req() req: AuthRequest) {
    const userId = req.user.id;
    // Service fetches posts based on projects owned by userId
    return this.postsService.findAllByProjects(userId); 
  }

  @UseGuards(JwtAuthGuard) 
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    const userId = req.user.id;
    // Service fetches post and ensures the post's parent project is owned by userId.
    return this.postsService.findOneById(id, userId);
  }

  @UseGuards(JwtAuthGuard) 
  @Put(':id') // Using Put for idempotent update
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.id;
    // Service performs ownership and validation checks
    return this.postsService.update(id, userId, updatePostDto);
  }

  @UseGuards(JwtAuthGuard) 
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    const userId = req.user.id;
    // Service performs ownership check before deleting
    return this.postsService.remove(id, userId);
  }

  // =========================================================
  // PUBLIC API ROUTES (No JWT Guard)
  // =========================================================

  @Get('/api/:username/posts')
  async apiFindAllByUsername(@Param('username') username: string) {
    
    // 1. Look up the public user by username
    let user: { id: number, username: string };
    try {
        user = await this.usersService.findOneByUsername(username);
    } catch (e) {
        if (e instanceof NotFoundException) {
            // If user not found, return empty list instead of 404
            return { username, posts: [] };
        }
        throw e; 
    }

    // 2. Fetch all posts associated with projects owned by that user ID
    const posts = await this.postsService.findAllByProjects(user.id);
    
    return {
      username: user.username,
      posts: posts,
    };
  }

  @Get('/api/:username/posts/:slug')
  async apiFindOneBySlug(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    // 1. Look up the user by the username
    let user: { id: number, username: string };
    try {
      user = await this.usersService.findOneByUsername(username);
    } catch (e) {
      if (e instanceof NotFoundException) {
          throw new NotFoundException(`Post not found: User "${username}" or post with slug "${slug}" does not exist.`);
      }
      throw e;
    }

    // 2. Find all project IDs owned by the user
    const projects = await this.postsService.findAllProjectsByUserId(user.id);
    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
        throw new NotFoundException(`Post with slug "${slug}" not found for user ${username}.`);
    }

    // 3. Search for the post across all projects owned by the user
    const post = await this.postsService.findOneBySlugAndProjectIds(projectIds, slug);

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found for user ${username}.`);
    }

    // 4. Return the post data
    return post;
  }
}