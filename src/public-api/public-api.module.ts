import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { Post } from 'src/posts/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  // Import the entities needed for read operations in the service
  imports: [TypeOrmModule.forFeature([Post, User])], 
  controllers: [PublicApiController],
  providers: [PublicApiService],
})
export class PublicApiModule {}
