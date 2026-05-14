import { Router, type Request, type Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../lib/auth.js";

const router = Router();

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

// POST /api/uploads/sign
// Returns a signed upload params object for direct browser-to-Cloudinary upload.
// The browser uploads directly to Cloudinary, never through our server.
router.post("/sign", requireAuth, (req: Request, res: Response): void => {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({ error: "Image uploads not configured" });
    return;
  }

  const folder = (req.body as { folder?: string }).folder ?? "fixit247";
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder, overwrite: true };

  const signature = getCloudinary().utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!,
  );

  res.json({
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
});

export default router;
