import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  resident: Types.ObjectId;
  type: 'rent' | 'deposit' | 'electricity' | 'other';
  rentRecord?: Types.ObjectId;
  electricityShare?: Types.ObjectId;
  amount: number;
  method: 'cash' | 'upi' | 'bank';
  transactionRef?: string;
  paymentDate: Date;
  receiptNumber: string;
  isReversal: boolean;
  reversalOf?: Types.ObjectId | null;
  note?: string;
  createdBy: Types.ObjectId;
}

const PaymentSchema = new Schema<IPayment>({
  resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
  type: { type: String, enum: ['rent', 'deposit', 'electricity', 'other'], required: true },
  rentRecord: { type: Schema.Types.ObjectId, ref: 'RentRecord' },
  electricityShare: { type: Schema.Types.ObjectId },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'upi', 'bank'], required: true },
  transactionRef: { type: String },
  paymentDate: { type: Date, required: true },
  receiptNumber: { type: String, required: true, unique: true },
  isReversal: { type: Boolean, default: false },
  reversalOf: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  note: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
