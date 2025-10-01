import React, { useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { AuthUser } from '../services/authService';
import { useTranslation } from '../hooks/useTranslation';

interface AuthGateProps {
  children: ReactNode;
  tool: string;
  organizationId?: string;
  onAuthenticated: (user: AuthUser, customerId: string) => void;
  title?: string;
  message?: string;
}

export default function AuthGate({
  children,
  tool,
  organizationId,
  onAuthenticated,
  title,
  message,
}: AuthGateProps) {
  const { user, customer, createCustomerForOrganization } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { t } = useTranslation();

  const handlePress = async () => {
    if (!organizationId) {
      console.error('AuthGate: organizationId is required');
      return;
    }

    if (!user) {
      // User needs to authenticate
      setShowLoginModal(true);
      return;
    }

    try {
      // User is authenticated, check if we have customer record for this organization
      let currentCustomer = customer;
      
      if (!currentCustomer || currentCustomer.organizationId !== organizationId) {
        // Create or get customer for this organization
        currentCustomer = await createCustomerForOrganization(organizationId);
      }

      // Proceed with the protected action
      onAuthenticated(user, currentCustomer.id);
    } catch (error) {
      console.error('AuthGate error:', error);
      Alert.alert(t('common.error'), t('authGate.authenticationFailed'));
    }
  };

  const handleLoginSuccess = async (authenticatedUser: AuthUser) => {
    setShowLoginModal(false);
    
    if (!organizationId) {
      console.error('AuthGate: organizationId is required for customer creation');
      return;
    }

    try {
      // Create customer record for this organization
      const newCustomer = await createCustomerForOrganization(organizationId);
      
      // Proceed with the protected action
      onAuthenticated(authenticatedUser, newCustomer.id);
    } catch (error) {
      console.error('AuthGate login success error:', error);
      Alert.alert(t('common.error'), t('authGate.completeAuthenticationFailed'));
    }
  };

  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        onPress: handlePress,
      })}
      
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        title={title}
        message={message}
      />
    </>
  );
}
