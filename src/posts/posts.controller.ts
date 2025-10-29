import { 
  Controller, 
  Get, 
  Post as HttpPost, 
  Body, 
  Param, 
  Delete, 
  Put, 
  UseGuards,
  Req,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { UsersService } from '../user/user.service'; // 💡 1. IMPORT UsersService
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Request } from 'express';

// Define the structure of the user object available after JWT validation
interface AuthRequest extends Request {
  user: { id: number, username: string };
}

// 💡 2. REMOVED @UseGuards(JwtAuthGuard) from the class level
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name); 

  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService, // 💡 3. INJECT UsersService
  ) {}

  // =========================================================
  // AUTHENTICATED ROUTES (Require JWT)
  // =========================================================

  @UseGuards(JwtAuthGuard) // 💡 Now only protects this route
  @HttpPost()
  create(@Body() createPostDto: CreatePostDto, @Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.create(userId, createPostDto);
  }

  @UseGuards(JwtAuthGuard) // 💡 Now only protects this route
  @Get()
  findAll(@Req() req: AuthRequest) {
    // This route remains for the authenticated user's dashboard
    const userId = req.user.id;
    return this.postsService.findAllByUser(userId);
  }

  @UseGuards(JwtAuthGuard) // 💡 Now only protects this route
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.findOneById(+id, userId);
  }

  @UseGuards(JwtAuthGuard) // 💡 Now only protects this route
  @Put(':id')
  update(
    @Param('id') id: string, 
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.id;
    return this.postsService.update(+id, userId, updatePostDto);
  }

  @UseGuards(JwtAuthGuard) // 💡 Now only protects this route
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.remove(+id, userId);
  }
  
  // =========================================================
  // PUBLIC API ROUTE (No JWT Guard)
  // Maps to: GET /posts/api/:username/posts (or just /api/:username/posts 
  // depending on your main module prefix, let's use the full path)
  // =========================================================
  @Get('/api/:username/posts')
  async apiFindAllByUsername(@Param('username') username: string) {
    
    // 1. Look up the user by the username from the URL
    let user: { id: number, username: string };
    try {
        user = await this.usersService.findOneByUsername(username);
    } catch (e) {
        if (e instanceof NotFoundException) {
            // Return empty structure instead of 404 if user not found, 
            // as per your observed output {"username":"jane_doe","posts":[]}
            return { username, posts: [] };
        }
        throw e; // Re-throw other errors
    }

    // 2. Fetch all posts belonging to that user ID
    const posts = await this.postsService.findAllByUser(user.id);
    

    // 3. Return the exact JSON structure requested
    return {
      username: user.username,
      posts: posts,
    };
  }

    /**
   * NEW PUBLIC API ROUTE: Fetches a single published blog post by username and slug.
   * Maps to: GET /posts/api/:username/:slug
   */
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
      // If user not found, treat it as Post not found for cleaner API error handling
      if (e instanceof NotFoundException) {
          throw new NotFoundException(`Post not found: User "${username}" or post with slug "${slug}" does not exist.`);
      }
      throw e;
    }

    // 2. Fetch the post matching the user ID and slug.
    // NOTE: This assumes PostsService has a method like findOneBySlugAndUser 
    // that also filters for published posts.
    // If your service only has findOneById, you will need to update the service.
    const post = await (this.postsService as any).findOneBySlugAndUser(user.id, slug);

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found for user ${username}.`);
    }

    // 3. Return the post data
    return post;
  }
}
