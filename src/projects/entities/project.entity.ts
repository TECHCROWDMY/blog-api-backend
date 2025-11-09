import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';
import { User } from 'src/user/entities/user.entity'; // Assuming user entity path
import { Post } from 'src/posts/entities/post.entity'; // Assuming post entity path

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // The user-facing name of the project

  @Column({ unique: true })
  slug: string; // URL-friendly identifier

  // --- RELATIONSHIP TO USER (MANY-TO-ONE) ---
  // A Project belongs to ONE User
  @ManyToOne(() => User, (user) => user.projects, { 
    onDelete: 'CASCADE', // If user is deleted, delete their projects
    nullable: false, 
  })
  user: User;

  // This column stores the foreign key (user.id)
  @Column()
  userId: number; 

  // --- RELATIONSHIP TO POSTS (ONE-TO-MANY) ---
  // A Project has MANY Posts
  @OneToMany(() => Post, (post) => post.project)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}