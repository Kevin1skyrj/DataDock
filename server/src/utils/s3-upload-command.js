import { PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Bind an upload URL to the exact object the API approved.
 *
 * ContentLength becomes a signed header in the presigned URL. Browsers set
 * that header from the File body (JavaScript is not allowed to forge it), so
 * S3 rejects a body whose size differs before storing the object.
 */
export function createUploadCommand({ bucket, storageKey, mimeType, size }) {
  return new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: size,
  });
}
