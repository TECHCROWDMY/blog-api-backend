import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { UsersService } from './user.service';

// This controller provides a simple endpoint to fetch the authenticated user's profile
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Req() req: Request) {
        // req.user is populated by JwtAuthGuard and JwtStrategy
        const user = req.user as { userId: number, username: string };
        const userData = await this.usersService.findOneById(user.userId);
        
        // Hide sensitive information (like the password hash)
        if (!userData) {
            return { message: 'User not found' };
        }
        
        const { password, ...result } = userData;
        return result;
    }
}
