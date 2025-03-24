import { supabase } from "./supabase";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { DEMO_USER_ID } from "./demo-user";

const STORAGE_BUCKET = "receipt_images";

// Format the resource URL to handle different platforms
export function formatImageUri(uri: string): string {
  if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('http')) {
    return `file://${uri}`;
  }
  return uri;
}

/**
 * Generate a storage URL for a specific file
 */
export function getStorageUrl(path: string): string {
  if (!path) return '';
  
  // Return as-is if it's already a full URL
  if (path.startsWith('http')) {
    return path;
  }
  
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Create the storage bucket and set permissions if it doesn't exist
 * This should be called when the app starts
 */
export async function ensureStorageBucketExists(): Promise<void> {
  try {
    // Check if user is authenticated first
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      console.log("No authenticated user, skipping bucket creation");
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
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase
        .storage
        .createBucket(STORAGE_BUCKET, {
          public: true, // Make the bucket public
        });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
      } else {
        console.log(`Storage bucket '${STORAGE_BUCKET}' created successfully`);
      }
    }
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
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

    // Format the URI properly
    const formattedUri = formatImageUri(imageUri);
    
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const fileExt = formattedUri.split('.').pop() || 'jpg';
    const fileName = `${DEMO_USER_ID}/receipt_${timestamp}.${fileExt}`;
    
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
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw error;
    }
    
    console.log("Image uploaded successfully:", data.path);
    return { path: data.path, error: null };
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
    if (!path) return { success: true, error: null };
    
    // If it's a full URL, extract just the path part
    if (path.includes(STORAGE_BUCKET)) {
      const urlParts = path.split(STORAGE_BUCKET + '/');
      if (urlParts.length > 1) {
        path = urlParts[1];
      }
    }
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error };
  }
}
