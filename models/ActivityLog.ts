import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  summary: string;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  summary: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
