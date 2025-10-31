import { BadRequestException, Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';

@Controller('expense')
@UseGuards(AuthGuard)
export class ExpenseController {

    constructor(private expenseService: ExpenseService) {}

    @Post('create')
    createExpense(@Body() createExpenseDto:CreateExpenseDto,@Req() req: Request) {
        return this.expenseService.createExpense(createExpenseDto,req.user.id);
    }

    @Get()
    findMyExpenses(@Req() req: Request){
        return this.expenseService.getUserNetBalances(req.user.id);
    }

    @Get(':id')
    getUserExpensesWithFriend(@Req() req: Request, @Param('id') id: string) {
        const userId = (req.user as any).id;

        if(userId == id){
            throw new BadRequestException('Invalid id');
        }
        return this.expenseService.getUserExpensesWithFriend(userId, Number(id));
    }

}
