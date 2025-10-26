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
    this.logger.debug(`[API] Received request for username: ${username}`);
    
    // 1. Look up the user by the username from the URL
    let user: { id: number, username: string };
    try {
        user = await this.usersService.findOneByUsername(username);
        this.logger.debug(`[API] Successfully found user: ID=${user.id}, Username=${user.username}`);
    } catch (e) {
        if (e instanceof NotFoundException) {
            this.logger.warn(`[API] User not found: ${username}`);
            // Return empty structure instead of 404 if user not found, 
            // as per your observed output {"username":"jane_doe","posts":[]}
            return { username, posts: [] };
        }
        throw e; // Re-throw other errors
    }

    // 2. Fetch all posts belonging to that user ID
    const posts = await this.postsService.findAllByUser(user.id);
    
    this.logger.debug(`[API] Fetched ${posts.length} posts for user ID ${user.id}`);

    // 3. Return the exact JSON structure requested
    return {
      username: user.username,
      posts: posts,
    };
  }
}
