import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
import { SkeletonBox } from './SkeletonLoader';
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
  backButtonText = null,
  onSigningComplete,
}) => {
  const { theme, fontSizes, themedStyles } = useThemedStyles();
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

  const resolvedBackButtonText = backButtonText ?? t('common.back');

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
      const fallbackMessage = t('documents.viewer.loadFailed');
      setError(err.message || fallbackMessage);
    } finally {
      setLoading(false);
    }
  }, [documentId, t]);

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
      Alert.alert(t('common.error'), t('documents.viewer.pdfMissing'));
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
        t('documents.viewer.signSuccessTitle'),
        t('documents.viewer.signSuccessMessage', { email: user.email }),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              onSigningComplete?.(true, t('documents.viewer.signSuccessToast'));
              setShowSigningForm(false);
            },
          },
        ]
      );

    } catch (signingError: any) {
      console.error('Error signing document:', signingError);
      const errorMessage = signingError.message || t('documents.viewer.signFailed');
      Alert.alert(t('common.error'), errorMessage);
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
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', padding: 20 }}>
        <SkeletonBox width={200} height={24} borderRadius={8} style={{ marginBottom: 20 }} />
        <SkeletonBox width="100%" height={300} borderRadius={16} style={{ marginBottom: 20 }} />
        <SkeletonBox width={120} height={44} borderRadius={8} />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.errorColor, fontSize: fontSizes.lg }]}>
            {t('documents.viewer.errorTitle')}
          </Text>
          <Text style={[styles.errorMessage, themedStyles.secondaryText, { fontSize: fontSizes.base }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primaryColor }]} onPress={loadDocument}>
            <Text style={[styles.retryButtonText, { fontSize: fontSizes.base }]}>
              {t('documents.viewer.retry')}
            </Text>
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
              <Text style={[styles.formTitle, { fontSize: fontSizes.xl }]}>
                {t('documents.viewer.formTitle')}
              </Text>
              <Text style={[styles.formSubtitle, { fontSize: fontSizes.sm }]}>
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
                  <Text style={[styles.cancelButtonText, { fontSize: fontSizes.base }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <AuthGate
                  tool="documents"
                  organizationId={config?.organizationId}
                  onAuthenticated={handleAuthenticatedSigning}
                  title={t('documents.viewer.signInTitle')}
                  message={t('documents.viewer.signInMessage', { name: document?.file_name ?? '' })}
                >
                  <TouchableOpacity
                    style={[styles.signButton, signing && styles.signButtonDisabled]}
                    disabled={signing}
                  >
                    {signing ? (
                      <View style={{ flex: 1, backgroundColor: '#1C1C1E', padding: 20 }}>
        <SkeletonBox width={200} height={24} borderRadius={8} style={{ marginBottom: 20 }} />
        <SkeletonBox width="100%" height={300} borderRadius={16} style={{ marginBottom: 20 }} />
        <SkeletonBox width={120} height={44} borderRadius={8} />
      </View>
                    ) : (
                      <Text style={[styles.signButtonText, { fontSize: fontSizes.base }]}>
                        {t('documents.viewer.signButton')}
                      </Text>
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
          {onBack && resolvedBackButtonText && (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceColor }]} onPress={onBack}>
              <Text style={[styles.backButtonText, { color: theme.primaryColor, fontSize: fontSizes.base }]}>
                {resolvedBackButtonText}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, themedStyles.primaryText, { fontSize: fontSizes.lg }]}>
              {t('documents.viewer.headerTitle')}
            </Text>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, themedStyles.secondaryText, { fontSize: fontSizes.sm }]}>{document?.file_name}</Text>
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
              setError(t('documents.viewer.loadFailed'));
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={{ flex: 1, backgroundColor: '#1C1C1E', padding: 20 }}>
        <SkeletonBox width={200} height={24} borderRadius={8} style={{ marginBottom: 20 }} />
        <SkeletonBox width="100%" height={300} borderRadius={16} style={{ marginBottom: 20 }} />
        <SkeletonBox width={120} height={44} borderRadius={8} />
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
          <View style={{ flex: 1, backgroundColor: '#1C1C1E', padding: 20 }}>
        <SkeletonBox width={200} height={24} borderRadius={8} style={{ marginBottom: 20 }} />
        <SkeletonBox width="100%" height={300} borderRadius={16} style={{ marginBottom: 20 }} />
        <SkeletonBox width={120} height={44} borderRadius={8} />
      </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.signDocumentButton, { backgroundColor: theme.primaryColor }]}
          onPress={handleSignDocument}
          disabled={signing}
        >
          <Text style={[styles.signDocumentButtonText, { fontSize: fontSizes.base }]}>
            {t('documents.viewer.signButton')}
          </Text>
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
    backgroundColor: '#2F5D62',
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
    color: '#2F5D62',
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
    backgroundColor: '#2F5D62',
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
