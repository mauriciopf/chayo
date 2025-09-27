import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthGate from './AuthGate';
import LoginModal from './LoginModal';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../context/ThemeContext';

/**
 * Test component to verify authentication system works correctly
 * This can be added to any screen for testing purposes
 */
export default function AuthSystemTest() {
  const { user, customer, signOut } = useAuth();
  const { config } = useAppConfig();
  const theme = useTheme();
  const { fontSizes } = useThemedStyles();
  const [showManualLogin, setShowManualLogin] = useState(false);

  const handleTestAppointment = (user: any, customerId: string) => {
    Alert.alert(
      'Appointment Test Success!',
      `User: ${user.fullName} (${user.email})\nCustomer ID: ${customerId}\nOrganization: ${config?.organizationId}`
    );
  };

  const handleTestForm = (user: any, customerId: string) => {
    Alert.alert(
      'Form Test Success!',
      `User: ${user.fullName} (${user.email})\nCustomer ID: ${customerId}\nOrganization: ${config?.organizationId}`
    );
  };

  const handleTestDocument = (user: any, customerId: string) => {
    Alert.alert(
      'Document Test Success!',
      `User: ${user.fullName} (${user.email})\nCustomer ID: ${customerId}\nOrganization: ${config?.organizationId}`
    );
  };

  const handleManualLoginSuccess = (user: any) => {
    Alert.alert('Manual Login Success!', `Welcome ${user.fullName}!`);
    setShowManualLogin(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 10,
    },
    statusCard: {
      backgroundColor: theme.primaryColor + '20',
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    statusText: {
      color: theme.textColor,
      fontSize: 14,
    },
    testButton: {
      backgroundColor: theme.primaryColor,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      alignItems: 'center',
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    signOutButton: {
      backgroundColor: '#FF3B30',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    signOutButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={[styles.title, { fontSize: fontSizes.xl }]}>🔐 Auth System Test</Text>

        {/* Current Auth Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: fontSizes.lg }]}>Current Status</Text>
          <View style={styles.statusCard}>
            <Text style={[styles.statusText, { fontSize: fontSizes.base }]}>
              User: {user ? `${user.fullName} (${user.email})` : 'Not authenticated'}
            </Text>
            <Text style={[styles.statusText, { fontSize: fontSizes.base }]}>
              Customer: {customer ? `ID: ${customer.id}` : 'No customer record'}
            </Text>
            <Text style={[styles.statusText, { fontSize: fontSizes.base }]}>
              Organization: {config?.organizationId || 'Not loaded'}
            </Text>
          </View>
        </View>

        {/* Manual Login Test */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: fontSizes.lg }]}>Manual Login Test</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => setShowManualLogin(true)}
          >
            <Text style={[styles.testButtonText, { fontSize: fontSizes.base }]}>Show Login Modal</Text>
          </TouchableOpacity>
        </View>

        {/* Progressive Auth Tests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: fontSizes.lg }]}>Progressive Auth Tests</Text>
          
          <AuthGate
            tool="appointments"
            organizationId={config?.organizationId || 'test-org'}
            onAuthenticated={handleTestAppointment}
            title="Test Appointment Auth"
            message="Testing appointment booking authentication"
          >
            <TouchableOpacity style={styles.testButton}>
              <Text style={[styles.testButtonText, { fontSize: fontSizes.base }]}>📅 Test Appointment Booking</Text>
            </TouchableOpacity>
          </AuthGate>

          <AuthGate
            tool="intake_forms"
            organizationId={config?.organizationId || 'test-org'}
            onAuthenticated={handleTestForm}
            title="Test Form Auth"
            message="Testing form submission authentication"
          >
            <TouchableOpacity style={styles.testButton}>
              <Text style={[styles.testButtonText, { fontSize: fontSizes.base }]}>📋 Test Form Submission</Text>
            </TouchableOpacity>
          </AuthGate>

          <AuthGate
            tool="documents"
            organizationId={config?.organizationId || 'test-org'}
            onAuthenticated={handleTestDocument}
            title="Test Document Auth"
            message="Testing document signing authentication"
          >
            <TouchableOpacity style={styles.testButton}>
              <Text style={[styles.testButtonText, { fontSize: fontSizes.base }]}>📄 Test Document Signing</Text>
            </TouchableOpacity>
          </AuthGate>
        </View>

        {/* Sign Out */}
        {user && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: fontSizes.lg }]}>Session Management</Text>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={signOut}
            >
              <Text style={[styles.signOutButtonText, { fontSize: fontSizes.base }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        <LoginModal
          visible={showManualLogin}
          onClose={() => setShowManualLogin(false)}
          onSuccess={handleManualLoginSuccess}
          title="Manual Login Test"
          message="Testing the login modal directly"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
