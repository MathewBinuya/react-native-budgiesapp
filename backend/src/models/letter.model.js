import mongoose from 'mongoose';

const letterSchema = new mongoose.Schema(
  {
    couple: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, trim: true, maxlength: 80, default: '' },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    readAt: { type: Date, default: null },
    deletedBySender: { type: Boolean, default: false },
    deletedByRecipient: { type: Boolean, default: false },
  },
  { timestamps: true }
);

letterSchema.index({ to: 1, createdAt: -1 });
letterSchema.index({ from: 1, createdAt: -1 });

export default mongoose.model('Letter', letterSchema);
