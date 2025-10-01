import {
  FormioComponent,
  FormioFormDefinition,
  FormioSubmission,
  FORMIO_FIELD_TYPES,
  FormioSelectOption,
  isSelectField,
  isRadioField,
  isSelectBoxesField,
} from './types';

/**
 * Validates a form submission against the form definition
 */
export function validateFormSubmission(
  formDefinition: FormioFormDefinition,
  submission: FormioSubmission
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const data = submission.data;

  for (const component of formDefinition.components) {
    // Skip validation for buttons and hidden fields
    if (component.type === FORMIO_FIELD_TYPES.BUTTON || component.hidden) {
      continue;
    }

    const value = data[component.key];
    const isRequired = component.validate?.required;

    // Check required fields
    if (isRequired && (value === undefined || value === null || value === '')) {
      errors.push(`${component.label} is required`);
      continue;
    }

    // Skip further validation if field is empty and not required
    if (!value && !isRequired) {
      continue;
    }

    // Type-specific validation
    switch (component.type) {
      case FORMIO_FIELD_TYPES.EMAIL:
        if (value && !isValidEmail(value)) {
          errors.push(`${component.label} must be a valid email address`);
        }
        break;

      case FORMIO_FIELD_TYPES.NUMBER:
        if (value && isNaN(Number(value))) {
          errors.push(`${component.label} must be a valid number`);
        }
        break;

      case FORMIO_FIELD_TYPES.TEXTFIELD:
      case FORMIO_FIELD_TYPES.TEXTAREA:
        if (component.validate?.minLength && value.length < component.validate.minLength) {
          errors.push(`${component.label} must be at least ${component.validate.minLength} characters`);
        }
        if (component.validate?.maxLength && value.length > component.validate.maxLength) {
          errors.push(`${component.label} must be no more than ${component.validate.maxLength} characters`);
        }
        if (component.validate?.pattern && !new RegExp(component.validate.pattern).test(value)) {
          errors.push(`${component.label} format is invalid`);
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extracts default values from a form definition
 */
export function getFormDefaultValues(formDefinition: FormioFormDefinition): { [key: string]: any } {
  const defaultValues: { [key: string]: any } = {};

  for (const component of formDefinition.components) {
    if (component.defaultValue !== undefined) {
      defaultValues[component.key] = component.defaultValue;
    } else {
      // Set appropriate default based on field type
      switch (component.type) {
        case FORMIO_FIELD_TYPES.CHECKBOX:
          defaultValues[component.key] = false;
          break;
        case FORMIO_FIELD_TYPES.SELECTBOXES:
          defaultValues[component.key] = {};
          break;
        case FORMIO_FIELD_TYPES.SELECT:
          if (isSelectField(component) && component.multiple) {
            defaultValues[component.key] = [];
          } else {
            defaultValues[component.key] = '';
          }
          break;
        default:
          defaultValues[component.key] = '';
      }
    }
  }

  return defaultValues;
}

/**
 * Gets options for select-type fields
 */
export function getFieldOptions(component: FormioComponent): FormioSelectOption[] {
  if (isSelectField(component)) {
    return component.values || component.data?.values || [];
  }

  if (isRadioField(component)) {
    return component.values || [];
  }

  if (isSelectBoxesField(component)) {
    const values = component.values || {};
    return Object.entries(values).map(([key, option]) => ({
      label: option.label,
      value: key,
    }));
  }

  return [];
}

/**
 * Formats a field value for display
 */
export function formatFieldValue(component: FormioComponent, value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (component.type) {
    case FORMIO_FIELD_TYPES.SELECT:
    case FORMIO_FIELD_TYPES.RADIO:
      const options = getFieldOptions(component);
      const option = options.find(opt => opt.value === value);
      return option ? option.label : String(value);

    case FORMIO_FIELD_TYPES.SELECTBOXES:
      if (typeof value === 'object') {
        const options = getFieldOptions(component);
        const selectedOptions = Object.entries(value)
          .filter(([, selected]) => selected)
          .map(([key]) => {
            const option = options.find(opt => opt.value === key);
            return option ? option.label : key;
          });
        return selectedOptions.join(', ');
      }
      return String(value);

    case FORMIO_FIELD_TYPES.CHECKBOX:
      return value ? 'Yes' : 'No';

    case FORMIO_FIELD_TYPES.DATETIME:
      if (value) {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      }
      return '';

    default:
      return String(value);
  }
}

/**
 * Checks if a component should be shown based on conditional logic
 */
export function shouldShowComponent(
  component: FormioComponent,
  formData: { [key: string]: any }
): boolean {
  if (!component.conditional) {
    return !component.hidden;
  }

  const { show, when, eq } = component.conditional;

  if (when && eq !== undefined) {
    const conditionValue = formData[when];
    const shouldShow = conditionValue === eq;
    return show ? shouldShow : !shouldShow;
  }

  return !component.hidden;
}

/**
 * Gets all visible components based on current form data
 */
export function getVisibleComponents(
  formDefinition: FormioFormDefinition,
  formData: { [key: string]: any }
): FormioComponent[] {
  return formDefinition.components.filter(component =>
    shouldShowComponent(component, formData)
  );
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Converts legacy field format to Form.io format (for backward compatibility)
 */
export function convertLegacyFieldsToFormio(legacyFields: any[]): FormioFormDefinition {
  const components: FormioComponent[] = legacyFields.map((field, index) => {
    const baseComponent = {
      id: field.id || `field_${index}`,
      key: field.name || `field_${index}`,
      label: field.label || 'Untitled Field',
      placeholder: field.placeholder || '',
      validate: {
        required: field.required || false,
      },
    };

    switch (field.type) {
      case 'text':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.TEXTFIELD,
        } as FormioComponent;

      case 'email':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.EMAIL,
        } as FormioComponent;

      case 'phone':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.PHONE_NUMBER,
        } as FormioComponent;

      case 'textarea':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.TEXTAREA,
          rows: 3,
        } as FormioComponent;

      case 'select':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.SELECT,
          values: (field.options || []).map((option: string, _idx: number) => ({
            label: option,
            value: option.toLowerCase().replace(/\s+/g, '_'),
          })),
        } as FormioComponent;

      case 'radio':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.RADIO,
          values: (field.options || []).map((option: string) => ({
            label: option,
            value: option.toLowerCase().replace(/\s+/g, '_'),
          })),
        } as FormioComponent;

      case 'checkbox':
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.CHECKBOX,
        } as FormioComponent;

      default:
        return {
          ...baseComponent,
          type: FORMIO_FIELD_TYPES.TEXTFIELD,
        } as FormioComponent;
    }
  });

  return {
    type: 'form',
    display: 'form',
    components,
  };
}

