import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,

  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  IntakeForm,
  FormioComponent,

  FORMIO_FIELD_TYPES,
  validateFormSubmission,
  getFormDefaultValues,
  getFieldOptions,
  shouldShowComponent,
  getVisibleComponents,
  isTextField,
  isEmailField,
  isNumberField,
  isPhoneNumberField,
  isTextAreaField,

} from '@chayo/formio';
import { intakeFormService } from '../services/IntakeFormService';
import { useThemedStyles } from '../context/ThemeContext';
import { useCallback } from 'react';

interface MobileIntakeFormProps {
  formId: string;
  onSubmissionComplete?: (success: boolean, message: string) => void;
  onFormLoad?: (form: IntakeForm) => void;
}

interface FieldComponentProps {
  component: FormioComponent;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

// Individual field components
const TextFieldComponent: React.FC<FieldComponentProps> = ({ component, value, onChange, error }) => {
  const { theme, themedStyles } = useThemedStyles();
  const keyboardType = isEmailField(component)
    ? 'email-address'
    : isNumberField(component)
    ? 'numeric'
    : isPhoneNumberField(component)
    ? 'phone-pad'
    : 'default';

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, themedStyles.primaryText]}>
        {component.label}
        {component.validate?.required && <Text style={[styles.required, { color: theme.errorColor }]}> *</Text>}
      </Text>
      {component.description && (
        <Text style={[styles.fieldDescription, themedStyles.secondaryText]}>{component.description}</Text>
      )}
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.surfaceColor,
            color: theme.textColor,
            borderColor: theme.borderColor,
          },
          error && { borderColor: theme.errorColor },
        ]}
        value={value || ''}
        onChangeText={onChange}
        placeholder={component.placeholder}
        placeholderTextColor={theme.placeholderColor}
        keyboardType={keyboardType}
        multiline={isTextAreaField(component)}
        numberOfLines={isTextAreaField(component) ? 4 : 1}
        secureTextEntry={isTextField(component) && (component as any).inputType === 'password'}
        autoCapitalize={isEmailField(component) ? 'none' : 'sentences'}
        autoCorrect={!isEmailField(component)}
      />
      {error && <Text style={[styles.errorText, { color: theme.errorColor }]}>{error}</Text>}
    </View>
  );
};

const SelectFieldComponent: React.FC<FieldComponentProps> = ({ component, value, onChange, error }) => {
  const { theme, themedStyles } = useThemedStyles();
  const options = getFieldOptions(component);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, themedStyles.primaryText]}>
        {component.label}
        {component.validate?.required && <Text style={[styles.required, { color: theme.errorColor }]}> *</Text>}
      </Text>
      {component.description && (
        <Text style={[styles.fieldDescription, themedStyles.secondaryText]}>{component.description}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.surfaceColor,
            borderColor: theme.borderColor,
          },
          error && { borderColor: theme.errorColor },
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.selectButtonText, { color: value ? theme.textColor : theme.placeholderColor }]}>
          {value ? options.find(opt => opt.value === value)?.label || value : component.placeholder || 'Select an option'}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => {
              onChange(itemValue);
            }}
          >
            <Picker.Item label="Select an option" value="" />
            {options.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const RadioFieldComponent: React.FC<FieldComponentProps> = ({ component, value, onChange, error }) => {
  const { theme, themedStyles } = useThemedStyles();
  const options = getFieldOptions(component);

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, themedStyles.primaryText]}>
        {component.label}
        {component.validate?.required && <Text style={[styles.required, { color: theme.errorColor }]}> *</Text>}
      </Text>
      {component.description && (
        <Text style={[styles.fieldDescription, themedStyles.secondaryText]}>{component.description}</Text>
      )}

      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.radioOption}
          onPress={() => onChange(option.value)}
        >
          <View style={[styles.radioCircle, { borderColor: theme.borderColor }]}>
            {value === option.value && <View style={[styles.radioSelected, { backgroundColor: theme.primaryColor }]} />}
          </View>
          <Text style={[styles.radioLabel, themedStyles.primaryText]}>{option.label}</Text>
        </TouchableOpacity>
      ))}

      {error && <Text style={[styles.errorText, { color: theme.errorColor }]}>{error}</Text>}
    </View>
  );
};

const CheckboxFieldComponent: React.FC<FieldComponentProps> = ({ component, value, onChange, error }) => {
  const { theme, themedStyles } = useThemedStyles();
  return (
    <View style={styles.fieldContainer}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onChange(!value)}
      >
        <View style={[
          styles.checkbox,
          { borderColor: theme.borderColor },
          value && { backgroundColor: theme.primaryColor },
        ]}>
          {value && <Text style={[styles.checkmark, { color: theme.backgroundColor }]}>✓</Text>}
        </View>
        <Text style={[styles.checkboxLabel, themedStyles.primaryText]}>
          {component.label}
          {component.validate?.required && <Text style={[styles.required, { color: theme.errorColor }]}> *</Text>}
        </Text>
      </TouchableOpacity>
      {component.description && (
        <Text style={[styles.fieldDescription, themedStyles.secondaryText]}>{component.description}</Text>
      )}
      {error && <Text style={[styles.errorText, { color: theme.errorColor }]}>{error}</Text>}
    </View>
  );
};

