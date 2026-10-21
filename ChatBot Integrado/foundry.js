const setting = name => (process.env[name] || '').trim();
const projectEndpoint = setting('FOUNDRY_PROJECT_ENDPOINT');
const modelEndpoint = setting('FOUNDRY_ENDPOINT');
const apiKey = setting('FOUNDRY_API_KEY');
const accessToken = setting('FOUNDRY_ACCESS_TOKEN');
const tenantId = setting('AZURE_TENANT_ID');
const clientId = setting('AZURE_CLIENT_ID');
const clientSecret = setting('AZURE_CLIENT_SECRET');
const mode = setting('FOUNDRY_MODE') || (projectEndpoint ? 'agent' : 'model');
const agentName = setting('FOUNDRY_AGENT_NAME') || 'LUPES-TOUR';
const agentVersion = setting('FOUNDRY_AGENT_VERSION') || '2';
const model = setting('FOUNDRY_MODEL') || 'gpt-5-mini';

if (!['agent', 'model'].includes(mode)) throw new Error('FOUNDRY_MODE deve ser agent ou model.');

const missing = [];
if (mode === 'agent') {
  if (!projectEndpoint) missing.push('FOUNDRY_PROJECT_ENDPOINT');
  if (!accessToken && !(tenantId && clientId && clientSecret)) missing.push('FOUNDRY_ACCESS_TOKEN ou AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET');
} else {
  if (!modelEndpoint) missing.push('FOUNDRY_ENDPOINT');
  if (!apiKey) missing.push('FOUNDRY_API_KEY');
}

export const foundryConfiguration = Object.freeze({
  configured: missing.length === 0,
  setupRequired: missing.length > 0 && Boolean(setting('FOUNDRY_MODE') || projectEndpoint || modelEndpoint || apiKey || accessToken || tenantId || clientId || clientSecret),
  mode,
  target: mode === 'agent' ? `${agentName}:${agentVersion}` : model,
  missing
});

