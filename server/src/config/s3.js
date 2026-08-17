import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_S3_BUCKET;

if (!region) {
  throw new Error("AWS_REGION is missing from environment variables");
}

if (!bucketName) {
  throw new Error("AWS_S3_BUCKET is missing from environment variables");
}

export const s3Client = new S3Client({ region });
export const s3BucketName = bucketName;

export async function verifyS3Connection() {
  await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  console.log(`S3 connected: ${bucketName}`);
}
