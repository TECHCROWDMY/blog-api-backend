import { 
  Controller, 
  Get, 
  Post as HttpPost, 
  Body, 
  Param, 
  Delete, 
  Put, 
  UseGuards,
  Req
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Request } from 'express';

// Define the structure of the user object available after JWT validation
interface AuthRequest extends Request {
    user: { id: number, username: string };
}

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  create(@Body() createPostDto: CreatePostDto, @Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.create(userId, createPostDto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.findOneById(+id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string, 
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.id;
    return this.postsService.update(+id, userId, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.postsService.remove(+id, userId);
  }
}
