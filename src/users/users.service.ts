import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class UserService {

    constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

    async createUser(createUserDto:CreateUserDto) {

        const existingUser = await this.usersRepository.findOneBy({email: createUserDto.email});
        if(existingUser) {
            return {
                message: 'User with this email already exists'
            };
        }
        const user = this.usersRepository.create(createUserDto);  
        return await this.usersRepository.save(user);  
    }
}
