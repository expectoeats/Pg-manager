import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  sharingType: 'double' | 'triple';
  totalBeds: number;
  floor?: string;
  isActive: boolean;
  hasSubMeter: boolean;
}

const RoomSchema = new Schema<IRoom>({
  roomNumber: { type: String, required: true, unique: true },
  sharingType: { type: String, enum: ['double', 'triple'], required: true },
  totalBeds: { type: Number, required: true },
  floor: { type: String },
  isActive: { type: Boolean, default: true },
  hasSubMeter: { type: Boolean, default: false },
}, { timestamps: true });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
export default Room;
