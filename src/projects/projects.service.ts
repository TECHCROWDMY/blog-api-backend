import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
// Assuming you have an entity file named project.entity.ts
import { Project } from './entities/project.entity'; 

@Injectable()
export class ProjectsService {
  // 1. Inject the TypeORM Repository for the Project entity
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}


  /**
   * Creates a new project in the database.
   * @param createProjectDto The data transfer object for creating a project.
   * @param userId The ID of the authenticated user (MANDATORY for FK).
   * @returns The newly created project object.
   */
  async create(createProjectDto: CreateProjectDto, userId: number): Promise<Project> {
    // 💡 FIX: Create the entity and explicitly assign the userId
    const newProject = this.projectRepository.create({
      ...createProjectDto,
      userId: userId, // Set the mandatory foreign key value
    });
    
    return this.projectRepository.save(newProject);
  }

  /**
   * Retrieves all projects from the database, including the total number of associated posts.
   *
   * NOTE: This assumes the Project entity has a one-to-many relationship defined
   * named 'posts' that links to a Post entity.
   *
   * @returns An array of all projects, with each project object having an extra 'postCount' field.
   */
  async findAll(): Promise<Project[]> {
    // FIX: We must use the Query Builder for 'loadRelationCountAndMap',
    // as it is not supported in the standard repository.find() options.
    const projects = await this.projectRepository.createQueryBuilder('project')
        // 1. Alias the new property name ('project.postCount')
        // 2. Specify the relation name to count ('project.posts')
      .loadRelationCountAndMap('project.postCount', 'project.posts')
      .getMany();

    // The returned objects are Project instances with an extra number property `postCount`.
    return projects;
  }

  /**
   * Retrieves a single project by its ID.
   * @param id The ID of the project to find.
   * @returns The found project object.
   * @throws NotFoundException if the project does not exist.
   */
  async findOne(id: number): Promise<Project> {
    // .findOneBy() finds a single entity by a given criteria.
    const project = await this.projectRepository.findOneBy({ id });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  /**
   * Updates an existing project partially.
   * @param id The ID of the project to update.
   * @param updateProjectDto The data transfer object containing fields to update.
   * @returns The updated project object.
   * @throws NotFoundException if the project does not exist.
   */
  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    // Find the existing project first
    const project = await this.findOne(id);

    // .merge() combines the existing project data with the new DTO data
    this.projectRepository.merge(project, updateProjectDto);
    
    // .save() updates the existing entity because it has an ID
    return this.projectRepository.save(project);
  }

  /**
   * Removes a project from the database by its ID.
   * @param id The ID of the project to remove.
   * @returns A success message or the removed project (depending on controller design).
   * @throws NotFoundException if the project does not exist.
   */
  async remove(id: number): Promise<{ message: string, removedId: number }> {
    // .delete() performs the deletion.
    const result = await this.projectRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return { message: `Project #${id} successfully removed`, removedId: id };
  }
}