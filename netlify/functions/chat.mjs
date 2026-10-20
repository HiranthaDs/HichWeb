import { handleChatRequest } from '../../server/chat.js';

export default (request, context) => handleChatRequest(request, { env: process.env, clientId: context.ip || 'anonymous' });

export const config = { path: '/api/chat' };
