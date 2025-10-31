import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from 'src/entities/expense.entity';
import { Repository } from 'typeorm';
import { ExpenseMember } from 'src/entities/expensemember.entity';
@Injectable()
export class ExpenseService {

    constructor(@InjectRepository(Expense) private expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseMember) private expenseMemberRepository: Repository<ExpenseMember>, ) {}


    async createExpense(createExpenseDto: CreateExpenseDto,user_id:number) {
        const { name, amount, paid_id, participants } = createExpenseDto;

        const nameExists = await this.findByNameAndUserId(name,user_id);
        if(nameExists){
            throw new BadRequestException('Name already exists');
        }
        // Step 1: Create the expense record
        const expense = this.expenseRepository.create({
            name,
            totalAmount:amount,
            user: { id: user_id },
            paidBy: { id: paid_id },
        });
        await this.expenseRepository.save(expense);

        // Step 2: Handle participant shares
        let membersToInsert: ExpenseMember[] = [];

        if (participants && participants.length > 0) {
            const equalShare = amount / participants.length;

            for (const p of participants) {
            let shareAmount = 0;

            if (p.share_type === 'equal') {
                shareAmount = equalShare;
            } else if (p.share_type === 'percentage') {
                shareAmount = (amount * (p.share_value || 0)) / 100;
            } else if (p.share_type === 'fixed') {
                shareAmount = p.share_value || 0;
            }

            
            const member = this.expenseMemberRepository.create({
                expense: { id: expense.id },
                user: { id: p.id },
                shareType: p.share_type,
                shareValue: p.share_value || null,
                amountOwed: shareAmount,
            });

            membersToInsert.push(member);
            }

            await this.expenseMemberRepository.save(membersToInsert);
        }

        return {
            message: 'Expense created successfully',
            expense,
            members: membersToInsert,
        };
    }

    async findByNameAndUserId(name: string, userId: number) {
        return this.expenseRepository.findOne({
            where: {
            name,
            user: { id: userId },
            }
        });
    }

    async getUserNetBalances(userId: number) {
  // 1️⃣ Who owes me (I paid)
    const owedToMe = await this.expenseMemberRepository
        .createQueryBuilder('em')
        .innerJoin('em.expense', 'expense')
        .innerJoin('em.user', 'user')
        .where('expense.paidBy = :userId', { userId })
        .andWhere('em.user != :userId', { userId })
        .andWhere('em.amountOwed > 0')
        .select([
        'user.id AS userId',
        'user.name AS userName',
        'SUM(em.amountOwed) AS total',
        ])
        .groupBy('user.id')
        .getRawMany();

    // 2️⃣ Who I owe (they paid)
    const iOwe = await this.expenseMemberRepository
        .createQueryBuilder('em')
        .innerJoin('em.expense', 'expense')
        .innerJoin('expense.paidBy', 'payer')
        .where('em.user = :userId', { userId })
        .andWhere('expense.paidBy != :userId', { userId })
        .andWhere('em.amountOwed > 0')
        .select([
        'payer.id AS userId',
        'payer.name AS userName',
        'SUM(em.amountOwed) AS total',
        ])
        .groupBy('payer.id')
        .getRawMany();

    // 3️⃣ Merge both sides (calculate net balance)
    const balanceMap = new Map<number, { userId: number; userName: string; balance: number }>();

    for (const o of owedToMe) {
        balanceMap.set(Number(o.userId), {
        userId: Number(o.userId),
        userName: o.userName,
        balance: Number(o.total),
        });
    }

    for (const o of iOwe) {
        const existing = balanceMap.get(Number(o.userId));
        if (existing) {
        existing.balance -= Number(o.total);
        } else {
        balanceMap.set(Number(o.userId), {
            userId: Number(o.userId),
            userName: o.userName,
            balance: -Number(o.total),
        });
        }
    }

    // 4️⃣ Create array with status
    const details = Array.from(balanceMap.values()).map(b => ({
        ...b,
        status:
        b.balance > 0
            ? 'owes you'
            : b.balance < 0
            ? 'you owe'
            : 'settled',
    }));

    // 5️⃣ Compute overall net balance
    const overall = details.reduce((sum, d) => sum + d.balance, 0);

    const overallStatus =
        overall > 0
        ? `You are owed ${overall.toFixed(2)}`
        : overall < 0
        ? `You owe ${Math.abs(overall).toFixed(2)}`
        : 'All settled!';

    return {
        summary: {
        totalOwedToYou: owedToMe.reduce((s, o) => s + Number(o.total), 0),
        totalYouOwe: iOwe.reduce((s, o) => s + Number(o.total), 0),
        netBalance: overall,
        overallStatus,
        },
        details,
    };
    }

