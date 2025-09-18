import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { DocumentService, DocumentData } from '../services/DocumentService';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import LoadingScreen from './LoadingScreen';

interface MobileDocumentsProps {
  organizationSlug: string;
  onDocumentSelect: (document: DocumentData) => void;
  onDocumentsLoaded?: (documents: DocumentData[]) => void;
}

const MobileDocuments: React.FC<MobileDocumentsProps> = ({
  organizationSlug,
  onDocumentSelect,
  onDocumentsLoaded,
}) => {
  const { theme, themedStyles } = useThemedStyles();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const documentService = new DocumentService();
      const docs = await documentService.getOrganizationDocuments(organizationSlug);
      setDocuments(docs);
      onDocumentsLoaded?.(docs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('documents.loadError', { defaultValue: 'Failed to load documents' });
      setError(errorMessage);
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug, onDocumentsLoaded]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-select document if there's only one
  useEffect(() => {
    if (documents.length === 1) {
      onDocumentSelect(documents[0]);
    }
  }, [documents, onDocumentSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderDocumentItem = ({ item }: { item: DocumentData }) => (
    <TouchableOpacity
      style={[styles.documentItem, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}
      onPress={() => onDocumentSelect(item)}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>📄</Text>
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, themedStyles.primaryText]} numberOfLines={2}>
          {item.file_name}
        </Text>
        <Text style={[styles.documentMeta, themedStyles.secondaryText]}>
          {formatFileSize(item.file_size)} • {formatDate(item.created_at)}
        </Text>
      </View>
      <View style={styles.arrowIcon}>
        <Text style={[styles.arrowText, { color: theme.primaryColor }]}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.loadingContainer}>
          <LoadingScreen />
          <Text style={[styles.loadingText, themedStyles.primaryText]}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📄</Text>
          <Text style={[styles.errorTitle, themedStyles.primaryText]}>Unable to Load Documents</Text>
          <Text style={[styles.errorMessage, themedStyles.secondaryText]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primaryColor }]} onPress={fetchDocuments}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (documents.length === 0) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={[styles.emptyTitle, themedStyles.primaryText]}>No Documents Available</Text>
          <Text style={[styles.emptyMessage, themedStyles.secondaryText]}>
            There are no documents available for signing at this time.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, themedStyles.primaryText]}>Documents to Sign</Text>
        <Text style={[styles.headerSubtitle, themedStyles.secondaryText]}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} available
        </Text>
      </View>
      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2F5D62',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default MobileDocuments;
