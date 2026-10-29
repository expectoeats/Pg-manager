import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IElectricityBill extends Document {
  room: Types.ObjectId;
  month: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  shares: {
    resident: Types.ObjectId;
    daysStayed: number;
    amount: number;
    amountPaid: number;
    status: 'pending' | 'paid';
  }[];
  status: 'draft' | 'finalized';
}

const ElectricityBillSchema = new Schema<IElectricityBill>({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  month: { type: String, required: true },
  previousReading: { type: Number, required: true },
  currentReading: { type: Number, required: true },
  unitsConsumed: { type: Number, required: true },
  ratePerUnit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  shares: [{
    resident: { type: Schema.Types.ObjectId, ref: 'Resident' },
    daysStayed: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  }],
  status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
}, { timestamps: true });

const ElectricityBill: Model<IElectricityBill> = mongoose.models.ElectricityBill || mongoose.model<IElectricityBill>('ElectricityBill', ElectricityBillSchema);
export default ElectricityBill;
