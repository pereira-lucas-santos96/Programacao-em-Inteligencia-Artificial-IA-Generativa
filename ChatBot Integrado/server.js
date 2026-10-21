import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { foundryConfiguration, requestFoundry } from './foundry.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const { configured } = foundryConfiguration;

const systemPrompt = `Você é Lupes, o assistente de viagens do LUPES TOUR. Responda em português brasileiro, de forma acolhedora, clara e objetiva. Ajude com planejamento, clima, aeroportos, documentação, traslado, vacinação, horários, vistos e moedas. Peça destino, datas, nacionalidade e conexões quando necessário, sem solicitar números de documentos ou outros dados sensíveis. Use texto simples com parágrafos curtos e listas com marcadores; não use tabelas ou HTML. Você NÃO tem ferramentas de busca ou acesso a dados em tempo real nesta integração. Nunca invente previsões, status de voos, cotações, preços, horários atuais ou regras vigentes. Informe a limitação e oriente a confirmação nas fontes oficiais. Para vistos e documentação, não apresente regras como verificadas e não dê garantias de entrada. Para vacinação, não prescreva nem determine vacinas: encaminhe a autoridades sanitárias e profissionais de saúde. Não invente URLs, fontes, reservas ou confirmações. Não execute transações. Se a pergunta não estiver relacionada a viagens, redirecione gentilmente.`;

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/assets/favicon.svg', ['assets/favicon.svg', 'image/svg+xml']],
  ['/assets/travel-scene.svg', ['assets/travel-scene.svg', 'image/svg+xml']]
]);

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};

function sendJson(response, status, payload) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  if (Number(request.headers['content-length']) > 65536) {
    const error = new Error('Mensagem muito grande. Inicie uma nova conversa.');
    error.status = 413;
    request.resume();
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 65536) {
      const error = new Error('Mensagem muito grande. Reduza o histórico ou inicie uma nova conversa.');
      error.status = 413;
      request.resume();
      throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const error = new Error('O corpo da solicitação deve conter JSON válido.'); error.status = 400; throw error; }
}

const rateLimits = new Map();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [address, entry] of rateLimits) if (entry.resetAt <= now) rateLimits.delete(address);
}, 60000);
cleanup.unref();
let inFlight = 0;

async function chat(request, response) {
  const origin = request.headers.origin;
  const allowedOrigin = process.env.APP_ORIGIN || `http://${request.headers.host}`;
  if (request.headers['sec-fetch-site'] === 'cross-site' || (origin && origin !== allowedOrigin)) return sendJson(response, 403, { error: 'Origem não autorizada.' });
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) return sendJson(response, 415, { error: 'Envie a solicitação como application/json.' });
  if (!configured) return sendJson(response, 503, { error: `Configuração incompleta. Falta: ${foundryConfiguration.missing.join('; ')}. Atualize o .env, reinicie o servidor e recarregue a página.` });
  const address = request.socket.remoteAddress;
  const now = Date.now();
  let rate = rateLimits.get(address);
  if (!rate || rate.resetAt <= now) { rate = { count: 0, resetAt: now + 60000 }; rateLimits.set(address, rate); }
  if (++rate.count > 15) return sendJson(response, 429, { error: 'Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente.' });
  if (inFlight >= 4) return sendJson(response, 503, { error: 'O assistente está ocupado. Tente novamente em alguns instantes.' });
  const body = await readJson(request);
  const messages = body?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 20 || messages.some(message => !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > (message.role === 'user' ? 4000 : 20000)) || messages.at(-1).role !== 'user') {
    return sendJson(response, 400, { error: 'Envie de 1 a 20 mensagens válidas, terminando com uma pergunta de até 4.000 caracteres.' });
  }
  const controller = new AbortController();
  if (inFlight >= 4) return sendJson(response, 503, { error: 'O assistente está ocupado. Tente novamente em alguns instantes.' });
  const timeout = setTimeout(() => controller.abort(), 120000);
  const disconnect = () => { if (!response.writableEnded) controller.abort(); };
  response.on('close', disconnect);
  inFlight++;
  try {
    const reply = await requestFoundry(messages, systemPrompt, controller.signal);
    sendJson(response, 200, { reply });
  } catch (error) {
    sendJson(response, error.name === 'AbortError' ? 504 : error.status || 502, { error: error.name === 'AbortError' ? 'O Foundry demorou para responder. Tente novamente.' : error.status ? error.message : 'Não foi possível conectar ao Foundry. Confira o endpoint e a conexão do servidor.' });
  } finally {
    inFlight--;
    clearTimeout(timeout);
    response.off('close', disconnect);
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/api/config' && request.method === 'GET') return sendJson(response, 200, foundryConfiguration);
    if (pathname === '/api/chat' && request.method === 'POST') return await chat(request, response);
    if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 405, { error: 'Método não permitido.' });
    const file = staticFiles.get(pathname);
    if (!file) return sendJson(response, 404, { error: 'Página não encontrada.' });
    const content = await readFile(path.join(root, file[0]));
    response.writeHead(200, { ...securityHeaders, 'Content-Type': file[1] });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    sendJson(response, error.status || 500, { error: error.status ? error.message : 'Não foi possível processar a solicitação.' });
  }
});
server.requestTimeout = 70000;
server.headersTimeout = 10000;
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `A porta ${port} já está em uso. Altere PORT no .env.` : 'Não foi possível iniciar o servidor. Verifique HOST e PORT.'); process.exitCode = 1; });
server.listen(port, host, () => {
  console.log(`LUPES TOUR: http://${host}:${port}`);
  console.log(configured ? `Foundry configurado: ${foundryConfiguration.mode} / ${foundryConfiguration.target}. A conexão será validada na primeira mensagem.` : `${foundryConfiguration.setupRequired ? 'Configuração incompleta' : 'Modo demonstração'}. Falta configurar: ${foundryConfiguration.missing.join('; ')}.`);
});
