import mongoose from 'mongoose';

const petSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Mochi' },
    fullness: { type: Number, default: 70, min: 0, max: 100 },
    happiness: { type: Number, default: 70, min: 0, max: 100 },
    careLevel: { type: Number, default: 0, min: 0, max: 100 },
    stage: { type: String, enum: ['egg', 'chick', 'budgie'], default: 'egg' },
    lastCare: {
      date: { type: String, default: null },
      partnersWhoCared: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
  },
  { _id: false }
);

const coupleSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteCode: { type: String, unique: true, sparse: true },
    inviteCodeExpires: { type: Date, default: null },
    anniversary: { type: Date, default: null },
    nextDate: { type: Date, default: null },
    pet: { type: petSchema, default: () => ({}) },
    streak: {
      count: { type: Number, default: 0 },
      lastCheckIn: { type: String, default: null },
      checkedInDate: { type: String, default: null },
      checkedInToday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      brokenCount: { type: Number, default: 0 },
      restores: { type: Number, default: 3 },
      restoresMonth: { type: String, default: null },
    },
    // Mood ring — keyed by userId string, updated daily
    moods: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Shared bucket list
    bucketList: [{
      text: { type: String, required: true },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
      completedAt: { type: Date, default: null },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    }],
  },
  { timestamps: true }
);

export default mongoose.model('Couple', coupleSchema);