import { supabase } from "./supabase";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { DEMO_USER_ID } from "./demo-user";
import * as ImageManipulator from 'expo-image-manipulator';

const STORAGE_BUCKET = "receipt_images";

// Format the resource URL to handle different platforms
export function formatImageUri(uri: string): string {
  if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('http')) {
    return `file://${uri}`;
  }
  return uri;
}

/**
 * Compress an image to reduce file size
 * @param {string} imageUri - Local URI of the image
 * @returns {Promise<string>} URI of the compressed image
 */
export async function compressImage(imageUri: string): Promise<string> {
  try {
    if (!imageUri) {
      throw new Error("No image URI provided for compression");
    }

    // Format the URI properly
    const formattedUri = formatImageUri(imageUri);
    
    // Skip compression for web data URLs
    if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
      console.log("Skipping compression for web data URL");
      return imageUri;
    }

    // Get original file info to log size reduction
    let originalSize = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(formattedUri);
      if (fileInfo.exists && 'size' in fileInfo) {
        originalSize = fileInfo.size;
        console.log(`Original image size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (error) {
      console.log("Could not get original file size", error);
    }

    // Compress the image
    const compressedImage = await ImageManipulator.manipulateAsync(
      formattedUri,
      [{ resize: { width: 1200 } }], // Resize to max width of 1200px
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // 50% compression, JPEG format
    );

    // Log size reduction if possible
    try {
      if (compressedImage.uri) {
        const compressedInfo = await FileSystem.getInfoAsync(compressedImage.uri);
        if (compressedInfo.exists && 'size' in compressedInfo) {
          const compressedSize = compressedInfo.size;
          console.log(`Compressed image size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
          if (originalSize > 0) {
            console.log(`Size reduction: ${((1 - compressedSize / originalSize) * 100).toFixed(2)}%`);
          }
        }
      }
    } catch (error) {
      console.log("Could not get compressed file size", error);
    }

    return compressedImage.uri;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original image URI if compression fails
    return imageUri;
  }
}

/**
 * Generate a storage URL for a specific file
 */
export function getStorageUrl(path: string): string {
  if (!path) return '';
  
  // Return as-is if it's already a full URL
  if (path.startsWith('http')) {
    console.log('Using existing URL:', path);
    return path;
  }
  
  try {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    console.log('Generated Supabase public URL:', data.publicUrl);
    
    // Validate the URL
    if (!data.publicUrl || !data.publicUrl.startsWith('http')) {
      console.error('Invalid public URL generated:', data.publicUrl);
      // Return a fallback URL if the generated URL is invalid
      return path;
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating public URL:', error);
    return path; // Return the original path as fallback
  }
}

/**
 * Check if the storage bucket exists
 * This should be called when the app starts
 */
export async function ensureStorageBucketExists(): Promise<void> {
  try {
    // Check if user is authenticated first
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      console.log("User not authenticated, skipping bucket initialization");
      return;
    }
    
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Instead of trying to create the bucket (which fails due to RLS policies),
      // just log that it doesn't exist. The bucket should be created manually
      // in the Supabase dashboard.
      console.log(`Storage bucket '${STORAGE_BUCKET}' does not exist. Using it anyway.`);
    } else {
      console.log(`Storage bucket '${STORAGE_BUCKET}' exists.`);
    }
  } catch (error) {
    console.error("Error checking if bucket exists:", error);
  }
}

/**
 * Upload an image to Supabase storage
 * @param {string} imageUri - Local URI of the image
 * @returns {Promise<{path: string|null, error: any}>} Path in storage or error
 */
export async function uploadImage(imageUri: string): Promise<{path: string|null, error: any}> {
  try {
    if (!imageUri) {
      throw new Error("No image URI provided");
    }

    // Ensure the storage bucket exists
    await ensureStorageBucketExists();

    // Get the current user ID
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      throw new Error("No authenticated user found. Please log in before uploading images.");
    }
    const userId = data.session.user.id;

    // Compress the image before uploading
    const compressedImageUri = await compressImage(imageUri);
    
    // Format the URI properly
    const formattedUri = formatImageUri(compressedImageUri);
    
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const fileExt = formattedUri.split('.').pop() || 'jpg';
    const fileName = `${userId}/receipt_${timestamp}.${fileExt}`;
    
    // Read the file as base64
    const fileInfo = await FileSystem.getInfoAsync(formattedUri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Read the file
    const base64 = await FileSystem.readAsStringAsync(formattedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Upload the image
    const { data: uploadData, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw error;
    }
    
    console.log("Image uploaded successfully:", uploadData.path);
    return { path: uploadData.path, error: null };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { path: null, error };
  }
}

/**
 * Delete an image from Supabase storage
 * @param {string} path - Path of the image in storage
 */
export async function deleteImage(path: string): Promise<{success: boolean, error: any}> {
  try {
    if (!path) {
      console.log("No image path provided for deletion");
      return { success: true, error: null };
    }
    
    console.log("Original image path for deletion:", path);
    
    // If it's a full URL, extract just the path part
    if (path.includes(STORAGE_BUCKET)) {
      const urlParts = path.split(STORAGE_BUCKET + '/');
      if (urlParts.length > 1) {
        path = urlParts[1];
        console.log("Extracted path from URL:", path);
      }
    }
    
    // Check if the path has URL encoding that needs to be decoded
    if (path.includes('%')) {
      const decodedPath = decodeURIComponent(path);
      console.log("Decoded URL-encoded path:", decodedPath);
      path = decodedPath;
    }
    
    console.log("Final path for deletion:", path);
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);
    
    if (error) {
      console.error("Supabase storage removal error:", error);
      throw error;
    }
    
    console.log("Image deletion response:", data);
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error };
  }
}
