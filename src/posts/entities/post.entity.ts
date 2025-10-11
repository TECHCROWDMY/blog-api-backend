import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  Unique 
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity('posts')
// Constraint to ensure the slug is unique for a given user.
@Unique(['user', 'slug']) 
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

  // 'simple-array' type stores array as a comma-separated string in Postgres
  @Column('simple-array', { nullable: true })
  tags: string[];

  // Relation to User entity
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  user: User;
  
  // This column will store the user ID (foreign key)
  @Column()
  userId: number; 

  @CreateDateColumn()
  createdAt: Date;
}
