import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native';
import { X, LogOut, User, Mail, Calendar, Phone, Save, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../lib/auth-context';
import { updateUserProfile } from '../lib/profile-service';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal = ({ visible, onClose }: ProfileModalProps) => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [phoneError, setPhoneError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load user data when component mounts or user changes
  React.useEffect(() => {
    if (user) {
      // Load user metadata if available
      const metadata = user.user_metadata || {};
      setFirstName(metadata.first_name || '');
      setLastName(metadata.last_name || '');
      setPhoneNumber(metadata.phone_number || '');
    }
  }, [user]);

  // Clear notification after 5 seconds
  React.useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    // Allow empty phone number
    if (!phone) return true;
    
    // Basic phone validation - allows formats like:
    // (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
    const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Format phone number as user types
  const handlePhoneChange = (text: string) => {
    // Allow only digits, spaces, parentheses, dashes, plus signs
    const cleaned = text.replace(/[^\d\s\(\)\-\+\.]/g, '');
    setPhoneNumber(cleaned);
    
    // Validate and show/clear error
    if (cleaned && !validatePhoneNumber(cleaned)) {
      setPhoneError('Please enter a valid phone number');
    } else {
      setPhoneError('');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Validate phone number before saving
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    
    try {
      setIsSaving(true);
      setNotification({ type: null, message: '' });
      
      // Call the updateUserProfile function from profile-service
      await updateUserProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber
      });
      
      // Show success message
      setNotification({ 
        type: 'success', 
        message: 'Profile updated successfully' 
      });
      setIsSaving(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to update profile. Please try again.' 
      });
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Confirm before signing out
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsSigningOut(false),
            },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: async () => {
                await signOut();
                onClose();
                setIsSigningOut(false);
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        // For web, we'll just confirm with a simple dialog
        if (confirm('Are you sure you want to sign out?')) {
          await signOut();
          onClose();
        }
        setIsSigningOut(false);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalView}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Profile</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X size={24} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {user ? (
                  <>
                    <View style={styles.userAvatarContainer}>
                      <View style={styles.userAvatar}>
                        <User size={40} color="#4F46E5" />
                      </View>
                    </View>

                    <View style={styles.userInfoSection}>
                      <Text style={styles.userEmail}>{user.email}</Text>

                      {/* Notification Banner */}
                      {notification.type && (
                        <View 
                          style={[
                            styles.notification, 
                            notification.type === 'success' 
                              ? styles.successNotification 
                              : styles.errorNotification
                          ]}
                        >
                          {notification.type === 'success' ? (
                            <CheckCircle size={18} color="#047857" style={styles.notificationIcon} />
                          ) : (
                            <AlertCircle size={18} color="#b91c1c" style={styles.notificationIcon} />
                          )}
                          <Text 
                            style={[
                              styles.notificationText,
                              notification.type === 'success' 
                                ? styles.successText 
                                : styles.errorText
                            ]}
                          >
                            {notification.message}
                          </Text>
                        </View>
                      )}

                      {/* Profile Input Fields */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholder="Enter your first name"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          value={lastName}
                          onChangeText={setLastName}
                          placeholder="Enter your last name"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                          style={[styles.input, phoneError ? styles.inputError : null]}
                          value={phoneNumber}
                          onChangeText={handlePhoneChange}
                          placeholder="Enter your phone number (e.g., 123-456-7890)"
                          placeholderTextColor="#9ca3af"
                          keyboardType="phone-pad"
                        />
                        {phoneError ? (
                          <Text style={styles.errorText}>{phoneError}</Text>
                        ) : null}
                      </View>

                      <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleSaveProfile}
                        disabled={isSaving || !!phoneError}
                      >
                        <Save size={18} color="#1e40af" style={{marginRight: 8}} />
                        <Text style={styles.saveButtonText}>
                          {isSaving ? 'Saving...' : 'Save Profile'}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.infoRow}>
                        <Mail size={16} color="#6b7280" style={styles.infoIcon} />
                        <View>
                          <Text style={styles.infoLabel}>Email verified</Text>
                          <Text style={styles.infoValue}>
                            {user.email_confirmed_at ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <Calendar size={16} color="#6b7280" style={styles.infoIcon} />
                        <View>
                          <Text style={styles.infoLabel}>Account created</Text>
                          <Text style={styles.infoValue}>
                            {formatDate(user.created_at)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <Calendar size={16} color="#6b7280" style={styles.infoIcon} />
                        <View>
                          <Text style={styles.infoLabel}>Last sign in</Text>
                          <Text style={styles.infoValue}>
                            {formatDate(user.last_sign_in_at)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.signOutButton} 
                      onPress={handleSignOut}
                      disabled={isSigningOut}
                    >
                      <LogOut size={18} color="#991b1b" style={{marginRight: 8}} />
                      <Text style={styles.signOutText}>
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.notSignedInContainer}>
                    <Text style={styles.notSignedInText}>Not signed in</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  userAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoSection: {
    marginBottom: 24,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successNotification: {
    backgroundColor: '#d1fae5',
  },
  errorNotification: {
    backgroundColor: '#fee2e2',
  },
  notificationIcon: {
    marginRight: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#047857',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  signOutButton: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    color: '#991b1b',
    fontSize: 16,
    fontWeight: '600',
  },
  notSignedInContainer: {
    padding: 20,
    alignItems: 'center',
  },
  notSignedInText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default ProfileModal;
