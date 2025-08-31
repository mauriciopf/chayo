import React, { useState, useEffect } from 'react';
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
import { documentService, DocumentData, SignatureData } from '../services/DocumentService';

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
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string>('');
  
  // PDF viewing state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showSigningForm, setShowSigningForm] = useState(false);
  
  // Signing form data
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  
  // PDF processing
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch document metadata
      const docData = await documentService.getDocument(documentId);
      setDocument(docData);
      
      // Set PDF URL for viewing
      const url = documentService.getPdfUrl(documentId);
      setPdfUrl(url);
      
      // Pre-download PDF bytes for signing
      const bytes = await documentService.downloadPdfBytes(documentId);
      setPdfBytes(bytes);
      
    } catch (error: any) {
      console.error('Error loading document:', error);
      setError(error.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

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
      const result = await documentService.submitSignedDocument(
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

    } catch (error: any) {
      console.error('Error signing document:', error);
      const errorMessage = error.message || 'Failed to sign document';
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Document</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDocument}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showSigningForm) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && backButtonText && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>{backButtonText}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Document</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{document?.file_name}</Text>
      </View>

      <View style={styles.pdfContainer}>
        {pdfUrl ? (
          <Pdf
            source={{ uri: pdfUrl, cache: true }}
            style={styles.pdf}
            onLoadComplete={(numberOfPages) => {
              console.log(`PDF loaded with ${numberOfPages} pages`);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Current page: ${page}/${numberOfPages}`);
            }}
            onError={(error) => {
              console.error('PDF Error:', error);
              setError('Failed to load PDF');
            }}
            onPressLink={(uri) => {
              console.log('Link pressed:', uri);
            }}
          />
        ) : (
          <View style={styles.pdfPlaceholder}>
            <Text style={styles.pdfPlaceholderText}>Loading PDF...</Text>
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  pdf: {
    flex: 1,
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
