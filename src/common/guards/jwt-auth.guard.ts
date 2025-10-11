import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard enforces JWT authentication on routes it is applied to.
// It relies on the 'jwt' strategy defined in src/auth/jwt.strategy.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
