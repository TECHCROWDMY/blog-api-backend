import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  /**
   * The descriptive name of the project.
   * @example "My Awesome Blog Series"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  /**
   * The URL-friendly slug for the project.
   * @example "my-awesome-blog-series"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  slug: string;
}
