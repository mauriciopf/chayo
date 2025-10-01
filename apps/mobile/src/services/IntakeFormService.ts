import { IntakeForm, IntakeFormResponse, FormioSubmission } from '../formio';

export class IntakeFormService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://chayo.vercel.app') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch a specific intake form by ID
   */
  async getForm(formId: string): Promise<IntakeForm> {
    try {
      const response = await fetch(`${this.baseUrl}/api/intake-forms/${formId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Formulario no encontrado');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Este formulario ya no está disponible');
        }
        throw new Error(`No se pudo cargar el formulario: ${response.statusText}`);
      }

      const data = await response.json();
      return data.form;
    } catch (error) {
      console.error('Error fetching form:', error);
      throw error;
    }
  }

  /**
   * Submit a form response
   */
  async submitForm(
    formId: string,
    submission: FormioSubmission,
    clientInfo?: {
      name?: string;
      email?: string;
      anonymousUserId?: string;
    }
  ): Promise<{ success: boolean; message: string; response_id?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/intake-forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: submission.data,
          clientName: clientInfo?.name,
          clientEmail: clientInfo?.email,
          anonymousUserId: clientInfo?.anonymousUserId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'No se pudo enviar el formulario');
      }

      return responseData;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }

  /**
   * Get forms for an organization by slug (public endpoint)
   */
  async getOrganizationForms(organizationSlug: string): Promise<IntakeForm[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/intake-forms/org/${organizationSlug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Organización no encontrada');
        }
        throw new Error(`No se pudieron cargar los formularios: ${response.statusText}`);
      }

      const data = await response.json();
      return data.forms || [];
    } catch (error) {
      console.error('Error fetching organization forms:', error);
      throw error;
    }
  }

  /**
   * Generate anonymous user ID for form submissions
   */
  generateAnonymousUserId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

// Export singleton instance
export const intakeFormService = new IntakeFormService();
