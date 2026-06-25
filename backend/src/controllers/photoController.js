import Photo from '../models/photo.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { uploadBuffer, deleteByPublicId } from '../lib/cloudinary.js';

export const listPhotos = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const query = { couple: req.user.couple };
  if (req.query.before) query.takenAt = { $lt: new Date(req.query.before) };

  const photos = await Photo.find(query)
    .sort({ takenAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'name accentColor');
  res.json({ photos });
});

export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

  // Stream the in-memory buffer to Cloudinary
  const result = await uploadBuffer(req.file.buffer, 'budgies');

  const photo = await Photo.create({
    couple: req.user.couple,
    uploadedBy: req.user._id,
    url: result.secure_url,
    publicId: result.public_id,
    caption: req.body.caption || '',
    takenAt: req.body.takenAt ? new Date(req.body.takenAt) : new Date(),
  });
  await photo.populate('uploadedBy', 'name accentColor');
  res.status(201).json({ photo });
});

export const updatePhoto = asyncHandler(async (req, res) => {
  const photo = await Photo.findOne({
    _id: req.params.id,
    couple: req.user.couple,
  });
  if (!photo) return res.status(404).json({ message: 'Photo not found' });

  if (req.body.caption !== undefined) photo.caption = req.body.caption;
  if (req.body.takenAt !== undefined) photo.takenAt = new Date(req.body.takenAt);
  await photo.save();
  res.json({ photo });
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const photo = await Photo.findOne({
    _id: req.params.id,
    couple: req.user.couple,
  });
  if (!photo) return res.status(404).json({ message: 'Photo not found' });

  // Remove from Cloudinary too (best-effort)
  if (photo.publicId) {
    deleteByPublicId(photo.publicId).catch(() => {});
  }
  await photo.deleteOne();
  res.json({ message: 'Deleted' });
});