/**
 * Creates a new Form.io component with default values
 */
export function createFormioComponent(
  type: string,
  label: string,
  key?: string
): FormioComponent {
  const baseComponent = {
    id: `component_${Date.now()}`,
    key: key || label.toLowerCase().replace(/\s+/g, '_'),
    label,
    type,
    placeholder: '',
    validate: {
      required: false,
    },
  };

  switch (type) {
    case FORMIO_FIELD_TYPES.SELECT:
      return {
        ...baseComponent,
        type: FORMIO_FIELD_TYPES.SELECT,
        values: [],
      } as FormioComponent;

    case FORMIO_FIELD_TYPES.RADIO:
      return {
        ...baseComponent,
        type: FORMIO_FIELD_TYPES.RADIO,
        values: [],
      } as FormioComponent;

    case FORMIO_FIELD_TYPES.SELECTBOXES:
      return {
        ...baseComponent,
        type: FORMIO_FIELD_TYPES.SELECTBOXES,
        values: {},
      } as FormioComponent;

    case FORMIO_FIELD_TYPES.TEXTAREA:
      return {
        ...baseComponent,
        type: FORMIO_FIELD_TYPES.TEXTAREA,
        rows: 3,
      } as FormioComponent;

    case FORMIO_FIELD_TYPES.DATETIME:
      return {
        ...baseComponent,
        type: FORMIO_FIELD_TYPES.DATETIME,
        enableDate: true,
        enableTime: false,
      } as FormioComponent;

    default:
      return baseComponent as FormioComponent;
  }
}
