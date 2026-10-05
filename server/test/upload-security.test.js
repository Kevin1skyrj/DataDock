import assert from "node:assert/strict";
import test from "node:test";

import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createUploadCommand } from "../src/utils/s3-upload-command.js";

test("presigned uploads bind the request to the approved file size", async () => {
  const command = createUploadCommand({
    bucket: "datadock-test",
    storageKey: "users/user-id/objects/object-id",
    mimeType: "image/jpeg",
    size: 133_000,
  });

  assert.equal(command.input.ContentLength, 133_000);

  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "AKIATEST",
      secretAccessKey: "test-secret",
    },
  });
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  const signedHeaders = new URL(signedUrl).searchParams.get("X-Amz-SignedHeaders");

  assert.ok(signedHeaders?.split(";").includes("content-length"));
});
