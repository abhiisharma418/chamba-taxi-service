// src/lib/api.js

export function sendApiRequest(endpoint, data) {
  // Placeholder for a function to send API requests
  // Customize this according to your needs
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(res => res.json());
}
// src/lib/api.js

export class WhatsAppAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  sendMessage(to, message) {
    // implement sending message logic here
    console.log(`Sending message to ${to}: ${message}`);
  }
}
