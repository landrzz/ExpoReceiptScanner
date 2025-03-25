import { supabase } from "./supabase";
import { Receipt } from "./supabase";
import { uploadImage, deleteImage } from "./storage-service";
import { DEMO_USER_ID } from "./demo-user";

/**
 * Get the current user's ID from the session
 * Throws an error if no authenticated user is found
 */
async function getCurrentUserId() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session && session.user) {
      console.log("Using authenticated user ID:", session.user.id);
      return session.user.id;
    } else {
      // Instead of falling back to demo user, throw an error
      const error = new Error("No authenticated user found. Please log in before performing this action.");
      console.error(error);
      throw error;
    }
  } catch (error) {
    console.error("Error getting user ID:", error);
    throw error;
  }
}

/**
 * Get all receipts for the current user
 */
export async function getReceipts() {
  try {
    const userId = await getCurrentUserId();
    
    console.log("Fetching receipts for user:", userId);
    
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching receipts:", error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Exception fetching receipts:", error);
    return { data: null, error };
  }
}

/**
 * Get receipts for a specific month and year
 */
export async function getReceiptsByMonth(month: number, year: number) {
  try {
    const userId = await getCurrentUserId();
    
    // Create date range for the month
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    let endDate;
    
    // Calculate the last day of the month
    if (month === 12) {
      endDate = `${year + 1}-01-01`;
    } else {
      endDate = `${year}-${(month + 1).toString().padStart(2, "0")}-01`;
    }
    
    console.log(`Fetching receipts from ${startDate} to ${endDate} for user ${userId}`);
    
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching receipts by month:", error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Exception fetching receipts by month:", error);
    return { data: null, error };
  }
}

/**
 * Save a new receipt
 */
export async function saveReceipt(
  receiptData: Partial<Receipt>,
  imageUri: string | null
) {
  try {
    const userId = await getCurrentUserId();
    
    console.log("Saving receipt with data:", receiptData);
    
    // Handle image upload if provided
    let imagePath = null;
    if (imageUri) {
      console.log("Uploading image:", imageUri);
      const { path, error: uploadError } = await uploadImage(imageUri);
      
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return { data: null, error: { message: `Error uploading image: ${JSON.stringify(uploadError)}` } };
      }
      
      if (path) {
        imagePath = path;
        console.log("Image uploaded successfully, path:", imagePath);
      }
    }
    
    // Create the receipt record
    const { data, error } = await supabase.from("receipts").insert({
      ...receiptData,
      image_path: imagePath,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select();

    if (error) {
      console.error("Error saving receipt:", error);
      
      // If we uploaded an image but failed to save the receipt, clean up the image
      if (imagePath) {
        console.log("Cleaning up orphaned image:", imagePath);
        await deleteImage(imagePath);
      }
      
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Exception saving receipt:", error);
    return { data: null, error };
  }
}

/**
 * Update an existing receipt
 */
export async function updateReceipt(
  id: string,
  receiptData: Partial<Receipt>,
  newImageUri: string | null
) {
  try {
    const userId = await getCurrentUserId();
    
    console.log("Updating receipt:", id, "with data:", receiptData);
    
    // First get the current receipt to check if we need to delete an old image
    const { data: existingReceipt, error: fetchError } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching existing receipt:", fetchError);
      throw fetchError;
    }
    
    // Handle image changes
    let imagePath = existingReceipt.image_path;
    
    // If a new image is provided, upload it and delete the old one
    if (newImageUri) {
      console.log("Uploading new image for receipt:", id);
      const { path, error: uploadError } = await uploadImage(newImageUri);
      
      if (uploadError) {
        console.error("Error uploading new image:", uploadError);
        return { data: null, error: { message: `Error uploading image: ${JSON.stringify(uploadError)}` } };
      }
      
      if (path) {
        // If upload successful and there was an old image, delete it
        if (existingReceipt.image_path) {
          console.log("Deleting old image:", existingReceipt.image_path);
          await deleteImage(existingReceipt.image_path);
        }
        
        imagePath = path;
        console.log("New image uploaded successfully, path:", imagePath);
      }
    }
    
    // Update the receipt record
    const { data, error } = await supabase
      .from("receipts")
      .update({
        ...receiptData,
        image_path: imagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Error updating receipt:", error);
      
      // If we uploaded a new image but failed to update the receipt, clean up the new image
      if (newImageUri && imagePath !== existingReceipt.image_path) {
        console.log("Cleaning up orphaned image:", imagePath);
        await deleteImage(imagePath);
      }
      
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Exception updating receipt:", error);
    return { data: null, error };
  }
}

/**
 * Delete a receipt
 */
export async function deleteReceipt(id: string) {
  try {
    const userId = await getCurrentUserId();
    
    // First get the receipt to get the image path
    const { data: receipt, error: fetchError } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching receipt for deletion:", fetchError);
      throw fetchError;
    }
    
    // Delete the receipt record
    const { error } = await supabase.from("receipts").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      console.error("Error deleting receipt:", error);
      throw error;
    }
    
    // If the receipt had an image, delete it from storage
    if (receipt.image_path) {
      console.log("Deleting image for receipt:", id, "path:", receipt.image_path);
      const { error: deleteImageError } = await deleteImage(receipt.image_path);
      
      if (deleteImageError) {
        console.warn("Error deleting image:", deleteImageError);
        // We don't throw here because the receipt was already deleted
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Exception deleting receipt:", error);
    return { success: false, error };
  }
}
