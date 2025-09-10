import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { MobileDocumentViewer } from '../components/MobileDocumentViewer';
import MobileDocuments from '../components/MobileDocuments';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';
import { DocumentData } from '../services/DocumentService';

export const DocumentsScreen: React.FC = () => {
  const { config } = useAppConfig();
  const { t } = useTranslation();
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);

  const handleDocumentSelect = (document: DocumentData) => {
    setSelectedDocument(document);
  };

  const handleBackToList = () => {
    setSelectedDocument(null);
  };

  const handleDocumentsLoaded = (documents: DocumentData[]) => {
    setTotalDocuments(documents.length);
  };

  const getBackButtonText = (): string | null => {
    return totalDocuments > 1 ? `‹ ${t('documents.title')}` : null;
  };

  const handleSigningComplete = (success: boolean, message: string) => {
    if (success) {
      Alert.alert(
        t('common.success'),
        t('documents.signSuccess', { defaultValue: 'Your document has been signed successfully!' }),
        [{ text: t('common.ok'), onPress: handleBackToList }]
      );
    } else {
      Alert.alert(t('common.error'), message, [{ text: t('common.ok') }]);
    }
  };

  if (!config) {
    return null; // Or loading component
  }

  if (selectedDocument) {
    return (
      <View style={styles.container}>
        <MobileDocumentViewer 
          documentId={selectedDocument.id}
          onBack={totalDocuments > 1 ? handleBackToList : undefined}
          backButtonText={getBackButtonText()}
          onSigningComplete={handleSigningComplete}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileDocuments
        organizationSlug={config.organizationSlug || ''}
        onDocumentSelect={handleDocumentSelect}
        onDocumentsLoaded={handleDocumentsLoaded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  placeholderMessage: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.9,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});