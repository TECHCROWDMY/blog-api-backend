import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  /**
   * The user's email address, used for login identification.
   * Must be a valid format and cannot be empty.
   */
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @IsNotEmpty()
  email: string;

  /**
   * The user's password.
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
