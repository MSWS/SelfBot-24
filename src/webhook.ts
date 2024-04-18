import fetch from 'node-fetch';

export async function sendWebhook(WEBHOOK_URL: string, data: any) {
    console.log(data);
    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    console.log(response.status);
}

export function generateWebhookMessage(message: string) {
    return {
        content: message,
    };
}