import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDeposit extends Document {
  resident: Types.ObjectId;
  amount: number;
  status: 'pending' | 'held' | 'refunded' | 'forfeited' | 'adjusted';
  receivedDate?: Date;
  refundDate?: Date;
  refundAmount?: number;
  deductions: { reason: string; amount: number }[];
  refundEligible: boolean;
}

const DepositSchema = new Schema<IDeposit>({
  resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
  amount: { type: Number, required: true, default: 2000 },
  status: { type: String, enum: ['pending', 'held', 'refunded', 'forfeited', 'adjusted'], default: 'pending' },
  receivedDate: { type: Date },
  refundDate: { type: Date },
  refundAmount: { type: Number },
  deductions: [{ reason: { type: String }, amount: { type: Number } }],
  refundEligible: { type: Boolean, default: false },
}, { timestamps: true });

const Deposit: Model<IDeposit> = mongoose.models.Deposit || mongoose.model<IDeposit>('Deposit', DepositSchema);
export default Deposit;
