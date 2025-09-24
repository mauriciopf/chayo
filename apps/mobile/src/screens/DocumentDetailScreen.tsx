import React from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MobileDocumentViewer } from '../components/MobileDocumentViewer';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigationHeader } from '../context/NavigationContext';
import { DocumentData } from '../services/DocumentService';

export const DocumentDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { document, totalDocuments } = route.params as { document: DocumentData; totalDocuments?: number };
  const { t } = useTranslation();

  // Use auto-cleanup navigation header (same pattern as ProductDetailScreen)
  useNavigationHeader('Document Details', {
    onBackPress: () => navigation.goBack(),
    autoCleanup: true, // Automatically return to business header when component unmounts
  });

  const handleBackToList = () => {
    navigation.goBack();
  };

  const getBackButtonText = (): string | null => {
    return totalDocuments && totalDocuments > 1 ? `‹ ${t('documents.title')}` : null;
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

  return (
    <View style={styles.container}>
      <MobileDocumentViewer 
        documentId={document.id}
        onBack={totalDocuments && totalDocuments > 1 ? handleBackToList : undefined}
        backButtonText={getBackButtonText()}
        onSigningComplete={handleSigningComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
