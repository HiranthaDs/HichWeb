import { Readable } from 'node:stream';
import { handleChatRequest } from './chat.js';

export function chatMiddleware(env) {
  return async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/chat') return next();
    const controller = new AbortController();
    const onClose = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', onClose);
    try {
      const request = new Request(`http://${req.headers.host || '127.0.0.1'}${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req), duplex: 'half', signal: controller.signal });
      const response = await handleChatRequest(request, { env, clientId: req.socket.remoteAddress });
      if (controller.signal.aborted) return;
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (!response.body) return res.end();
      const body = Readable.fromWeb(response.body);
      controller.signal.addEventListener('abort', () => body.destroy(), { once: true });
      body.on('error', () => { if (!res.writableEnded) res.destroy(); });
      body.pipe(res);
    } catch {
      if (!controller.signal.aborted && !res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'The assistant could not complete the request. Please try again.' }));
      }
    }
  };
}
