import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Mirrors the S3 client config in src/payload/payload.config.ts (R2 is S3-compatible).
const PRESIGN_EXPIRY_SECONDS = 15 * 60;

function requireBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not configured");
  return bucket;
}

let cached: S3Client | null = null;
function getR2Client(): S3Client {
  if (cached) return cached;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured");
  }
  cached = new S3Client({
    endpoint,
    region: "auto",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

/** Presigned PUT URL (15 min) for a temp object. ContentType is part of the signature. */
export async function presignPutUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: requireBucket(), Key: key, ContentType: contentType }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS },
  );
}

/** Download a temp object server-side (no request-body limit applies here). */
export async function getObjectBuffer(
  key: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await getR2Client().send(new GetObjectCommand({ Bucket: requireBucket(), Key: key }));
  if (!res.Body) throw new Error(`Temp object has no body: ${key}`);
  const bytes = await res.Body.transformToByteArray();
  return { buffer: Buffer.from(bytes), contentType: res.ContentType ?? "application/octet-stream" };
}

export async function deleteObject(key: string): Promise<void> {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }));
}
