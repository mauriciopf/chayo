import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../context/ThemeContext';
import { getAuthProviderAvailability } from '../utils/authConfig';
import { 
  signInWithApple, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail,
  AuthUser 
} from '../services/authService';
import { SkeletonBox } from './SkeletonLoader';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  title?: string;
  message?: string;
}

type AuthMode = 'signin' | 'signup';

export default function LoginModal({ 
  visible, 
  onClose, 
  onSuccess, 
  title, 
  message 
}: LoginModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { fontSizes } = useThemedStyles();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [providerAvailability] = useState(() => getAuthProviderAvailability());
  
  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'El inicio de sesión con Apple solo está disponible en iOS');
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithApple();
      onSuccess(user);
      onClose();
    } catch (error: any) {
    Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Apple');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (error: any) {
    Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
    Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (authMode === 'signup' && !fullName) {
    Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return;
    }

    setLoading(true);
    try {
      let user: AuthUser;
      
      if (authMode === 'signup') {
        user = await signUpWithEmail(email, password, fullName);
      } else {
        user = await signInWithEmail(email, password);
      }
      
      onSuccess(user);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar la autenticación por correo');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setAuthMode('signin');
  };

  const handleClose = () => {
    console.log('LoginModal: Close button pressed');
    resetForm();
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: theme.textColor,
      textAlign: 'center',
      opacity: 0.7,
    },
    socialButtons: {
      gap: 12,
      marginBottom: 24,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryColor,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
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
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.textColor,
      opacity: 0.2,
    },
    dividerText: {
      marginHorizontal: 16,
      color: theme.textColor,
      opacity: 0.5,
    },
    form: {
      gap: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.textColor + '30',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.textColor,
      backgroundColor: theme.backgroundColor,
    },
    emailButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    emailButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    switchMode: {
      marginTop: 16,
      alignItems: 'center',
    },
    switchModeText: {
      color: theme.textColor,
      opacity: 0.7,
    },
    switchModeButton: {
      color: theme.primaryColor,
      fontWeight: '600',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 20,
      color: theme.textColor,
      opacity: 0.8,
      fontWeight: 'bold',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.container}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeButtonText, { fontSize: fontSizes.xxl }]}>×</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={[styles.title, { fontSize: fontSizes.xl }]}>
                {title || t('auth.signInRequired')}
              </Text>
              {message && (
                <Text style={[styles.message, { fontSize: fontSizes.base }]}>{message}</Text>
              )}
            </View>

            <View style={styles.socialButtons}>
              {Platform.OS === 'ios' && providerAvailability.apple && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                >
                  <Text style={[styles.socialButtonText, { fontSize: fontSizes.base }]}>
                    🍎 Continuar con Apple
                  </Text>
                </TouchableOpacity>
              )}

              {providerAvailability.google && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Text style={[styles.socialButtonText, { fontSize: fontSizes.base }]}>
                    📧 Continuar con Google
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { fontSize: fontSizes.sm }]}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              {authMode === 'signup' && (
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.emailButton}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                <Text style={[styles.emailButtonText, { fontSize: fontSizes.base }]}>
                  {authMode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchMode}>
              <Text style={[styles.switchModeText, { fontSize: fontSizes.sm }]}>
                {authMode === 'signup' 
                  ? '¿Ya tienes una cuenta? ' 
                  : '¿No tienes cuenta? '
                }
                <Text 
                  style={styles.switchModeButton}
                  onPress={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                >
                  {authMode === 'signup' ? 'Iniciar sesión' : 'Crear cuenta'}
                </Text>
              </Text>
            </View>

            {loading && (
              <View style={styles.loadingOverlay}>
                <View style={{ padding: 20 }}>
                  <SkeletonBox width={150} height={20} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 20 }} />
                  <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 16 }} />
                  <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 16 }} />
                  <SkeletonBox width={120} height={44} borderRadius={8} style={{ alignSelf: 'center' }} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
