import { Module } from '@nestjs/common';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../user/user.module';
import { PostsController } from './posts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    UsersModule
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService]
})
export class PostsModule {}
