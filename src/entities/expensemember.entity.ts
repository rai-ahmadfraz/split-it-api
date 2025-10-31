import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  Unique 
} from "typeorm";
import { Expense } from "./expense.entity";
import { User } from "./user.entity";

@Unique(['expense', 'user']) // Prevent duplicate users in same expense
@Entity('expense_members')
export class ExpenseMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Expense, (expense) => expense.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @ManyToOne(() => User, (user) => user.expenseMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 20, name: 'share_type', default: 'equal' })
  shareType: string; // 'equal' | 'percentage' | 'fixed'

  @Column('decimal', { precision: 5, scale: 2, name: 'share_value', nullable: true })
  shareValue: number | null;

  @Column('decimal', { precision: 10, scale: 2, name: 'amount_owed', default: 0 })
  amountOwed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