const DateTimeFieldComponent: React.FC<FieldComponentProps> = ({ component, value, onChange, error }) => {
  const { theme, themedStyles } = useThemedStyles();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate.toISOString());
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, themedStyles.primaryText]}>
        {component.label}
        {component.validate?.required && <Text style={[styles.required, { color: theme.errorColor }]}> *</Text>}
      </Text>
      {component.description && (
        <Text style={[styles.fieldDescription, themedStyles.secondaryText]}>{component.description}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.surfaceColor,
            borderColor: theme.borderColor,
          },
          error && { borderColor: theme.errorColor },
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.selectButtonText, { color: value ? theme.textColor : theme.placeholderColor }]}>
          {value ? dateValue.toLocaleDateString() : component.placeholder || 'Select date'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Main form component
export const MobileIntakeForm: React.FC<MobileIntakeFormProps> = ({
  formId,
  onSubmissionComplete,
  onFormLoad,
}) => {
  const { theme, themedStyles } = useThemedStyles();
  const [form, setForm] = useState<IntakeForm | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [anonymousUserId] = useState(() => intakeFormService.generateAnonymousUserId());

  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      const loadedForm = await intakeFormService.getForm(formId);
      setForm(loadedForm);

      // Initialize form data with default values
      if (loadedForm.formio_definition) {
        const defaultValues = getFormDefaultValues(loadedForm.formio_definition);
        setFormData(defaultValues);
      }

      onFormLoad?.(loadedForm);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [formId, onFormLoad]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value,
    }));

    // Clear field error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!form?.formio_definition) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      // Validate form
      const validation = validateFormSubmission(form.formio_definition, { data: formData });

      if (!validation.isValid) {
        const fieldErrors: { [key: string]: string } = {};
        validation.errors.forEach(error => {
          // Try to match error to field (simple approach)
          const component = form.formio_definition?.components.find(comp =>
            error.includes(comp.label)
          );
          if (component) {
            fieldErrors[component.key] = error;
          }
        });
        setErrors(fieldErrors);
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      // Submit form
      const result = await intakeFormService.submitForm(
        formId,
        { data: formData },
        { anonymousUserId }
      );

      Alert.alert('Success', result.message);
      onSubmissionComplete?.(true, result.message);

      // Reset form
      if (form.formio_definition) {
        const defaultValues = getFormDefaultValues(form.formio_definition);
        setFormData(defaultValues);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      Alert.alert('Error', errorMessage);
      onSubmissionComplete?.(false, errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (component: FormioComponent) => {
    if (!shouldShowComponent(component, formData)) {
      return null;
    }

    const value = formData[component.key];
    const error = errors[component.key];
    const fieldProps = {
      component,
      value,
      onChange: (newValue: any) => handleFieldChange(component.key, newValue),
      error,
    };

    switch (component.type) {
      case FORMIO_FIELD_TYPES.TEXTFIELD:
      case FORMIO_FIELD_TYPES.EMAIL:
      case FORMIO_FIELD_TYPES.NUMBER:
      case FORMIO_FIELD_TYPES.PHONE_NUMBER:
      case FORMIO_FIELD_TYPES.TEXTAREA:
        return <TextFieldComponent key={component.key} {...fieldProps} />;

      case FORMIO_FIELD_TYPES.SELECT:
        return <SelectFieldComponent key={component.key} {...fieldProps} />;

      case FORMIO_FIELD_TYPES.RADIO:
        return <RadioFieldComponent key={component.key} {...fieldProps} />;

      case FORMIO_FIELD_TYPES.CHECKBOX:
        return <CheckboxFieldComponent key={component.key} {...fieldProps} />;

      case FORMIO_FIELD_TYPES.DATETIME:
        return <DateTimeFieldComponent key={component.key} {...fieldProps} />;

      case FORMIO_FIELD_TYPES.BUTTON:
        // Skip buttons - we'll render our own submit button
        return null;

      default:
        // Fallback to text input for unknown types
        return <TextFieldComponent key={component.key} {...fieldProps} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, themedStyles.container]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.loadingText, themedStyles.primaryText]}>Loading form...</Text>
      </View>
    );
  }

  if (!form) {
    return (
      <View style={[styles.errorContainer, themedStyles.container]}>
        <Text style={[styles.errorTitle, { color: theme.errorColor }]}>Form Not Found</Text>
        <Text style={[styles.errorMessage, themedStyles.secondaryText]}>The requested form could not be loaded.</Text>
      </View>
    );
  }

  const visibleComponents = form.formio_definition
    ? getVisibleComponents(form.formio_definition, formData)
    : [];

  return (
    <ScrollView style={[styles.container, themedStyles.container]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.formTitle, themedStyles.primaryText]}>{form.name}</Text>
        {form.description && (
          <Text style={[styles.formDescription, themedStyles.secondaryText]}>{form.description}</Text>
        )}
      </View>

      <View style={styles.formFields}>
        {visibleComponents.map(component => renderField(component))}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: submitting ? theme.borderColor : theme.primaryColor },
          submitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={theme.textColor} />
        ) : (
          <Text style={[styles.submitButtonText, { color: theme.textColor }]}>Submit Form</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
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
    opacity: 0.8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 22,
  },
  formFields: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  required: {
    color: '#FF453A',
  },
  fieldDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#2C2C2E',
    minHeight: 48,
  },
  inputError: {
    borderColor: '#FF453A',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#2C2C2E',
    minHeight: 48,
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  placeholder: {
    color: '#8E8E93',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2C2C2E',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    zIndex: 1000,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  pickerDone: {
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '600',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0A84FF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A84FF',
  },
  radioLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0A84FF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0A84FF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    marginTop: 4,
  },
});
