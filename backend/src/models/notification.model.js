import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    couple: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['check_in', 'pet_fed', 'pet_played', 'journal_written', 'pet_named', 'letter_received'],
      required: true,
    },
    read: { type: Boolean, default: false },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
