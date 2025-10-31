import { IsNotEmpty } from "class-validator";

export class CreateExpenseDto {
    @IsNotEmpty({message:'Name is required'})   
    name: string;
    
    @IsNotEmpty({message:'Amount is required'})   
    amount: number;

    @IsNotEmpty({message:'Payer id is required'})   
    paid_id: number;  

    @IsNotEmpty({message:'Participants id"s is required'})   
    participants: {
        id: number;
        share_type: 'equal' | 'percentage' | 'fixed';
        share_value?: number;
    }[];
}
