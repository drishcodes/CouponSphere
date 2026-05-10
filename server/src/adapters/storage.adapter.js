import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function createStorageClient() {
  if (!process.env.S3_BUCKET) {
    return {
      uploadCouponImage: async ({ key }) => ({ url: `/mock-assets/${key}` })
    };
  }

  const client = new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  });

  return {
    uploadCouponImage: async ({ key, body, contentType }) => {
      await client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType
      }));
      const base = process.env.CDN_BASE_URL || process.env.S3_ENDPOINT;
      return { url: `${base}/${process.env.S3_BUCKET}/${key}` };
    }
  };
}

