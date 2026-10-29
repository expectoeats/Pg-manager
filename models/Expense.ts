import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExpense extends Document {
  category: 'grocery' | 'cleaning' | 'repair' | 'wifi' | 'electricity' | 'water' | 'salary' | 'other';
  amount: number;
  date: Date;
  note?: string;
  createdBy: Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpense>({
  category: {
    type: String,
    enum: ['grocery', 'cleaning', 'repair', 'wifi', 'electricity', 'water', 'salary', 'other'],
    required: true,
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  note: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
