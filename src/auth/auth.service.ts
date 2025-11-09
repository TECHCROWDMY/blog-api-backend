import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/user/entities/user.entity';
import { UsersService } from 'src/user/user.service';
import { Injectable, ConflictException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,

  ) {
    this.saltRounds = configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
  }

    /**
   * Validates the user's credentials using email and password.
   * @param email The user's email address.
   * @param pass The plain text password.
   * @returns The user object (excluding password) if valid, or null.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Registers a new user.
   */
  async register(registerDto: RegisterDto): Promise<{ username: string, email: string }> {
    // Check for existing username
    const existingUserByUsername = await this.usersService.findOneByUsername(registerDto.username);
    if (existingUserByUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Check for existing email
    const existingUserByEmail = await this.usersService.findOneByEmail(registerDto.email);
    if (existingUserByEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(registerDto.password, this.saltRounds);

    // Create and save the new user
    const newUser = await this.usersService.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
    });
    
    return { username: newUser.username, email: newUser.email };
  }

  /**
    * Generates a JWT access token for a validated user.
    * @param user The validated user entity.
    */
  async login(user: User) {
    const payload = { 
      id: user.id, 
      username: user.username,
      email: user.email,
    };

    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION_TIME') || '3600s';
    
    const token = this.jwtService.sign(payload, { expiresIn: jwtExpiration });

    // Clean up the response for the client
    return {
      access_token: token,
      id: user.id,
      username: user.username,
      email: user.email
    };
  }

}
