import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  pgName: string;
  address: string;
  phone: string;
  depositAmount: number;
  noticePeriodDays: number;
  rentDueDay: number;
  defaultRatePerUnit: number;
  billingMode: 'calendar' | 'joining_cycle';
  prorateFirstMonth: boolean;
  receiptFooter: string;
}

const SettingsSchema = new Schema<ISettings>({
  pgName: { type: String, default: 'My PG' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  depositAmount: { type: Number, default: 2000 },
  noticePeriodDays: { type: Number, default: 20 },
  rentDueDay: { type: Number, default: 1 },
  defaultRatePerUnit: { type: Number, default: 8 },
  billingMode: { type: String, enum: ['calendar', 'joining_cycle'], default: 'calendar' },
  prorateFirstMonth: { type: Boolean, default: true },
  receiptFooter: { type: String, default: '' },
});

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings;
