import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME || "pcolarugby-images";
const publicUrl = process.env.R2_PUBLIC_URL;

let _client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _client;
}

export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey && publicUrl);
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return key;
  } catch (err) {
    console.error("[r2] upload failed:", err);
    return null;
  }
}

export function r2PublicUrl(key: string): string {
  return `/api/media/${key}`;
}

export async function getR2Object(key: string) {
  const client = getClient();
  if (!client) return null;
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return response;
  } catch (err) {
    console.error("[r2] get failed:", err);
    return null;
  }
}
