interface AppointmentSettings {
  provider: string;
  provider_url: string;
  settings: any;
}

interface AppointmentProvider {
  id: string;
  name: string;
  type: 'embed' | 'link';
  description: string;
  setupRequired: boolean;
  hasOAuth: boolean;
}

class AppointmentService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://chayo.ai') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get appointment settings for an organization
   */
  async getAppointmentSettings(organizationId: string): Promise<AppointmentSettings | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/organizations/${organizationId}/appointment-settings`);
      
      if (!response.ok) {
        console.error('Failed to fetch appointment settings:', response.status);
        return null;
      }

      const data = await response.json();
      return data.settings || null;
    } catch (error) {
      console.error('Error fetching appointment settings:', error);
      return null;
    }
  }

  /**
   * Determine if we should use native calendar or WebView
   */
  shouldUseNativeCalendar(settings: AppointmentSettings | null): boolean {
    // Use native calendar for Chayo appointments (custom provider)
    // Use WebView for external providers (Calendly, Vagaro, etc.)
    return !settings || settings.provider === 'custom' || settings.provider === 'chayo';
  }

  /**
   * Get the WebView URL for external calendar providers
   */
  getWebViewUrl(settings: AppointmentSettings, organizationSlug: string): string {
    if (settings.provider === 'calendly' && settings.provider_url) {
      return settings.provider_url;
    }

    // Fallback to organization's booking page
    return `${this.baseUrl}/book-appointment/${organizationSlug}`;
  }

  /**
   * Create an appointment using the API
   */
  async createAppointment(appointmentData: {
    organizationId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentTime: string; // HH:MM
    serviceType?: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result };
      } else {
        return { success: false, error: result.error || 'Failed to create appointment' };
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  /**
   * Get available appointment providers
   */
  getAvailableProviders(): AppointmentProvider[] {
    return [
      {
        id: 'custom',
        name: 'Chayo Appointments',
        type: 'embed',
        description: 'Use our built-in calendar booking system - no setup required',
        setupRequired: false,
        hasOAuth: false,
      },
      {
        id: 'calendly',
        name: 'Calendly',
        type: 'embed',
        description: 'Connect your Calendly account for seamless booking integration',
        setupRequired: true,
        hasOAuth: true,
      },
      {
        id: 'vagaro',
        name: 'Vagaro',
        type: 'link',
        description: 'Redirect to your Vagaro booking page',
        setupRequired: true,
        hasOAuth: false,
      },
    ];
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
export default AppointmentService;
