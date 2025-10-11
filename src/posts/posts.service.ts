import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  /**
   * Helper function to generate a URL-friendly slug.
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars except hyphen
      .replace(/[\s_-]+/g, '-') // Replace spaces and repeated hyphens with a single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Creates a new post for a specific user.
   */
  async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
    // 1. Determine slug (use provided or generate from title)
    const slug = createPostDto.slug 
        ? this.generateSlug(createPostDto.slug) 
        : this.generateSlug(createPostDto.title);

    // 2. Validate unique slug per user
    const existingPost = await this.postsRepository.findOne({
      where: { userId, slug },
    });

    if (existingPost) {
      throw new ConflictException('A post with this slug already exists for this user.');
    }

    // 3. Create and save post
    const newPost = this.postsRepository.create({
      ...createPostDto,
      userId,
      slug,
    });

    return this.postsRepository.save(newPost);
  }

  /**
   * Gets all posts for a specific authenticated user.
   */
  async findAllByUser(userId: number): Promise<Post[]> {
    return this.postsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Gets a single post by ID and verifies ownership.
   */
  async findOneById(id: number, userId: number): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id, userId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found or does not belong to user.`);
    }
    return post;
  }

  /**
   * Updates an existing post and verifies ownership.
   */
  async update(id: number, userId: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOneById(id, userId);

    let finalSlug = post.slug;

    if (updatePostDto.title || updatePostDto.slug) {
        // Recalculate slug if title or slug is being updated
        const newSlug = updatePostDto.slug 
            ? this.generateSlug(updatePostDto.slug) 
            : this.generateSlug(updatePostDto.title || post.title);

        // Check for conflict only if the new slug is different from the current one
        if (newSlug !== post.slug) {
            const existingPost = await this.postsRepository.findOne({
                where: { userId, slug: newSlug },
            });

            if (existingPost && existingPost.id !== id) {
                throw new ConflictException('Another post with this slug already exists for this user.');
            }
        }
        finalSlug = newSlug;
    }


    await this.postsRepository.update(id, {
        ...updatePostDto,
        slug: finalSlug,
    });

    return this.postsRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Deletes a post and verifies ownership.
   */
  async remove(id: number, userId: number): Promise<void> {
    const result = await this.postsRepository.delete({ id, userId });
    
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID "${id}" not found or does not belong to user.`);
    }
  }
}
