import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import MobileDocuments from '../components/MobileDocuments';
import { useAppConfig } from '../hooks/useAppConfig';
import { DocumentData } from '../services/DocumentService';

interface DocumentsScreenProps {
  navigation: any;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ navigation }) => {
  const { config } = useAppConfig();
  const [totalDocuments, setTotalDocuments] = useState<number>(0);

  const handleDocumentSelect = (document: DocumentData) => {
    navigation.navigate('DocumentDetail', {
      document,
      totalDocuments,
    });
  };

  const handleDocumentsLoaded = (documents: DocumentData[]) => {
    setTotalDocuments(documents.length);
  };

  if (!config) {
    return null; // Or loading component
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
