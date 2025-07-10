import { v2 as cloudinary } from "cloudinary";
import { config } from "../../configs/config";

interface FileUploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
}

class FileStorageService {
  private initialized: boolean = false;

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });

    this.initialized = true;
    console.log("Cloudinary configured successfully");
  }

  async connect(): Promise<void> {
    await this.initialize();
  }

  async disconnect(): Promise<void> {
    // Cloudinary doesn't require explicit disconnection
    console.log("Cloudinary service disconnected");
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    userId: string
  ): Promise<FileUploadResult> {
    await this.initialize();

    try {
      // Create a unique public ID for the file
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const publicId = `${config.cloudinary.folder}/${userId}/${timestamp}_${sanitizedFileName}`;

      // Determine resource type based on MIME type
      const resourceType = mimeType.startsWith("image/") ? "image" : "raw";

      // Upload to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              public_id: publicId,
              resource_type: resourceType,
              folder: config.cloudinary.folder,
              use_filename: true,
              unique_filename: false,
              overwrite: false,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(fileBuffer);
      });

      console.log(`File uploaded to Cloudinary: ${uploadResult.public_id}`);

      return {
        url: uploadResult.url,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        bytes: uploadResult.bytes,
      };
    } catch (error) {
      console.error("Failed to upload file to Cloudinary:", error);
      throw new Error(`File upload failed: ${error}`);
    }
  }

  async getFileUrl(publicId: string, options?: any): Promise<string> {
    await this.initialize();

    try {
      const optimizedUrl = cloudinary.url(publicId, {
        fetch_format: "auto",
        quality: "auto",
        secure: true,
        ...options,
      });

      return optimizedUrl;
    } catch (error) {
      console.error("Failed to generate file URL:", error);
      throw new Error(`URL generation failed: ${error}`);
    }
  }

  async getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    crop: string = "auto"
  ): Promise<string> {
    await this.initialize();

    try {
      const transformedUrl = cloudinary.url(publicId, {
        crop,
        gravity: "auto",
        width,
        height,
        fetch_format: "auto",
        quality: "auto",
        secure: true,
      });

      return transformedUrl;
    } catch (error) {
      console.error("Failed to generate optimized image URL:", error);
      throw new Error(`Optimized URL generation failed: ${error}`);
    }
  }

  async getThumbnailUrl(publicId: string): Promise<string> {
    return this.getOptimizedImageUrl(publicId, 200, 200, "fill");
  }

  isHealthy(): boolean {
    return this.initialized;
  }

  async getStorageInfo(): Promise<any> {
    await this.initialize();

    try {
      const usage = await cloudinary.api.usage();
      return {
        service: "cloudinary",
        cloudName: config.cloudinary.cloudName,
        usage: {
          credits: usage.credits,
          usedCredits: usage.credits_usage,
          objects: usage.objects,
          bandwidth: usage.bandwidth,
          storage: usage.storage,
        },
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        service: "cloudinary",
        cloudName: config.cloudinary.cloudName,
        error: "Unable to fetch usage information",
      };
    }
  }
}

export const fileStorageService = new FileStorageService();
