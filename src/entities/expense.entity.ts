import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { ExpenseMember } from "./expensemember.entity";
import { User } from "./user.entity";

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  name: string; // e.g., "Monal Dinner", "Taxi Ride"

  @Column('decimal', { precision: 10, scale: 2, name: 'total_amount', default: 0 })
  totalAmount: number;

  // User who created the expense entry
  @ManyToOne(() => User, (user) => user.createdExpenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // User who actually paid the bill
  @ManyToOne(() => User, (user) => user.paidExpenses, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'paid_id' })
  paidBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Members involved in this expense
  @OneToMany(() => ExpenseMember, (expenseMember) => expenseMember.expense)
  members: ExpenseMember[];
}
