import { Body, Controller, Get, HttpCode, HttpStatus, Post, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // 💡 Import AuthGuard
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return { message: 'User registered successfully', username: user.username, email: user.email };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Sets the response code to 200 for a successful login POST
  async login(@Body() loginDto: LoginDto) {
    // Call validateUser using email instead of username
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate and return JWT token
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    const { password, ...result } = req.user;
    return { user: result }; 
  }

}