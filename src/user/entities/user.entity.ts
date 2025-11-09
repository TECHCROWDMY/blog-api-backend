import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Project } from 'src/projects/entities/project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed password

  // @OneToMany(() => Post, (post) => post.user)
  // posts: Post[];

  // --- NEW RELATIONSHIP: USER to PROJECTS ---
  // A User can have many Projects (One-to-Many)
  @OneToMany(() => Project, (project) => project.user)
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;
}
