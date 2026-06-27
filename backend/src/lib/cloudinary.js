import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Uploads an in-memory file buffer to Cloudinary, returns the result.
export function uploadBuffer(buffer, folder = 'budgies') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export function deleteByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

// Deletes multiple resources by their public IDs in a single API call.
// Cloudinary allows up to 100 IDs per request; we chunk larger arrays.
export async function deleteManyByPublicIds(publicIds) {
  if (!publicIds || publicIds.length === 0) return;
  const CHUNK = 100;
  for (let i = 0; i < publicIds.length; i += CHUNK) {
    await cloudinary.api
      .delete_resources(publicIds.slice(i, i + CHUNK), { resource_type: 'image' })
      .catch(() => {}); // best-effort — don't fail the caller
  }
}

export default cloudinary;