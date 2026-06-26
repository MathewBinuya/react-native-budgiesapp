import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    couple: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    prompt: { type: String, default: null },
  },
  { timestamps: true }
);

journalEntrySchema.index({ couple: 1, createdAt: -1 });

export default mongoose.model('JournalEntry', journalEntrySchema);