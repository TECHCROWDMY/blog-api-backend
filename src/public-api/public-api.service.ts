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
    // 1. Use Query Builder to join Post -> Project -> User
    const posts = await this.postsRepository.createQueryBuilder('post')
      // Join Post to Project (assuming 'project' is the relation name in Post entity)
      .innerJoin('post.project', 'project')
      // Join Project to User (assuming 'user' is the relation name in Project entity)
      .innerJoin('project.user', 'user')
      // 2. Apply the filter on the User entity
      .where('user.username = :username', { username })
      // 3. Select only the necessary public fields
      .select([
        'post.id', 
        'post.title', 
        'post.slug', 
        'post.content', 
        'post.image', 
        'post.tags', 
        'post.createdAt',
        'project.slug' // It's useful to include the project slug/ID for front-end routing
      ])
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    // Note: No need for NotFoundException here; returning an empty array is normal 
    // if the user exists but has no posts.

    return posts;
  }

  // /**
  //  * Fetches a single post by username and slug (publicly available).
  //  */
  // async findPostBySlug(username: string, slug: string): Promise<Post> {
  //   const userId = await this.getUserIdByUsername(username);

  //   const post = await this.postsRepository.findOne({
  //     where: { userId, slug },
  //     select: ['id', 'title', 'slug', 'content', 'image', 'tags', 'createdAt'],
  //   });

  //   if (!post) {
  //     throw new NotFoundException(`Post with slug "${slug}" not found for user "${username}".`);
  //   }

  //   return post;
  // }

  /**
   * Fetches a single post by username and slug (publicly available).
   * * ⚠️ NOTE: This assumes the post entity still has a direct or indirect relationship 
   * that allows joining back to the User.
   * * The most robust public API structure should probably include the Project identifier 
   * to handle cases where a user might have two projects with the same post slug. 
   * A better public route would be: /api/:username/:projectSlug/:postSlug
   */
  async findPostBySlug(username: string, postSlug: string): Promise<Post> {
    // 1. Use the Query Builder to perform JOINs
    const post = await this.postsRepository.createQueryBuilder('post')
      // Join Post to Project (assuming the 'project' field is defined in Post entity)
      .innerJoinAndSelect('post.project', 'project')
      // Join Project to User (assuming the 'user' field is defined in Project entity)
      .innerJoinAndSelect('project.user', 'user')
      // 2. Apply the necessary filters across the joined tables
      .where('user.username = :username', { username })
      .andWhere('post.slug = :postSlug', { postSlug })
      // 3. Select only the necessary public fields
      .select([
        'post.id', 'post.title', 'post.slug', 'post.content', 'post.image', 'post.tags', 'post.createdAt',
        'project.id', 'project.name', 'project.slug', // Include project info
        'user.username' // Include username info
      ])
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with slug "${postSlug}" not found for user "${username}".`);
    }

    return post;
  }
}