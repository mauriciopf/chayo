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
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAuthProviderAvailability } from '../utils/authConfig';
import {
  signInWithApple,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  deleteAccount,
} from '../services/authService';
import { SkeletonBox } from '../components/SkeletonLoader';
import Icon from 'react-native-vector-icons/Feather';

type AuthMode = 'signin' | 'signup';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { fontSizes, themedStyles } = useThemedStyles();
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
      await signInWithApple();
      Alert.alert('Éxito', 'Inicio de sesión completado');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Apple');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      Alert.alert('Éxito', 'Inicio de sesión completado');
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

    if (authMode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }

      Alert.alert('Éxito', authMode === 'signup' ? 'Cuenta creada correctamente' : 'Inicio de sesión completado');

      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar la autenticación por correo');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Éxito', 'Sesión cerrada correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cerrar la sesión');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y se eliminarán todos tus datos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount();
              Alert.alert('Éxito', 'Tu cuenta ha sido eliminada correctamente');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la cuenta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
            <Text style={[styles.welcomeText, { color: theme.textColor, fontSize: fontSizes.lg }]}>¡Bienvenido de nuevo!</Text>
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
              <Text style={[styles.signOutButtonText, { fontSize: fontSizes.base }]}>Cerrar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: theme.backgroundColor, borderColor: theme.errorColor }]}
              onPress={handleDeleteAccount}
            >
              <Icon name="trash-2" size={20} color={theme.errorColor} style={styles.buttonIcon} />
              <Text style={[styles.deleteButtonText, { color: theme.errorColor, fontSize: fontSizes.base }]}>
                Eliminar cuenta
              </Text>
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
            <Text style={[styles.title, { color: theme.textColor, fontSize: fontSizes.xl }]}>
              {authMode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
              {authMode === 'signin'
                ? '¡Bienvenido de nuevo! Inicia sesión para continuar.'
                : 'Crea tu cuenta para comenzar.'
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
                <Text style={[styles.socialButtonText, { fontSize: fontSizes.base }]}>Continuar con Apple</Text>
              </TouchableOpacity>
            )}

            {providerAvailability.google && (
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Icon name="globe" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={[styles.socialButtonText, { fontSize: fontSizes.base }]}>Continuar con Google</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          {(providerAvailability.apple || providerAvailability.google) && (
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />
              <Text style={[styles.dividerText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>o</Text>
              <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />
            </View>
          )}

          {/* Email Form */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textColor, fontSize: fontSizes.sm }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceColor,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                    fontSize: fontSizes.base,
                  },
                ]}
                placeholder="Ingresa tu correo"
                placeholderTextColor={theme.placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textColor, fontSize: fontSizes.sm }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceColor,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                    fontSize: fontSizes.base,
                  },
                ]}
                placeholder="Ingresa tu contraseña"
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
                <Text style={[styles.inputLabel, { color: theme.textColor, fontSize: fontSizes.sm }]}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceColor,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder="Confirma tu contraseña"
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
              <Text style={[styles.primaryButtonText, { fontSize: fontSizes.base }]}>
                {authMode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Auth Mode */}
          <View style={styles.toggleSection}>
            <Text style={[styles.toggleText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
              {authMode === 'signin'
                ? '¿No tienes cuenta? '
                : '¿Ya tienes una cuenta? '
              }
            </Text>
            <TouchableOpacity
              onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={[styles.toggleLink, { color: theme.primaryColor, fontSize: fontSizes.sm }]}>
                  {authMode === 'signin' ? 'Crear cuenta' : 'Iniciar sesión'}
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
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#FF6B6B',
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
