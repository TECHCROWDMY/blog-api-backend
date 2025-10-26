import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';

// Define the shape of the JWT payload
export interface JwtPayload {
  userId: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validates the payload extracted from the JWT.
   * If valid, it returns the user object which is attached to req.user.
   */
  async validate(payload: JwtPayload): Promise<User | never> {
    const user = await this.usersService.findOneById(payload.userId);

    if (!user) {
      throw new UnauthorizedException();
    }
    
    // We return a simplified user object for the request object
    return { 
        id: user.id, 
        username: user.username,
        email: user.email
        // Omit sensitive data like email and password from the request object
    } as any; 
  }
}
