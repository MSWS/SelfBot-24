import fetch from 'node-fetch';

export async function sendWebhook(WEBHOOK_URL: string, data: any) {
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
}

export function generateWebhookMessage(message: string) {
  return {
    content: message,
  };
}