import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { IntakeForm } from '@chayo/formio';
import { intakeFormService } from '../services/IntakeFormService';
import { MobileIntakeForm } from './MobileIntakeForm';

interface MobileIntakeFormsProps {
  organizationSlug: string;
}

interface FormListItemProps {
  form: IntakeForm;
  onPress: () => void;
}

const FormListItem: React.FC<FormListItemProps> = ({ form, onPress }) => (
  <TouchableOpacity style={styles.formItem} onPress={onPress}>
    <View style={styles.formContent}>
      <Text style={styles.formTitle}>{form.name}</Text>
      {form.description && (
        <Text style={styles.formDescription} numberOfLines={2}>
          {form.description}
        </Text>
      )}
      <Text style={styles.formStatus}>
        {form.is_active ? '✅ Active' : '❌ Inactive'}
      </Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

export const MobileIntakeForms: React.FC<MobileIntakeFormsProps> = ({ organizationSlug }) => {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, [organizationSlug]);

  // Auto-select the form if there's only one
  useEffect(() => {
    if (forms.length === 1 && !selectedFormId) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const loadedForms = await intakeFormService.getOrganizationForms(organizationSlug);
      // Filter to only show active forms
      const activeForms = loadedForms.filter(form => form.is_active);
      setForms(activeForms);
    } catch (error) {
      console.error('Error loading forms:', error);
      Alert.alert('Error', 'Failed to load intake forms');
    } finally {
      setLoading(false);
    }
  };

  const handleFormPress = (formId: string) => {
    setSelectedFormId(formId);
  };

  const handleBackToList = () => {
    setSelectedFormId(null);
  };

  const getBackButtonText = () => {
    return forms.length === 1 ? null : '‹ Back to Forms';
  };

  const handleSubmissionComplete = (success: boolean, message: string) => {
    if (success) {
      // Go back to list after successful submission
      setTimeout(() => {
        setSelectedFormId(null);
      }, 2000);
    }
  };

  // If a form is selected, show the form component
  if (selectedFormId) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
          <Text style={styles.backButtonText}>{getBackButtonText()}</Text>
        </TouchableOpacity>
        <MobileIntakeForm
          formId={selectedFormId}
          onSubmissionComplete={handleSubmissionComplete}
        />
      </SafeAreaView>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading intake forms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (forms.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Forms Available</Text>
          <Text style={styles.emptyMessage}>
            There are currently no active intake forms for this organization.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show forms list
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Intake Forms</Text>
        <Text style={styles.headerSubtitle}>
          Select a form to fill out
        </Text>
      </View>

      <FlatList
        data={forms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FormListItem
            form={item}
            onPress={() => handleFormPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  formItem: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: 8,
  },
  formStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#30D158',
  },
  chevron: {
    fontSize: 24,
    color: '#8E8E93',
    marginLeft: 8,
  },
  backButton: {
    padding: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '500',
  },
});
