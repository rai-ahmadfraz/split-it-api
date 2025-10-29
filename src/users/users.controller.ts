import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';    
@Controller('user')
@UseGuards(AuthGuard)
export class UsersController {
    
    @Get('profile')
    getProfile() {
        return { message: 'This is the user profile' };
    }
}
