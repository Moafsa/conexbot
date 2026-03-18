
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const S3_ENDPOINT = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin";
const S3_BUCKET = process.env.S3_BUCKET || process.env.MINIO_BUCKET || "media";
const S3_PUBLIC_URL =
    process.env.S3_PUBLIC_URL ||
    process.env.MINIO_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_S3_PUBLIC_URL ||
    "";

// Initialize S3 Client
const s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    },
});

export const StorageService = {
    async uploadFile(file: Blob | Buffer, filename: string, mimetype: string): Promise<string> {
        try {
            // Buffer conversion if needed
            let body = file;
            if (file instanceof Blob) {
                const arrayBuffer = await file.arrayBuffer();
                body = Buffer.from(arrayBuffer);
            }

            const parallelUploads3 = new Upload({
                client: s3Client,
                params: {
                    Bucket: S3_BUCKET,
                    Key: filename,
                    Body: body,
                    ContentType: mimetype,
                    ACL: 'public-read', // Ensure public access
                },
            });

            await parallelUploads3.done();

            const baseUrl = (S3_PUBLIC_URL || S3_ENDPOINT).replace(/\/+$/, "");
            return `${baseUrl}/${S3_BUCKET}/${filename}`;
        } catch (error) {
            console.error("Storage Upload Error:", error);
            throw error;
        }
    },

    async deleteFile(filename: string): Promise<void> {
        try {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: S3_BUCKET,
                Key: filename,
            }));
        } catch (error) {
            console.error("Storage Delete Error:", error);
            throw error;
        }
    }
};
