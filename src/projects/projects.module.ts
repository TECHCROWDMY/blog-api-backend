import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeORM module
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity'; // Import the Project entity

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]), 
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, TypeOrmModule.forFeature([Project])], 
})
export class ProjectsModule {}