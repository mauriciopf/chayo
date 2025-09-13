import { z } from 'zod';

// Base Form.io component interface
export interface FormioBaseComponent {
  id: string;
  type: string;
  label: string;
  key: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  validate?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
  };
  conditional?: {
    show?: boolean;
    when?: string;
    eq?: string;
  };
  disabled?: boolean;
  hidden?: boolean;
  tableView?: boolean;
  defaultValue?: any;
}

// Specific field types
export interface FormioTextField extends FormioBaseComponent {
  type: 'textfield';
  inputType?: 'text' | 'password';
  spellcheck?: boolean;
  inputMask?: string;
}

export interface FormioEmailField extends FormioBaseComponent {
  type: 'email';
  kickbox?: {
    enabled?: boolean;
  };
}

export interface FormioNumberField extends FormioBaseComponent {
  type: 'number';
  delimiter?: boolean;
  requireDecimal?: boolean;
  decimalLimit?: number;
  multiple?: boolean;
}

export interface FormioPhoneNumberField extends FormioBaseComponent {
  type: 'phoneNumber';
  inputMask?: string;
}

export interface FormioTextAreaField extends FormioBaseComponent {
  type: 'textarea';
  rows?: number;
  wysiwyg?: boolean;
  editor?: string;
}

export interface FormioSelectOption {
  label: string;
  value: string | number;
  shortcut?: string;
}

export interface FormioSelectField extends FormioBaseComponent {
  type: 'select';
  data?: {
    values?: FormioSelectOption[];
    json?: string;
    url?: string;
    resource?: string;
  };
  dataSrc?: 'values' | 'json' | 'url' | 'resource';
  valueProperty?: string;
  template?: string;
  multiple?: boolean;
  searchEnabled?: boolean;
  searchField?: string;
  minSearch?: number;
  readOnlyValue?: boolean;
  selectThreshold?: number;
  fuseOptions?: any;
  customOptions?: any;
  values?: FormioSelectOption[];
}

export interface FormioRadioField extends FormioBaseComponent {
  type: 'radio';
  values?: FormioSelectOption[];
  inline?: boolean;
  optionsLabelPosition?: 'top' | 'left' | 'right' | 'bottom';
}

export interface FormioCheckboxField extends FormioBaseComponent {
  type: 'checkbox';
  name?: string;
  value?: string;
  dataGridLabel?: boolean;
}

export interface FormioSelectBoxesField extends FormioBaseComponent {
  type: 'selectboxes';
  values?: { [key: string]: FormioSelectOption };
  inline?: boolean;
  minSelectedCount?: number;
  maxSelectedCount?: number;
}

export interface FormioDateTimeField extends FormioBaseComponent {
  type: 'datetime';
  format?: string;
  useLocaleSettings?: boolean;
  allowInput?: boolean;
  clickOpens?: boolean;
  enableDate?: boolean;
  enableTime?: boolean;
  dateOnly?: boolean;
  timeOnly?: boolean;
  hourStep?: number;
  minuteStep?: number;
  minDate?: string;
  maxDate?: string;
  datePicker?: {
    minDate?: string;
    maxDate?: string;
    disable?: string[];
    disableWeekends?: boolean;
    disableWeekdays?: boolean;
  };
  timePicker?: {
    hourStep?: number;
    minuteStep?: number;
    showMeridian?: boolean;
  };
}

export interface FormioButtonField extends FormioBaseComponent {
  type: 'button';
  action?: 'submit' | 'reset' | 'event' | 'custom';
  theme?: 'primary' | 'secondary' | 'info' | 'success' | 'danger' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: string;
  rightIcon?: string;
  block?: boolean;
  disableOnInvalid?: boolean;
}

// Union type for all field types
export type FormioComponent = 
  | FormioTextField
  | FormioEmailField
  | FormioNumberField
  | FormioPhoneNumberField
  | FormioTextAreaField
  | FormioSelectField
  | FormioRadioField
  | FormioCheckboxField
  | FormioSelectBoxesField
  | FormioDateTimeField
  | FormioButtonField;

