import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBed extends Document {
  room: Types.ObjectId;
  bedLabel: string;
  status: 'vacant' | 'occupied';
  currentResident?: Types.ObjectId | null;
}

const BedSchema = new Schema<IBed>({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  bedLabel: { type: String, required: true },
  status: { type: String, enum: ['vacant', 'occupied'], default: 'vacant' },
  currentResident: { type: Schema.Types.ObjectId, ref: 'Resident', default: null },
}, { timestamps: true });

const Bed: Model<IBed> = mongoose.models.Bed || mongoose.model<IBed>('Bed', BedSchema);
export default Bed;
