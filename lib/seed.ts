import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Manually load .env.local for tsx execution outside Next.js
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI || '';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // Define inline models for seed script
  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true },
      passwordHash: String,
      role: String,
    },
    { timestamps: true }
  );
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const SettingsSchema = new mongoose.Schema({
    pgName: String,
    address: String,
    phone: String,
    depositAmount: Number,
    noticePeriodDays: Number,
    rentDueDay: Number,
    defaultRatePerUnit: Number,
    billingMode: String,
    prorateFirstMonth: Boolean,
    receiptFooter: String,
  });
  const Settings =
    mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

  const PlanSchema = new mongoose.Schema(
    {
      name: String,
      type: String,
      sharingType: String,
      includesBreakfast: Boolean,
      includesLunch: Boolean,
      includesDinner: Boolean,
      price: Number,
      isActive: Boolean,
    },
    { timestamps: true }
  );
  const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

  // 1. Create owner user
  const existingUser = await User.findOne({ email: 'admin@pg.com' });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await User.create({
      name: 'Owner',
      email: 'admin@pg.com',
      passwordHash,
      role: 'owner',
    });
    console.log('✓ Created owner user: admin@pg.com / admin123');
  } else {
    console.log('✓ Owner user already exists');
  }

  // 2. Create default Settings
  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      pgName: 'My PG',
      address: '',
      phone: '',
      depositAmount: 2000,
      noticePeriodDays: 20,
      rentDueDay: 1,
      defaultRatePerUnit: 8,
      billingMode: 'calendar',
      prorateFirstMonth: true,
      receiptFooter: 'Thank you for staying with us!',
    });
    console.log('✓ Created default settings');
  } else {
    console.log('✓ Settings already exist');
  }

  // 3. Seed Plans
  const plans = [
    {
      name: 'Triple Sharing - Room Only',
      type: 'room',
      sharingType: 'triple',
      includesBreakfast: false,
      includesLunch: false,
      includesDinner: false,
      price: 4500,
      isActive: true,
    },
    {
      name: 'Double Sharing - Room Only',
      type: 'room',
      sharingType: 'double',
      includesBreakfast: false,
      includesLunch: false,
      includesDinner: false,
      price: 5000,
      isActive: true,
    },
    {
      name: 'Triple Sharing - Room + All Meals',
      type: 'room_food',
      sharingType: 'triple',
      includesBreakfast: true,
      includesLunch: true,
      includesDinner: true,
      price: 7000,
      isActive: true,
    },
    {
      name: 'Breakfast Only',
      type: 'food_only',
      sharingType: 'none',
      includesBreakfast: true,
      includesLunch: false,
      includesDinner: false,
      price: 1500,
      isActive: true,
    },
    {
      name: 'Dinner Only',
      type: 'food_only',
      sharingType: 'none',
      includesBreakfast: false,
      includesLunch: false,
      includesDinner: true,
      price: 2000,
      isActive: true,
    },
    {
      name: 'Breakfast + Weekend Lunch',
      type: 'food_only',
      sharingType: 'none',
      includesBreakfast: true,
      includesLunch: false,
      includesDinner: false,
      price: 2000,
      isActive: true,
    },
    {
      name: 'Monthly Food Only (Canteen)',
      type: 'food_only',
      sharingType: 'none',
      includesBreakfast: true,
      includesLunch: true,
      includesDinner: true,
      price: 2600,
      isActive: true,
    },
  ];

  const existingPlans = await Plan.countDocuments();
  if (existingPlans === 0) {
    await Plan.insertMany(plans);
    console.log(`✓ Created ${plans.length} seed plans`);
  } else {
    console.log('✓ Plans already exist');
  }

  console.log('\nSeed complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
