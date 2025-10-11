import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/user/entities/user.entity';

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
      // Destructure password out of the returned object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * Validates user credentials and returns a JWT token.
   */
  /**
   * Generates a JWT access token for a validated user.
   */
  async login(user: User) {
    const payload = { 
        username: user.username, 
        sub: user.id 
    };

    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION_TIME') || '3600s';

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: jwtExpiration }),
      user_id: user.id,
      username: user.username,
    };
  }

}
