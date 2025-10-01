import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async () => {
  try {
    const messages = (await import('./messages/es.json')).default;

    return {
      locale: 'es',
      messages
    };
  } catch (error) {
    console.error('Failed to load Spanish messages:', error);
    throw error;
  }
});
