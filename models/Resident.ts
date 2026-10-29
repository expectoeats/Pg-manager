import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IResident extends Document {
  name: string;
  mobile: string;
  alternateMobile?: string;
  photoUrl?: string;
  idProofType?: string;
  idProofNumber?: string;
  idProofFileUrl?: string;
  guardianName?: string;
  guardianMobile?: string;
  room: Types.ObjectId;
  bed: Types.ObjectId;
  currentPlan: Types.ObjectId;
  joiningDate: Date;
  status: 'active' | 'notice' | 'left';
  noticeDate?: Date | null;
  expectedLeavingDate?: Date | null;
  leavingDate?: Date | null;
  notes?: string;
}

const ResidentSchema = new Schema<IResident>({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  alternateMobile: { type: String },
  photoUrl: { type: String },
  idProofType: { type: String },
  idProofNumber: { type: String },
  idProofFileUrl: { type: String },
  guardianName: { type: String },
  guardianMobile: { type: String },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  bed: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
  currentPlan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'notice', 'left'], default: 'active' },
  noticeDate: { type: Date, default: null },
  expectedLeavingDate: { type: Date, default: null },
  leavingDate: { type: Date, default: null },
  notes: { type: String },
}, { timestamps: true });

const Resident: Model<IResident> = mongoose.models.Resident || mongoose.model<IResident>('Resident', ResidentSchema);
export default Resident;
