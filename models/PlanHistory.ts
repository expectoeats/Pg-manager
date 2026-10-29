import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPlanHistory extends Document {
  resident: Types.ObjectId;
  plan: Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
}

const PlanHistorySchema = new Schema<IPlanHistory>({
  resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, default: null },
}, { timestamps: true });

const PlanHistory: Model<IPlanHistory> = mongoose.models.PlanHistory || mongoose.model<IPlanHistory>('PlanHistory', PlanHistorySchema);
export default PlanHistory;
