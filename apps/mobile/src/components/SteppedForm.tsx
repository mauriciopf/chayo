import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  InputAccessoryView,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useThemedStyles } from '../context/ThemeContext';
import AuthGate from './AuthGate';
import { useAppConfig } from '../hooks/useAppConfig';
import { FormioComponent } from '../formio';


interface SteppedFormProps {
  title: string;
  description?: string;
  components: FormioComponent[];
  formData: { [key: string]: any };
  errors: { [key: string]: string };
  onFieldChange: (fieldKey: string, value: any) => void;
  onSubmit: () => void;
  onAuthenticatedSubmit?: (user: any, customerId: string) => void;
  submitting: boolean;
  renderField: (component: FormioComponent, ref?: React.RefObject<any>) => React.ReactNode;
  organizationId?: string;
}

// Helper to check if field type needs keyboard
const isInputField = (component: FormioComponent) => {
  return ['textfield', 'email', 'number', 'phone_number', 'textarea'].includes(component.type);
};

export const SteppedForm: React.FC<SteppedFormProps> = ({
  title,
  description,
  components,
  formData,
  onSubmit,
  onAuthenticatedSubmit,
  submitting,
  renderField,
  organizationId,
}) => {
  const { theme, fontSizes } = useThemedStyles();
  const { config } = useAppConfig();
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<TextInput>(null);
  
  const totalSteps = components.length;
  const currentComponent = components[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const goToNextStep = () => {
    if (isLastStep) {
      onSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Auto-focus input when step changes (for ALL field types)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300); // Small delay for smooth transition
    
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Focus on mount (for ALL field types)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500); // Delay for component to fully mount
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus when returning to Forms tab (for ALL field types)
  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }, [])
  );

  // Auto-advance when non-input field is filled
  useEffect(() => {
    if (!isInputField(currentComponent)) {
      const value = formData[currentComponent?.key || ''];
      if (value && !isLastStep) {
        // Auto-advance after selection with small delay
        const timer = setTimeout(() => {
          goToNextStep();
        }, 800); // Give user time to see their selection
        
        return () => clearTimeout(timer);
      }
    }
  }, [formData, currentComponent, isLastStep]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header with progress */}
      <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.title, { color: theme.textColor, fontSize: fontSizes.xl }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
            {description}
          </Text>
        )}
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.borderColor }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  backgroundColor: theme.primaryColor,
                  width: `${progress}%`,
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Current Step Content */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Step Content */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <Text style={[styles.stepTitle, { color: theme.textColor, fontSize: fontSizes.lg }]}>
              {currentComponent?.label}
              {currentComponent?.validate?.required && <Text style={{ color: theme.errorColor, fontSize: fontSizes.lg }}> *</Text>}
            </Text>
            {currentComponent?.description && (
              <Text style={[styles.stepDescription, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                {currentComponent.description}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            {renderField(currentComponent, inputRef)}
          </View>
          
          {/* Auto-advance hint for non-input fields */}
          {(currentComponent?.type === 'select' || currentComponent?.type === 'radio') && (
            <View style={styles.hintContainer}>
              <Text style={[styles.hintText, { color: theme.placeholderColor, fontSize: fontSizes.xs }]}>
                Select an option to continue
              </Text>
            </View>
          )}
        </View>

      </KeyboardAvoidingView>
      
      {/* iOS Input Accessory View - Navigation above keyboard for ALL fields */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="formNavigation">
          <View style={[styles.inputAccessory, { backgroundColor: theme.backgroundColor, borderTopColor: theme.borderColor }]}>
            {!isFirstStep && (
              <TouchableOpacity
                style={[styles.accessoryButton, { borderColor: theme.borderColor }]}
                onPress={goToPreviousStep}
              >
                <Text style={[styles.accessoryButtonText, { color: theme.textColor, fontSize: fontSizes.base }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.accessoryProgress}>
              <Text style={[styles.accessoryProgressText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                {currentStep + 1} of {totalSteps}
              </Text>
            </View>
            
            {isLastStep && onAuthenticatedSubmit ? (
              <AuthGate
                tool="intake_forms"
                organizationId={organizationId || config?.organizationId || ''}
                onAuthenticated={onAuthenticatedSubmit}
                title="Inicia sesión para enviar tu formulario"
                message="Necesitamos tu correo para enviarte una copia de tu respuesta"
              >
                <TouchableOpacity
                  style={[styles.accessoryButton, { backgroundColor: theme.primaryColor }]}
                  disabled={submitting}
                >
                  <Text style={[styles.accessoryButtonText, { color: '#FFFFFF', fontSize: fontSizes.base }]}>
                    {submitting ? 'Sending...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </AuthGate>
            ) : (
              <TouchableOpacity
                style={[styles.accessoryButton, { backgroundColor: theme.primaryColor }]}
                onPress={goToNextStep}
                disabled={submitting}
              >
                <Text style={[styles.accessoryButtonText, { color: '#FFFFFF', fontSize: fontSizes.base }]}>
                  {submitting ? 'Sending...' : isLastStep ? 'Submit' : 'Next →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </InputAccessoryView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  swipeArea: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },
  stepHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldContainer: {
    paddingHorizontal: 16,
  },
  hintContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  accessoryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  accessoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accessoryProgress: {
    flex: 1,
    alignItems: 'center',
  },
  accessoryProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  navButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressInfo: {
    flex: 1,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
