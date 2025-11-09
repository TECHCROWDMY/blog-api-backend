import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, // <-- Re-added
  Unique 
} from 'typeorm';
// import { User } from 'src/user/entities/user.entity'; // Keep commented or remove
import { Project } from 'src/projects/entities/project.entity';

@Entity('posts')
// 🔑 FIX: Constraint must use the existing foreign key 'projectId' 
// to ensure the slug is unique ONLY within its parent project.
@Unique(['projectId', 'slug']) 
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  image: string;

  // 'simple-array' type stores array as a comma-separated string
  @Column('simple-array', { nullable: true })
  tags: string[];

  // --- RELATIONSHIP TO PROJECT (MANY-TO-ONE) ---
  @ManyToOne(() => Project, (project) => project.posts, { 
    onDelete: 'CASCADE', 
    nullable: false, 
  })
  project: Project;

  // This column stores the foreign key (project.id)
  @Column()
  projectId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn() // <-- Re-added for tracking last update time
  updatedAt: Date;
}
