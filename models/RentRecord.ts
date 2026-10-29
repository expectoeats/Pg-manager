import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRentRecord extends Document {
  resident: Types.ObjectId;
  month: string;
  planSnapshot: { name: string; price: number };
  amountDue: number;
  amountPaid: number;
  status: 'pending' | 'partial' | 'paid';
  dueDate: Date;
  adjustments: { reason: string; amount: number }[];
}

const RentRecordSchema = new Schema<IRentRecord>({
  resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
  month: { type: String, required: true },
  planSnapshot: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  dueDate: { type: Date, required: true },
  adjustments: [{ reason: { type: String }, amount: { type: Number } }],
}, { timestamps: true });

RentRecordSchema.index({ resident: 1, month: 1 }, { unique: true });

const RentRecord: Model<IRentRecord> = mongoose.models.RentRecord || mongoose.model<IRentRecord>('RentRecord', RentRecordSchema);
export default RentRecord;
