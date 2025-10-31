import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { Expense } from 'src/entities/expense.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseMember } from 'src/entities/expensemember.entity';
@Module({
    imports: [TypeOrmModule.forFeature([Expense,ExpenseMember])],
    controllers: [ExpenseController],   
    providers: [ExpenseService],   
})
export class ExpenseModule {}
