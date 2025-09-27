import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAuthProviderAvailability } from '../utils/authConfig';
import { 
  signInWithApple, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail,
  AuthUser 
} from '../services/authService';
import { SkeletonBox } from '../components/SkeletonLoader';
import Icon from 'react-native-vector-icons/Feather';

type AuthMode = 'signin' | 'signup';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { fontSizes } = useThemedStyles();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [providerAvailability] = useState(() => getAuthProviderAvailability());
  
  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithApple();
      Alert.alert('Success', 'Signed in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Apple Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      Alert.alert('Success', 'Signed in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      let user: AuthUser;
      
      if (authMode === 'signup') {
        user = await signUpWithEmail(email, password);
      } else {
        user = await signInWithEmail(email, password);
      }
      
      Alert.alert('Success', `${authMode === 'signup' ? 'Account created' : 'Signed in'} successfully!`);
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || `Email ${authMode} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Signed out successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sign out failed');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <SkeletonBox width={80} height={80} borderRadius={40} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <SkeletonBox width={150} height={20} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 12 }} />
        <SkeletonBox width={200} height={16} borderRadius={6} style={{ alignSelf: 'center', marginBottom: 32 }} />
        <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={50} borderRadius={12} />
      </View>
    );
  }

  // If user is already signed in, show profile info
  if (user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primaryColor }]}>
              <Icon name="user" size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.welcomeText, { color: theme.textColor, fontSize: fontSizes.xl }]}>
              Welcome back!
            </Text>
            <Text style={[styles.emailText, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
              {user.email}
            </Text>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: theme.errorColor }]}
              onPress={handleSignOut}
            >
              <Icon name="log-out" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If user is not signed in, show login/signup form
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textColor }]}>
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.placeholderColor }]}>
              {authMode === 'signin' 
                ? 'Welcome back! Please sign in to continue.' 
                : 'Create your account to get started.'
              }
            </Text>
          </View>

          {/* Social Sign-In Buttons */}
          <View style={styles.socialSection}>
            {providerAvailability.apple && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                <Icon name="smartphone" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.socialButtonText}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}

            {providerAvailability.google && (
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Icon name="globe" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.socialButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          {(providerAvailability.apple || providerAvailability.google) && (
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />
              <Text style={[styles.dividerText, { color: theme.placeholderColor }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />
            </View>
          )}

          {/* Email Form */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceColor,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textColor }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceColor,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor={theme.placeholderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {authMode === 'signup' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textColor }]}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceColor,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.placeholderColor}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Auth Mode */}
          <View style={styles.toggleSection}>
            <Text style={[styles.toggleText, { color: theme.placeholderColor }]}>
              {authMode === 'signin' 
                ? "Don't have an account? " 
                : "Already have an account? "
              }
            </Text>
            <TouchableOpacity
              onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={[styles.toggleLink, { color: theme.primaryColor }]}>
                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4A574',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F4E4BC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(244, 228, 188, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F4E4BC',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: 'rgba(244, 228, 188, 0.8)',
  },
  section: {
    marginBottom: 24,
  },
  socialSection: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(244, 228, 188, 0.2)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: 'rgba(244, 228, 188, 0.6)',
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4E4BC',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: 'rgba(244, 228, 188, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#F4E4BC',
  },
  primaryButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontSize: 14,
    color: 'rgba(244, 228, 188, 0.8)',
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A574',
  },
});
