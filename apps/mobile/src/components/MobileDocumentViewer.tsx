import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { documentService, DocumentData, SignatureData } from '../services/DocumentService';
import { useThemedStyles } from '../context/ThemeContext';

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
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string>('');

  // PDF viewing state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfPath, setPdfPath] = useState<string>(''); // Local file path
  const [showSigningForm, setShowSigningForm] = useState(false);

  // PDF fallback state
  const [useWebViewFallback, setUseWebViewFallback] = useState(false);

  // Signing form data
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  // PDF processing
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch document metadata
      const docData = await documentService.getDocument(documentId);
      setDocument(docData);

      // Get PDF URL for both native PDF viewer and WebView fallback
      const remotePdfUrl = documentService.getPdfUrl(documentId);
      setPdfUrl(remotePdfUrl);

      // Download PDF to local file for react-native-pdf
      const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/temp_document_${documentId}.pdf`;

      // Download PDF directly to file system
      await RNBlobUtil.config({
        path: tempPath,
        overwrite: true,
      }).fetch('GET', remotePdfUrl);

      // Set local file path for react-native-pdf (use file:// URI)
      const fileUri = `file://${tempPath}`;
      setPdfPath(fileUri);

      // Also download bytes for signing (separate from display)
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

  const handlePdfError = useCallback((err: any) => {
    console.error('PDF Error:', err);
    setUseWebViewFallback(true);
  }, []);

  const handleSignDocument = () => {
    setShowSigningForm(true);
  };

  const handleSubmitSignature = async () => {
    if (!signerName.trim() || !signerEmail.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!pdfBytes) {
      Alert.alert('Error', 'PDF not loaded. Please try again.');
      return;
    }

    try {
      setSigning(true);

      const signatureData: SignatureData = {
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
      };

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
        'Document signed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              onSigningComplete?.(true, 'Document signed successfully');
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
    setSignerName('');
    setSignerEmail('');
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
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={signerName}
                  onChangeText={setSignerName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={signerEmail}
                  onChangeText={setSignerEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#8E8E93"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSigning}
                  disabled={signing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.signButton, signing && styles.signButtonDisabled]}
                  onPress={handleSubmitSignature}
                  disabled={signing}
                >
                  {signing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signButtonText}>Sign Document</Text>
                  )}
                </TouchableOpacity>
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
        {useWebViewFallback ? (
          <WebView
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
                <ActivityIndicator size="large" color="#0A84FF" />
                <Text style={styles.webviewLoadingText}>Loading document...</Text>
              </View>
            )}
          />
        ) : pdfPath ? (
          <Pdf
            source={{ uri: pdfPath, cache: false }}
            style={styles.pdf}
            onLoadComplete={(numberOfPages) => {
              console.log(`PDF loaded with ${numberOfPages} pages`);
            }}
            onError={handlePdfError}
          />
        ) : (
          <View style={styles.pdfPlaceholder}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={styles.pdfPlaceholderText}>Loading PDF...</Text>
          </View>
        )}

        {useWebViewFallback && (
          <View style={styles.fallbackNotice}>
            <Text style={styles.fallbackNoticeText}>
              📱 Using web viewer for better compatibility
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signDocumentButton}
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
  pdf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  fallbackNotice: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fallbackNoticeText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  signDocumentButton: {
    backgroundColor: '#0A84FF',
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
