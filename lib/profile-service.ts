import { supabase } from './supabase';

/**
 * Updates a user's profile information in Supabase
 * @param userId The user's ID
 * @param profileData Object containing profile data to update
 * @returns Promise resolving to the updated user data
 */
export const updateUserProfile = async (
  userId: string,
  profileData: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    [key: string]: any;
  }
) => {
  try {
    // Store all fields in user metadata
    const updateData = {
      data: profileData
    };
    
    console.log('Updating user with data:', updateData);
    
    // Update the user
    const { data, error } = await supabase.auth.updateUser(updateData);

    if (error) {
      console.error('Supabase updateUser error:', error);
      throw error;
    }

    console.log('User update successful:', data.user);
    return data.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Retrieves a user's profile data from Supabase
 * @param userId The user's ID
 * @returns Promise resolving to the user's profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};
