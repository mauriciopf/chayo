'use client';

import { ThemeConfig } from '@/lib/shared/types/configTypes';

export interface ColorHarmonySuggestion {
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface ColorHarmonyRequest {
  currentColors: Partial<ThemeConfig>;
  changedField?: keyof ThemeConfig;
  businessType?: string;
}

/**
 * Service for generating AI-powered color harmony suggestions
 */
export class ColorHarmonyService {
  private static readonly OPENAI_API_URL = '/api/ai/color-harmony';

  /**
   * Get color harmony suggestions based on current color selection
   */
  static async getSuggestions(request: ColorHarmonyRequest): Promise<ColorHarmonySuggestion> {
    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to get color suggestions: ${response.statusText}`);
      }

      const suggestion = await response.json();
      return suggestion;
    } catch (error) {
      console.error('Error getting color harmony suggestions:', error);
      throw error; // Re-throw to let UI handle the failure
    }
  }


}
