import { useState } from 'react';
import { SlugDetectionService } from '../services/SlugDetectionService';
import { StorageService } from '../services/StorageService';
import { useSSEProgress } from './useSSEProgress';
import { thinkingMessageService } from '../services/ThinkingMessageService';

interface SlugValidationResult {
  isValid: boolean;
  organizationId?: string;
  businessName?: string;
  fullConfig?: any;
  error?: string;
}

interface UseSlugValidationReturn {
  isValidating: boolean;
  validateSlug: (message: string, sessionId: string, organizationId?: string) => Promise<{
    isBusinessSlug: boolean;
    businessSlug?: string;
    suggestedResponse?: string;
    validationResult?: SlugValidationResult;
  }>;
}

export const useSlugValidation = (organizationId?: string): UseSlugValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const { connect: connectSSE, disconnect: disconnectSSE } = useSSEProgress(organizationId);

  const validateBusinessSlug = async (slug: string): Promise<SlugValidationResult> => {
    try {
      const response = await fetch(`https://chayo.vercel.app/api/app-config/${slug}`);

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: true,
          organizationId: data.organizationId,
          businessName: data.businessName || data.appName || 'tu negocio',
          fullConfig: data,
        };
      } else if (response.status === 404) {
        return {
          isValid: false,
          error: 'No encontré un negocio con ese código. ¿Podrías verificarlo?',
        };
      } else {
        return {
          isValid: false,
          error: 'Hubo un problema al verificar el código. ¿Podrías intentar de nuevo?',
        };
      }
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        error: 'No pude conectarme al servidor. Verifica tu conexión a internet.',
      };
    }
  };

  const validateSlug = async (message: string, sessionId: string, orgId?: string) => {
    setIsValidating(true);

    // Connect to SSE for real-time progress updates
    if (orgId || organizationId) {
      connectSSE(sessionId, 'slug_validation');
    }

    try {
      // Step 1: AI-powered slug detection
      // Use getOrCreateMessageStream to work with existing stream from ThinkingMessage component
      const messageStream = thinkingMessageService.getOrCreateMessageStream('slug_validation', sessionId);
      messageStream.updatePhase('detectingSlug');

      const slugDetection = await SlugDetectionService.detectSlug(message);

      // If not a business slug, return early
      if (!slugDetection.isBusinessSlug || slugDetection.confidence < 0.6) {
        disconnectSSE();
        setIsValidating(false);
        return {
          isBusinessSlug: false,
          suggestedResponse: slugDetection.suggestedResponse,
        };
      }

      // Step 2: Business validation with API
      messageStream.updatePhase('validatingSlug');
      const businessSlug = slugDetection.businessSlug || message.trim();
      const validationResult = await validateBusinessSlug(businessSlug);

      // Step 3: Load full config if validation successful
      if (validationResult.isValid && validationResult.fullConfig) {
        messageStream.updatePhase('loadingConfig');

        // Step 4: Save data
        messageStream.updatePhase('savingData');
        await StorageService.setOrganizationId(validationResult.organizationId!);

        messageStream.updatePhase('done');
      }

      disconnectSSE();
      setIsValidating(false);
      return {
        isBusinessSlug: true,
        businessSlug,
        validationResult,
      };

    } catch (error) {
      console.error('Slug validation error:', error);
      disconnectSSE();
      setIsValidating(false);
      return {
        isBusinessSlug: false,
        suggestedResponse: 'Hubo un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?',
      };
    }
  };

  return {
    isValidating,
    validateSlug,
  };
};