function endpointUrl(value, variable) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${variable} deve conter uma URL válida.`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(`${variable} deve ser HTTPS, sem credenciais, consulta ou fragmento.`);
  }
  return url;
}

let requestUrl;
if (mode === 'agent' && projectEndpoint) {
  requestUrl = endpointUrl(projectEndpoint, 'FOUNDRY_PROJECT_ENDPOINT');
  const base = requestUrl.pathname.replace(/\/+$/, '');
  if (!/^\/api\/projects\/[^/]+$/.test(base)) throw new Error('FOUNDRY_PROJECT_ENDPOINT deve terminar em /api/projects/NOME-DO-PROJETO. Copie o endpoint do projeto no Foundry.');
  requestUrl.pathname = `${base}/openai/v1/responses`;
} else if (mode === 'model' && modelEndpoint) {
  requestUrl = endpointUrl(modelEndpoint, 'FOUNDRY_ENDPOINT');
  const base = requestUrl.pathname.replace(/\/+$/, '');
  if (!base || base === '/openai/v1') requestUrl.pathname = '/openai/v1/chat/completions';
  else if (base !== '/openai/v1/chat/completions') throw new Error('FOUNDRY_ENDPOINT deve ser o endpoint raiz ou /openai/v1/ do modelo. Para agentes, use FOUNDRY_PROJECT_ENDPOINT e FOUNDRY_MODE=agent.');
}

if (mode === 'agent' && !accessToken && tenantId && !/^[a-zA-Z0-9.-]+$/.test(tenantId)) throw new Error('AZURE_TENANT_ID inválido. Use o identificador do diretório Microsoft Entra.');

function connectionError(message, status = 502) {
  const error = new Error(message);
  error.status = status;
  return error;
}

let cachedToken = null;

async function getAccessToken(signal) {
  if (accessToken) return accessToken;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'https://ai.azure.com/.default', grant_type: 'client_credentials' }),
    signal
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw connectionError('Não foi possível autenticar no Microsoft Entra. Confira AZURE_TENANT_ID, AZURE_CLIENT_ID e AZURE_CLIENT_SECRET.');
  }
  const token = await response.json();
  const lifetime = Number(token.expires_in);
  if (typeof token.access_token !== 'string' || !token.access_token || !Number.isFinite(lifetime) || lifetime <= 0) throw connectionError('O Microsoft Entra não retornou um token válido.');
  cachedToken = { value: token.access_token, expiresAt: Date.now() + lifetime * 1000 };
  return cachedToken.value;
}

function responseText(result) {
  if (mode === 'model') {
    const choice = result.choices?.[0];
    if (choice?.finish_reason === 'length') throw connectionError('O modelo atingiu o limite de saída. Tente uma pergunta mais curta.');
    const text = choice?.message?.content || choice?.message?.refusal;
    return typeof text === 'string' ? text.trim() : '';
  }
  if (result.status === 'failed' || result.error) throw connectionError('O agente não conseguiu concluir a resposta. Confira a configuração e as ferramentas no Foundry.');
  if (result.status === 'incomplete') throw connectionError('A resposta do agente ficou incompleta. Tente uma pergunta mais curta e confira os limites no Foundry.');
  if (Array.isArray(result.output) && result.output.some(item => ['function_call', 'mcp_approval_request'].includes(item.type))) {
    throw connectionError('O agente solicitou uma função externa ou aprovação de ferramenta. Este chat não executa funções locais nem aprova ferramentas; configure o agente no Foundry para este canal.');
  }
  if (!Array.isArray(result.output)) return '';
  return result.output
    .filter(item => item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content))
    .flatMap(item => item.content)
    .map(part => part.type === 'output_text' ? part.text : part.type === 'refusal' ? part.refusal : '')
    .filter(text => typeof text === 'string' && text.trim())
    .join('\n\n').trim();
}

export async function requestFoundry(messages, systemPrompt, signal) {
  if (!foundryConfiguration.configured) throw connectionError('Complete a configuração do Foundry no .env e reinicie o servidor.', 503);
  const history = messages.map(message => ({ role: message.role, content: message.content }));
  const headers = { 'Content-Type': 'application/json' };
  let payload;
  if (mode === 'agent') {
    headers.Authorization = `Bearer ${await getAccessToken(signal)}`;
    payload = {
      agent_reference: { type: 'agent_reference', name: agentName, version: agentVersion },
      input: history,
      max_output_tokens: 4096,
      stream: false
    };
  } else {
    headers['api-key'] = apiKey;
    payload = { model, messages: [{ role: 'system', content: systemPrompt }, ...history], max_completion_tokens: 4096, stream: false };
  }
  const upstream = await fetch(requestUrl, { method: 'POST', headers, body: JSON.stringify(payload), signal });
  if (!upstream.ok) {
    await upstream.body?.cancel();
    if (upstream.status === 401) cachedToken = null;
    const explanations = {
      400: mode === 'agent' ? 'O Foundry recusou a execução. Confira a versão do agente, o formato do endpoint e as ferramentas configuradas.' : 'O Foundry recusou a solicitação. Confira a implantação do modelo e os filtros de conteúdo.',
      401: mode === 'agent' ? 'Token Entra inválido ou expirado. Renove FOUNDRY_ACCESS_TOKEN ou confira a identidade configurada no servidor.' : 'A chave do Foundry é inválida. Atualize FOUNDRY_API_KEY no .env e reinicie o servidor.',
      403: 'O Foundry negou o acesso. Confira as permissões da identidade no projeto, as políticas e as restrições de rede.',
      404: mode === 'agent' ? `Projeto ou agente não encontrado. Confira o endpoint do projeto e se ${agentName}, versão ${agentVersion}, existe nele.` : 'Implantação não encontrada. Confira FOUNDRY_ENDPOINT e FOUNDRY_MODEL.',
      429: 'O limite de uso do Foundry foi atingido. Aguarde e tente novamente.'
    };
    throw connectionError(explanations[upstream.status] || 'O Microsoft Foundry está indisponível no momento. Tente novamente.', upstream.status === 429 ? 429 : 502);
  }
  const reply = responseText(await upstream.json());
  if (!reply) throw connectionError('O Foundry não retornou texto. Reformule a pergunta ou confira a execução e os filtros de conteúdo no portal.');
  return reply;
}
