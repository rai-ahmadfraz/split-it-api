import { Injectable,UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService, @InjectRepository(User) private userRespository: Repository<User>) {}
    
    async signIn(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const user = await this.userRespository.createQueryBuilder('user').addSelect('user.password')
        .where('user.email = :email', { email: loginUserDto.email }).getOne();

    if (!user) {
        throw new UnauthorizedException('Invalid credentials');
    }
    const isValidPassword = await user.validatePassword(loginUserDto.password);
    
    if (isValidPassword) {
        const payload = { sub: user.id, username: user.email };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
    throw new UnauthorizedException('Invalid credentials');
}
}