async getUserExpensesWithFriend(userId: number, friendId: number) {
  // 1️⃣ Fetch all expenses involving either userId or friendId
  const expenses = await this.expenseMemberRepository
    .createQueryBuilder('em')
    .innerJoinAndSelect('em.expense', 'expense')
    .innerJoinAndSelect('expense.paidBy', 'payer')
    .innerJoinAndSelect('em.user', 'member')
    .where(
      '(expense.paidBy = :userId AND em.user = :friendId) OR (expense.paidBy = :friendId AND em.user = :userId)',
      { userId, friendId }
    )
    .select([
      'expense.id AS "expenseId"',
      'expense.name AS "title"',
      'expense.total_amount AS "totalAmount"',
      'expense.paid_id AS "paidById"',
      'payer.name AS "paidByName"',
      'em.user_id AS "memberId"',
      'member.name AS "memberName"',
      'em.amount_owed AS "amountOwed"',
      'expense.created_at AS "createdAt"',
    ])
    .orderBy('expense.created_at', 'DESC')
    .getRawMany();

  // 2️⃣ Get unique expense IDs
  const expenseIds = expenses.map(e => e.expenseId);

  if (expenseIds.length === 0) {
    return {
      summary: { netBalance: 0, overallStatus: 'No shared expenses' },
      expenses: [],
    };
  }

  // 3️⃣ Fetch ALL members for those expenses
  const allMembers = await this.expenseMemberRepository
    .createQueryBuilder('em')
    .innerJoin('em.user', 'user')
    .where('em.expense_id IN (:...expenseIds)', { expenseIds })
    .select([
      'em.expense_id AS "expenseId"',
      'user.id AS "userId"',
      'user.name AS "userName"',
      'em.amount_owed AS "amountOwed"',
    ])
    .getRawMany();

  // 4️⃣ Group members by expenseId
  const memberMap = allMembers.reduce((map, m) => {
    if (!map[m.expenseId]) map[m.expenseId] = [];
    map[m.expenseId].push({
      userId: Number(m.userId),
      name: m.userName,
      amount: Number(m.amountOwed),
    });
    return map;
  }, {} as Record<number, { userId: number; name: string; amount: number }[]>);

  // 5️⃣ Format final expenses list
  const formatted = expenses.map(e => ({
    expenseId: e.expenseId,
    title: e.title,
    totalAmount: Number(e.totalAmount),
    paidBy: {
      userId: e.paidById,
      name: e.paidByName,
    },
    owes: {
      userId: e.memberId,
      name: e.memberName,
      amount: Number(e.amountOwed),
    },
    members: memberMap[e.expenseId] || [],
    createdAt: e.createdAt,
    status:
      e.paidById === userId
        ? 'owes you'
        : 'you owe',
  }));

  // 6️⃣ Compute net balance between you and the friend
  const netBalance = formatted.reduce((sum, e) => {
    return e.paidBy.userId === userId ? sum + e.owes.amount : sum - e.owes.amount;
  }, 0);

  return {
    summary: {
      netBalance,
      overallStatus:
        netBalance > 0
          ? `You are owed ${netBalance.toFixed(2)}`
          : netBalance < 0
          ? `You owe ${Math.abs(netBalance).toFixed(2)}`
          : 'Settled',
    },
    expenses: formatted,
  };
}


    
}
