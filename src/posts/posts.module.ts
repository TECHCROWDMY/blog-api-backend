import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { Project } from '../projects/entities/project.entity'; // Import Project entity
import { UsersModule } from '../user/user.module'; // Required for the PostsController's public API

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Project]), 
    UsersModule
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService]
})
export class PostsModule {}