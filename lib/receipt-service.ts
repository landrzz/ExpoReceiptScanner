import { supabase } from "./supabase";
import { DEMO_USER_ID } from "./demo-user";
import { Receipt } from "./supabase";

export async function saveReceipt({
  imageUri,
  category,
  notes,
  location,
  amount = 0, // Default amount
  vendor = "", // Default vendor
}: {
  imageUri: string | null;
  category: string;
  notes: string;
  location: string;
  amount?: number;
  vendor?: string;
}) {
  try {
    // Format current date as YYYY-MM-DD
    const today = new Date();
    const date = today.toISOString().split("T")[0];

    // Format current time as HH:MM
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const time = `${hours}:${minutes}`;

    // Upload image if available
    let image_url = null;
    if (imageUri) {
      // In a real app, we would upload the image to Supabase storage
      // For demo purposes, we'll just use the local URI
      image_url = imageUri;
    }

    const { data, error } = await supabase
      .from("receipts")
      .insert({
        user_id: DEMO_USER_ID,
        date,
        time,
        amount,
        category,
        location,
        vendor,
        notes,
        image_url,
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error saving receipt:", error);
    return { data: null, error };
  }
}

export async function getReceipts() {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("date", { ascending: false });

    if (error) throw error;
    return { data: data as Receipt[], error: null };
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return { data: [], error };
  }
}

export async function getReceiptsByMonth(month: number, year: number) {
  try {
    // Create date range for the selected month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return { data: data as Receipt[], error: null };
  } catch (error) {
    console.error("Error fetching receipts by month:", error);
    return { data: [], error };
  }
}

export async function deleteReceipt(id: string) {
  try {
    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting receipt:", error);
    return { success: false, error };
  }
}
