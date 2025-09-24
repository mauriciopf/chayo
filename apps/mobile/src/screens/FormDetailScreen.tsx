import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MobileIntakeForm } from '../components/MobileIntakeForm';
import { useThemedStyles } from '../context/ThemeContext';
import { useNavigationHeader } from '../context/NavigationContext';

export const FormDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { formId } = route.params as { formId: string };
  const { themedStyles } = useThemedStyles();

  // Use auto-cleanup navigation header (same pattern as ProductDetailScreen)
  useNavigationHeader('Form Details', {
    onBackPress: () => navigation.goBack(),
    autoCleanup: true, // Automatically return to business header when component unmounts
  });

  const handleSubmissionComplete = (success: boolean, _message: string) => {
    if (success) {
      // Go back to list after successful submission
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <MobileIntakeForm
        formId={formId}
        onSubmissionComplete={handleSubmissionComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
