import mongoose, { Schema, model, models } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Habit State Schema (MDP tracking)
const HabitStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  habitStrength: { type: Number, required: true, min: 0, max: 10, default: 5 },
  lastLoggedAt: { type: Date, required: true, default: Date.now },
  history: [{
    date: { type: Date, default: Date.now },
    habitStrength: Number,
    action: { type: String, enum: ['log', 'omission'] },
    reward: Number
  }]
}, { timestamps: true });

// Carbon Log Schema
const CarbonLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['electricity', 'gas', 'water', 'voice_log', 'receipt'] },
  fileName: { type: String },
  rawText: { type: String },
  billDetails: {
    utilityCompany: String,
    billingPeriod: String,
    amountDue: Number,
    consumption: Number, // In original units
    units: String,       // kWh, therms, gallons, etc.
    zipCode: String,
    state: String
  },
  co2EmissionsKg: { type: Number, required: true },
  eGRIDSubregion: { type: String },
  eGRIDFactor: { type: Number }, // kg CO2 / kWh
  createdAt: { type: Date, default: Date.now }
});

export const User = models.User || model('User', UserSchema);
export const HabitState = models.HabitState || model('HabitState', HabitStateSchema);
export const CarbonLog = models.CarbonLog || model('CarbonLog', CarbonLogSchema);