// Form definition interface
export interface FormioFormDefinition {
  type: 'form';
  display: 'form' | 'wizard' | 'pdf';
  components: FormioComponent[];
  title?: string;
  name?: string;
  path?: string;
  tags?: string[];
  settings?: {
    pdf?: any;
  };
  properties?: { [key: string]: any };
  macros?: any[];
}

// Complete intake form interface
export interface IntakeForm {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  fields: any[]; // Legacy field (empty for Form.io forms)
  formio_definition?: FormioFormDefinition;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Form response interface
export interface FormioSubmission {
  data: { [key: string]: any };
  metadata?: { [key: string]: any };
  state?: 'submitted' | 'draft';
}

export interface IntakeFormResponse {
  id: string;
  form_id: string;
  organization_id: string;
  client_name?: string;
  client_email?: string;
  responses: { [key: string]: any };
  submitted_at: string;
  anonymous_user_id?: string;
}

// Validation schemas using Zod
export const FormioComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  key: z.string(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  tooltip: z.string().optional(),
  validate: z.object({
    required: z.boolean().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    custom: z.string().optional(),
  }).optional(),
  conditional: z.object({
    show: z.boolean().optional(),
    when: z.string().optional(),
    eq: z.string().optional(),
  }).optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  tableView: z.boolean().optional(),
  defaultValue: z.any().optional(),
});

export const FormioFormDefinitionSchema = z.object({
  type: z.literal('form'),
  display: z.enum(['form', 'wizard', 'pdf']),
  components: z.array(FormioComponentSchema),
  title: z.string().optional(),
  name: z.string().optional(),
  path: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settings: z.object({
    pdf: z.any().optional(),
  }).optional(),
  properties: z.record(z.any()).optional(),
  macros: z.array(z.any()).optional(),
});

export const IntakeFormSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(z.any()),
  formio_definition: FormioFormDefinitionSchema.optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
});

// Field type constants
export const FORMIO_FIELD_TYPES = {
  TEXTFIELD: 'textfield',
  EMAIL: 'email',
  NUMBER: 'number',
  PHONE_NUMBER: 'phoneNumber',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  SELECTBOXES: 'selectboxes',
  DATETIME: 'datetime',
  BUTTON: 'button',
} as const;

export type FormioFieldType = typeof FORMIO_FIELD_TYPES[keyof typeof FORMIO_FIELD_TYPES];

// Helper type guards
export const isTextField = (component: FormioComponent): component is FormioTextField => 
  component.type === FORMIO_FIELD_TYPES.TEXTFIELD;

export const isEmailField = (component: FormioComponent): component is FormioEmailField => 
  component.type === FORMIO_FIELD_TYPES.EMAIL;

export const isNumberField = (component: FormioComponent): component is FormioNumberField => 
  component.type === FORMIO_FIELD_TYPES.NUMBER;

export const isPhoneNumberField = (component: FormioComponent): component is FormioPhoneNumberField => 
  component.type === FORMIO_FIELD_TYPES.PHONE_NUMBER;

export const isTextAreaField = (component: FormioComponent): component is FormioTextAreaField => 
  component.type === FORMIO_FIELD_TYPES.TEXTAREA;

export const isSelectField = (component: FormioComponent): component is FormioSelectField => 
  component.type === FORMIO_FIELD_TYPES.SELECT;

export const isRadioField = (component: FormioComponent): component is FormioRadioField => 
  component.type === FORMIO_FIELD_TYPES.RADIO;

export const isCheckboxField = (component: FormioComponent): component is FormioCheckboxField => 
  component.type === FORMIO_FIELD_TYPES.CHECKBOX;

export const isSelectBoxesField = (component: FormioComponent): component is FormioSelectBoxesField => 
  component.type === FORMIO_FIELD_TYPES.SELECTBOXES;

export const isDateTimeField = (component: FormioComponent): component is FormioDateTimeField => 
  component.type === FORMIO_FIELD_TYPES.DATETIME;

export const isButtonField = (component: FormioComponent): component is FormioButtonField => 
  component.type === FORMIO_FIELD_TYPES.BUTTON;
