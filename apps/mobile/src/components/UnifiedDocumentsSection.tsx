import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useAppConfig } from '../hooks/useAppConfig';
import MobileDocuments from './MobileDocuments';
import { MobileIntakeForms } from './MobileIntakeForms';
import { DocumentData } from '../services/DocumentService';
import Icon from 'react-native-vector-icons/Feather';

interface UnifiedDocumentsSectionProps {
  navigation: any;
}

type DocumentsTab = 'documents' | 'forms';

export const UnifiedDocumentsSection: React.FC<UnifiedDocumentsSectionProps> = ({ navigation }) => {
  const { theme, fontSizes } = useThemedStyles();
  const { config } = useAppConfig();
  const [activeTab, setActiveTab] = useState<DocumentsTab>('documents');
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
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'documents' && [styles.activeTabButton, { backgroundColor: theme.primaryColor }],
          ]}
          onPress={() => setActiveTab('documents')}
        >
          <Icon
            name="file-text"
            size={16}
            color={activeTab === 'documents' ? '#FFFFFF' : theme.placeholderColor}
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'documents' ? '#FFFFFF' : theme.placeholderColor, fontSize: fontSizes.sm },
          ]}>
            Documentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'forms' && [styles.activeTabButton, { backgroundColor: theme.primaryColor }],
          ]}
          onPress={() => setActiveTab('forms')}
        >
          <Icon
            name="clipboard"
            size={16}
            color={activeTab === 'forms' ? '#FFFFFF' : theme.placeholderColor}
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'forms' ? '#FFFFFF' : theme.placeholderColor, fontSize: fontSizes.sm },
          ]}>
            Formularios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'documents' ? (
          <MobileDocuments
            organizationSlug={config.organizationSlug || ''}
            onDocumentSelect={handleDocumentSelect}
            onDocumentsLoaded={handleDocumentsLoaded}
          />
        ) : (
          <MobileIntakeForms
            organizationSlug={config.organizationSlug || ''}
            navigation={navigation}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(44, 44, 46, 0.8)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#D4A574',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(244, 228, 188, 0.8)',
  },
  content: {
    flex: 1,
  },
});
