import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'src/posts/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PublicApiService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Resolves a user ID from a username.
   */
  private async getUserIdByUsername(username: string): Promise<number> {
    const user = await this.usersRepository.findOne({ 
        where: { username } 
    });
    
    if (!user) {
      throw new NotFoundException(`Blogger "${username}" not found.`);
    }
    return user.id;
  }

  /**
   * Fetches all posts for a specific user (publicly available).
   */
  async findAllPostsByUsername(username: string): Promise<Post[]> {
    const userId = await this.getUserIdByUsername(username);

    // Fetch posts by user ID, only selecting necessary public fields
    return this.postsRepository.find({
      where: { userId },
      select: ['id', 'title', 'slug', 'content', 'image', 'tags', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Fetches a single post by username and slug (publicly available).
   */
  async findPostBySlug(username: string, slug: string): Promise<Post> {
    const userId = await this.getUserIdByUsername(username);

    const post = await this.postsRepository.findOne({
      where: { userId, slug },
      select: ['id', 'title', 'slug', 'content', 'image', 'tags', 'createdAt'],
    });

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found for user "${username}".`);
    }

    return post;
  }
}
