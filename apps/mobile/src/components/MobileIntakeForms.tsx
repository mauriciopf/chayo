import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
          <Text style={styles.backButtonText}>‹ Back to Forms</Text>
        </TouchableOpacity>
        <MobileIntakeForm
          formId={selectedFormId}
          onSubmissionComplete={handleSubmissionComplete}
        />
      </View>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading intake forms...</Text>
      </View>
    );
  }

  // Show empty state
  if (forms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Forms Available</Text>
        <Text style={styles.emptyMessage}>
          There are currently no active intake forms for this organization.
        </Text>
      </View>
    );
  }

  // Show forms list
  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  formItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  formStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#28A745',
  },
  chevron: {
    fontSize: 24,
    color: '#CCC',
    marginLeft: 8,
  },
  backButton: {
    padding: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});
