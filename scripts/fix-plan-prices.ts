/**
 * One-time script to fix Double Sharing + All Meals plan price from ₹7,000 to ₹8,000
 * Run with: npx tsx scripts/fix-plan-prices.ts
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read MongoDB URI from .env.local
const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const mongoUriMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoUriMatch ? mongoUriMatch[1].trim() : '';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not found in .env.local');
}

async function fixPlanPrices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const Plan = mongoose.model('Plan', new mongoose.Schema({}, { strict: false }));

    // List all plans first
    const allPlans = await Plan.find({}).sort({ name: 1 });
    console.log('\n📋 All plans in database:');
    allPlans.forEach((plan: any) => {
      console.log(`- ${plan.name} | Type: ${plan.type} | Sharing: ${plan.sharingType} | Price: ₹${plan.price}`);
    });

    // Find the Double Sharing + All Meals plan
    const doubleSharingPlan: any = await Plan.findOne({
      name: { $regex: /double.*all meals/i }
    });

    if (doubleSharingPlan) {
      console.log(`\n✓ Found plan: ${doubleSharingPlan.name}`);
      console.log(`  ID: ${doubleSharingPlan._id}`);
      console.log(`  Current price: ₹${doubleSharingPlan.price}`);
      console.log(`  Current sharingType: ${doubleSharingPlan.sharingType}`);
      
      // Use findByIdAndUpdate instead
      const result: any = await Plan.findByIdAndUpdate(
        doubleSharingPlan._id,
        {
          $set: {
            price: 8000,
            sharingType: 'double'
          }
        },
        { new: true }
      );
      
      if (result) {
        console.log('  ✅ Updated price to ₹8,000');
        console.log('  ✅ Fixed sharingType to "double"');
        console.log('\n✓ Verification:');
        console.log(`  Price: ₹${result.price}`);
        console.log(`  SharingType: ${result.sharingType}`);
      }
    } else {
      console.log('\n❌ Double Sharing + All Meals plan not found - it may need to be created');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPlanPrices();
