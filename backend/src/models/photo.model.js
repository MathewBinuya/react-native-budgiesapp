import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    couple: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: null }, 
    caption: { type: String, default: '', maxlength: 500 },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

photoSchema.index({ couple: 1, takenAt: -1 });

export default mongoose.model('Photo', photoSchema);