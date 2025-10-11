import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PublicApiService } from './public-api.service';

// All routes here are public and do not require authentication
@Controller('api')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  /**
   * GET /api/:username/posts
   * Fetches all posts for a specific blogger (identified by username).
   */
  @Get(':username/posts')
  async findAllPosts(@Param('username') username: string) {
    const posts = await this.publicApiService.findAllPostsByUsername(username);
    
    // The service already handles the "Blogger not found" case.
    // If we get an empty array, we can still return a 404 or a 200 with an empty list.
    // Returning a 404 here for better RESTful semantics if no posts are found.
    if (posts.length === 0) {
      throw new NotFoundException(`No posts found for blogger "${username}".`);
    }
    
    // Structured response for the public consumer
    return {
        blogger: username,
        posts: posts,
        count: posts.length,
    };
  }

  /**
   * GET /api/:username/posts/:slug
   * Fetches a single post by username and unique slug.
   */
  @Get(':username/posts/:slug')
  async findPostBySlug(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    // The service handles both "Blogger not found" and "Post not found" and throws NotFoundException.
    const post = await this.publicApiService.findPostBySlug(username, slug);
    
    // Structured response for the public consumer
    return {
        blogger: username,
        post: post,
    };
  }
}
