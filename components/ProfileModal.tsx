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
  Platform
} from 'react-native';
import { X, LogOut, User, Mail, Calendar } from 'lucide-react-native';
import { useAuth } from '../lib/auth-context';
import { signOut } from '../lib/auth-service';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal = ({ visible, onClose }: ProfileModalProps) => {
  const { user } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile</Text>
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
      </SafeAreaView>
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
