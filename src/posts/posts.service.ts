import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Import In for finding multiple project IDs
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Project } from '../projects/entities/project.entity'; 

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    // Project Repository is required for ownership and filtering by user
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  /**
   * Helper function to generate a URL-friendly slug.
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  /**
   * Helper function to verify that the given user owns the project.
   * This is the new primary ownership check for all CUD operations.
   */
  private async verifyProjectOwnership(projectId: number, userId: number): Promise<Project> {
      // Find the project where the ID matches AND the userId (owner) matches
      const project = await this.projectRepository.findOne({ where: { id: projectId, userId } });
      if (!project) {
          throw new NotFoundException(`Project with ID ${projectId} not found or access denied.`);
      }
      return project;
  }

  /**
   * Creates a new post for a specific project, verifying user ownership of that project.
   * The 'authorId' is used only to check ownership of the 'projectId'.
   */
  async create(authorId: number, createPostDto: CreatePostDto): Promise<Post> {
    const projectIdFromDto = createPostDto.projectId;

    // 1. Verify project ownership (ensures the authenticated user can post to this project)
    await this.verifyProjectOwnership(projectIdFromDto, authorId);
    
    // 2. Determine slug
    const slug = createPostDto.slug 
        ? this.generateSlug(createPostDto.slug) 
        : this.generateSlug(createPostDto.title);

    // 3. Validate unique slug per project
    const existingPost = await this.postsRepository.findOne({
      where: { projectId: projectIdFromDto, slug }, 
    });

    if (existingPost) {
      throw new ConflictException(`A post with slug '${slug}' already exists in project ID ${projectIdFromDto}.`);
    }

    // 4. Create and save post (No 'userId' field to save)
    const newPost = this.postsRepository.create({
      ...createPostDto,
      projectId: projectIdFromDto,
      slug,
    });

    return this.postsRepository.save(newPost);
  }

  /**
   * Public helper to find all projects owned by a user (used by controller public API).
   */
  async findAllProjectsByUserId(userId: number): Promise<Project[]> {
    return this.projectRepository.find({ select: ['id'], where: { userId } });
  }

  /**
   * Gets all posts belonging to the projects owned by the specified user (for dashboard).
   */
  async findAllByProjects(userId: number): Promise<Post[]> {
    // 1. Find all project IDs owned by the user
    const projects = await this.findAllProjectsByUserId(userId);
    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
        return [];
    }

    // 2. Fetch all posts associated with those project IDs
    return this.postsRepository.find({
      where: { projectId: In(projectIds) }, 
      order: { createdAt: 'DESC' },
    });
  }
  
  /**
   * Finds a single post by slug across a list of project IDs (used by public API).
   */
  async findOneBySlugAndProjectIds(projectIds: number[], slug: string): Promise<Post | undefined> {
    // Search within any of the projects the user owns
    return this.postsRepository.findOne({ 
        where: { projectId: In(projectIds), slug }, 
    });
  }


  /**
   * Gets a single post by ID and verifies the post's parent project is owned by the user.
   */
  async findOneById(id: number, userId: number): Promise<Post> {
    // 1. Find the post by ID
    const post = await this.postsRepository.findOne({ where: { id } }); 
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found.`);
    }

    // 2. Verify ownership of the associated project
    await this.verifyProjectOwnership(post.projectId, userId);
    
    return post;
  }

  /**
   * Updates an existing post and verifies project ownership.
   */
  async update(id: number, userId: number, updatePostDto: UpdatePostDto): Promise<Post> {
    // 1. Find the post and verify project ownership
    const post = await this.findOneById(id, userId); // findOneById already performs ownership check

    let finalSlug = post.slug;

    if (updatePostDto.title || updatePostDto.slug) {
        // Recalculate slug if title or slug is being updated
        const newSlug = updatePostDto.slug 
            ? this.generateSlug(updatePostDto.slug) 
            : this.generateSlug(updatePostDto.title || post.title);

        // Check for conflict only if the new slug is different from the current one
        if (newSlug !== post.slug) {
            // Check unique slug within the same project
            const existingPost = await this.postsRepository.findOne({
                where: { projectId: post.projectId, slug: newSlug }, 
            });

            if (existingPost && existingPost.id !== id) {
                throw new ConflictException(`Another post with slug '${newSlug}' already exists in this project.`);
            }
        }
        finalSlug = newSlug;
    }

    // Validate ownership if the user tries to move the post to a different project
    if (updatePostDto.projectId && updatePostDto.projectId !== post.projectId) {
        await this.verifyProjectOwnership(updatePostDto.projectId, userId);
    }
    
    await this.postsRepository.update(id, {
        ...updatePostDto,
        slug: finalSlug,
    });

    return this.postsRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Deletes a post and verifies project ownership.
   */
  async remove(id: number, userId: number): Promise<void> {
    // 1. Find the post and verify project ownership
    const post = await this.findOneById(id, userId); // findOneById already performs ownership check

    // 2. Perform the delete based on post ID
    const result = await this.postsRepository.delete({ id: post.id }); 
    
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID "${id}" could not be deleted.`);
    }
  }
}