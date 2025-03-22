import { createClient } from "@supabase/supabase-js";
import { encode } from "base64-arraybuffer";

// Using environment variables from the Supabase memories
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// OpenAI API endpoint and key
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Extracts receipt information from an image using OpenAI's vision capabilities
 * @param imageUri Local path to the receipt image
 * @returns Extracted receipt information including amount and vendor
 */
export async function extractReceiptInfo(imageUri: string) {
  try {
    // Check if API key is available
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.");
    }
    
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64Image = await blobToBase64(blob);

    // Prepare the OpenAI request
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following information from this receipt image: 1) Total amount (just the number), 2) Vendor/store name. Return the information in JSON format with fields 'amount' and 'vendor'."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    // Call OpenAI API
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => null);
      const errorText = await openAIResponse.text().catch(() => "Unknown error");
      
      console.error("OpenAI API Error Details:", errorData || errorText);
      
      if (errorData?.error?.code === 'model_not_found') {
        throw new Error("The AI model is not available. You may need to upgrade your OpenAI account to access GPT-4 Vision.");
      } else if (errorData?.error?.type === 'insufficient_quota') {
        throw new Error("Your OpenAI account has insufficient quota. Please check your billing status.");
      } else {
        throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorData?.error?.message || errorText}`);
      }
    }

    const data = await openAIResponse.json();
    
    // Extract and parse the JSON response
    const content = data.choices[0]?.message?.content || "";
    
    // Try to find JSON in the response - sometimes the model might wrap it in backticks
    const jsonMatch = content.match(/\{.*\}/s);
    
    if (jsonMatch) {
      try {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Convert amount to number if it's a string with currency symbols
        if (typeof extractedData.amount === 'string') {
          // Remove currency symbols and non-numeric chars except decimal point
          const cleanedAmount = extractedData.amount.replace(/[^0-9.]/g, '');
          extractedData.amount = parseFloat(cleanedAmount) || 0;
        }
        
        return {
          success: true,
          data: extractedData,
          error: null
        };
      } catch (parseError) {
        console.error("Failed to parse JSON from OpenAI response:", parseError);
        return {
          success: false,
          data: null,
          error: "Failed to parse receipt information"
        };
      }
    } else {
      return {
        success: false,
        data: null,
        error: "Could not extract structured data from the response"
      };
    }
  } catch (error) {
    console.error("Error extracting receipt info:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Helper function to convert a Blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
