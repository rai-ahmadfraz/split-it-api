import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { UserService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller()
export class AuthController {

    constructor(private authService:AuthService, private userService:UserService) {}

    @Post('login')
    login(@Body() loginUserDto:LoginUserDto) {
       return this.authService.signIn(loginUserDto);
    }

    @Post('register')
    register(@Body() createUserDto:CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }
}
