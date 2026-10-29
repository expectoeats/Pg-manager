import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  type: 'room' | 'room_food' | 'food_only';
  sharingType: 'double' | 'triple' | 'none';
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  price: number;
  isActive: boolean;
}

const PlanSchema = new Schema<IPlan>({
  name: { type: String, required: true },
  type: { type: String, enum: ['room', 'room_food', 'food_only'], required: true },
  sharingType: { type: String, enum: ['double', 'triple', 'none'], default: 'none' },
  includesBreakfast: { type: Boolean, default: false },
  includesLunch: { type: Boolean, default: false },
  includesDinner: { type: Boolean, default: false },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Plan: Model<IPlan> = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
