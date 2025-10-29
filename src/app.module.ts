import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [AuthModule, UsersModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost', // or your database host
      port: 3306, // default MySQL port
      username: 'root', // your database username
      password: '', // your database password
      database: 'splitit_db', // your database name
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // auto-load entities
      synchronize: true, // automatically sync database schema (disable in production)
      // logging: true, // enable SQL query logging (optional)
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
