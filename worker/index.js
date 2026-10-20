import { handleChatRequest } from '../server/chat.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat') {
      return handleChatRequest(request, {
        env,
        clientId: request.headers.get('CF-Connecting-IP') || 'anonymous',
      });
    }

    return env.ASSETS.fetch(request);
  },
};
