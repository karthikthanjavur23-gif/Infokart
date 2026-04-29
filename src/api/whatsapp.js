import { API_BASE_URL } from './config';

/**
 * Sends a real WhatsApp message using the WhatsApp Cloud API (via our local backend).
 * @param {string} to - The phone number to send the message to (with country code, no +)
 * @param {string} message - The text content of the message
 */
export const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send WhatsApp message');
    }

    return data;
  } catch (error) {
    console.error('Error in sendWhatsAppMessage:', error);
    throw error;
  }
};

