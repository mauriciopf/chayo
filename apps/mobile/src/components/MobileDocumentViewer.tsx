import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { documentService, DocumentData, SignatureData } from '../services/DocumentService';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import AuthGate from './AuthGate';
import { useAppConfig } from '../hooks/useAppConfig';
import { createCustomerInteraction } from '../services/authService';

interface MobileDocumentViewerProps {
  documentId: string;
  onBack?: () => void;
  backButtonText?: string | null;
  onSigningComplete?: (success: boolean, message: string) => void;
}

export const MobileDocumentViewer: React.FC<MobileDocumentViewerProps> = ({
  documentId,
  onBack,
  backButtonText = '‹ Back',
  onSigningComplete,
}) => {
  const { theme, themedStyles } = useThemedStyles();
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string>('');

  // PDF viewing state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showSigningForm, setShowSigningForm] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0); // Force WebView reload


  // PDF processing
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch document metadata
      const docData = await documentService.getDocument(documentId);
      setDocument(docData);

      // Get PDF URL for WebView
      const remotePdfUrl = documentService.getPdfUrl(documentId);
      setPdfUrl(remotePdfUrl);

      // Download bytes for signing
      const bytes = await documentService.downloadPdfBytes(documentId);
      setPdfBytes(bytes);

    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Handle tab focus - reload WebView if PDF was loaded but WebView is blank
  useFocusEffect(
    useCallback(() => {
      // If we have a PDF URL but WebView might be blank, force reload
      if (pdfUrl && !loading && !error) {
        // Small delay to ensure tab transition is complete
        const timer = setTimeout(() => {
          setWebViewKey(prev => prev + 1);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [pdfUrl, loading, error])
  );


  const handleSignDocument = () => {
    setShowSigningForm(true);
  };

  const handleAuthenticatedSigning = async (user: any, customerId: string) => {
    if (!pdfBytes) {
      Alert.alert('Error', 'PDF not loaded. Please try again.');
      return;
    }

    try {
      setSigning(true);

      const signatureData: SignatureData = {
        signerName: user.fullName,
        signerEmail: user.email,
      };

      // Track customer interaction
      if (config?.organizationId) {
        await createCustomerInteraction(
          customerId,
          config.organizationId,
          'documents',
          {
            documentId,
            documentName: document?.file_name,
            signedAt: new Date().toISOString(),
          }
        );
      }

      // Process PDF with pdf-lib (add signature)
      const signedPdfBytes = await documentService.processPdf(
        pdfBytes,
        signatureData
      );

      // Submit to API
      await documentService.submitSignedDocument(
        documentId,
        signedPdfBytes,
        signatureData
      );

      Alert.alert(
        'Success',
        `Document signed successfully!\n\nA copy has been sent to ${user.email}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSigningComplete?.(true, 'Document signed successfully');
              setShowSigningForm(false);
            },
          },
        ]
      );

    } catch (signingError: any) {
      console.error('Error signing document:', signingError);
      const errorMessage = signingError.message || 'Failed to sign document';
      Alert.alert('Error', errorMessage);
      onSigningComplete?.(false, errorMessage);
    } finally {
      setSigning(false);
    }
  };

  const handleCancelSigning = () => {
    setShowSigningForm(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, themedStyles.primaryText]}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.errorColor }]}>Error Loading Document</Text>
          <Text style={[styles.errorMessage, themedStyles.secondaryText]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primaryColor }]} onPress={loadDocument}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showSigningForm) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Sign Document</Text>
              <Text style={styles.formSubtitle}>
                {document?.file_name}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSigning}
                  disabled={signing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <AuthGate
                  tool="documents"
                  organizationId={config?.organizationId}
                  onAuthenticated={handleAuthenticatedSigning}
                  title="Sign in to sign this document"
                  message={`Digitally sign "${document?.file_name}"`}
                >
                  <TouchableOpacity
                    style={[styles.signButton, signing && styles.signButtonDisabled]}
                    disabled={signing}
                  >
                    {signing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.signButtonText}>Sign Document</Text>
                    )}
                  </TouchableOpacity>
                </AuthGate>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && backButtonText && (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceColor }]} onPress={onBack}>
              <Text style={[styles.backButtonText, { color: theme.primaryColor }]}>{backButtonText}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, themedStyles.primaryText]}>Document</Text>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, themedStyles.secondaryText]}>{document?.file_name}</Text>
      </View>

      <View style={styles.pdfContainer}>
        {pdfUrl ? (
          <WebView
            key={webViewKey} // Force reload when key changes
            source={{ uri: pdfUrl }}
            style={styles.webview}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView Error:', nativeEvent);
              setError('Failed to load document');
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={theme.primaryColor} />
                <Text style={[styles.webviewLoadingText, { color: theme.textColor }]}>
                  {t('documents.loading')}
                </Text>
              </View>
            )}
            onLoadStart={() => {
              console.log('WebView started loading');
            }}
            onLoadEnd={() => {
              console.log('WebView finished loading');
            }}
            // Additional WebView props for better PDF handling
            allowsFullscreenVideo={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
            // Prevent WebView from caching issues
            cacheEnabled={false}
            incognito={true}
          />
        ) : (
          <View style={styles.pdfPlaceholder}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
            <Text style={[styles.pdfPlaceholderText, { color: theme.placeholderColor }]}>
              {t('documents.loading')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.signDocumentButton, { backgroundColor: theme.primaryColor }]}
          onPress={handleSignDocument}
          disabled={signing}
        >
          <Text style={styles.signDocumentButtonText}>Sign Document</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF453A',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: '#0A84FF',
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  pdfContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#2C2C2E',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewLoadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPlaceholderText: {
    fontSize: 16,
    opacity: 0.6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  signDocumentButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signDocumentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 48,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3A3A3C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signButton: {
    flex: 2,
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  signButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
