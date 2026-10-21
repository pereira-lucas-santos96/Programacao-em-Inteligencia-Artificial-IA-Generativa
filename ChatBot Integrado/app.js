const icons = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1L20 8a3 3 0 0 0-4-4L5 15Z"/>',
  clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m8 13 2 2 5-5M8 18h7"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
  'arrow-up-right': '<path d="M6 18 18 6M7 6h11v11"/>',
  'arrow-down': '<path d="M12 4v16m-5-5 5 5 5-5"/>',
  'arrow-up': '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  'map-pin': '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  plane: '<path d="m21 3-6 18-4-8-8-4ZM11 13 21 3"/>',
  document: '<path d="M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h6"/>',
  car: '<path d="m5 7 2-4h10l2 4 2 3v8H3v-8ZM3 10h18M5 18v3m14-3v3M6 14h2m8 0h2"/>',
  medical: '<path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="4"/><path d="M8 10h8m-4-4a8 8 0 0 1 0 8 8 8 0 0 1 0-8M9 18h6"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 4 12 4 12 0V6M3 11v5c0 4 12 4 12 0v-5M16 9c6 0 7 5 2 6m3-3v5c0 2-2 3-5 3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>'
};

const topics = [
  { title: 'Previsão do Tempo', icon: 'sun', tone: 'sun', description: 'Acompanhe a previsão do tempo para o destino da sua viagem e aproveite.', prompt: 'Quero saber sobre a previsão do tempo para a minha viagem.', demo: 'Qual é o destino e em quais datas você pretende viajar?\n\nNesta demonstração não consulto previsões em tempo real. Posso ajudar a organizar as informações que você precisa conferir antes de arrumar a mala.' },
  { title: 'Aeroportos', icon: 'plane', tone: 'sky', description: 'Consulte as informações dos voos realizados nos aeroportos do Brasil.', prompt: 'Preciso de informações sobre voos nos aeroportos do Brasil.', demo: 'Qual aeroporto ou número do voo você quer consultar? Informe também a data.\n\nNão tenho acesso ao status dos voos nesta demonstração. Confirme horários, terminal e portão com a companhia aérea ou o aeroporto.' },
  { title: 'Documentação', icon: 'document', tone: 'sage', description: 'Saiba quais os documentos necessários para realizar a sua viagem.', prompt: 'Quais documentos preciso para realizar minha viagem?', demo: 'Vamos organizar essa parte! Qual é seu destino, sua nacionalidade e a data da viagem? Há menores de idade no grupo ou conexões em outros países?\n\nEsses detalhes ajudam a montar uma lista para verificar com as autoridades oficiais. Não compartilhe números ou fotos de documentos aqui.' },
  { title: 'Traslado', icon: 'car', tone: 'peach', description: 'As melhores opções para chegar aos aeroportos.', prompt: 'Quais opções de traslado posso comparar para chegar ao aeroporto?', demo: 'De onde você vai sair e para qual aeroporto? Quantas pessoas vão viajar e quanta bagagem vão levar?\n\nPodemos organizar uma comparação entre transporte público, táxi, aplicativo e traslado contratado. Preços e disponibilidade precisam ser consultados com os operadores.' },
  { title: 'Vacinação', icon: 'medical', tone: 'rose', description: 'Saiba quais as principais vacinas você deve tomar para viajar tranquilo.', prompt: 'Como verifico as vacinas e os comprovantes para minha viagem?', demo: 'Qual país você visitará, quais serão as conexões e quando pretende embarcar?\n\nNão posso definir quais vacinas você deve tomar. Procure um profissional de saúde e consulte os requisitos atuais nas autoridades sanitárias do destino. Esta demonstração não verifica exigências sanitárias.' },
  { title: 'Horários', icon: 'clock', tone: 'lilac', description: 'Consulte os horários em todas as cidades do mundo.', prompt: 'Quero comparar os horários de cidades para planejar minha viagem.', demo: 'Quais cidades você quer comparar e em qual data?\n\nInforme também o horário de partida, se quiser organizar uma conexão. Esta demonstração não consulta relógios mundiais nem confirma fusos em tempo real.' },
  { title: 'Vistos', icon: 'passport', tone: 'teal', description: 'Informações para você que vai realizar uma viagem internacional.', prompt: 'Como verifico se preciso de visto para uma viagem internacional?', demo: 'Qual é sua nacionalidade, seu destino e o motivo da viagem? Quanto tempo pretende ficar e por quais países fará conexão?\n\nA necessidade de visto depende desses detalhes. Confirme a regra vigente com o consulado ou órgão oficial de imigração; esta demonstração não verifica regras atuais.' },
  { title: 'Moedas', icon: 'coins', tone: 'sand', description: 'Para viajar com segurança e praticidade consulte a moeda utilizada no local da sua viagem.', prompt: 'Quero saber sobre a moeda utilizada no destino da minha viagem.', demo: 'Para qual país você vai viajar? Você quer organizar gastos, comparar formas de pagamento ou consultar a moeda local?\n\nEsta demonstração não consulta cotações. Antes de converter valores, verifique a taxa, as tarifas e a data da cotação com a instituição escolhida.' }
];

const input = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesElement = document.getElementById('messages');
const dialog = document.getElementById('info-dialog');
const dialogContent = document.getElementById('dialog-content');
let history = [];
let activeRequest = null;
let conversationId = null;
let configured = false;
let connectionState = 'demo';
let connectionDetails = null;
let toastTimer;

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.compass}</svg>`;
}

function renderIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function toast(message) {
  const notification = document.getElementById('toast');
  clearTimeout(toastTimer);
  notification.textContent = message;
  notification.hidden = false;
  toastTimer = setTimeout(() => { notification.hidden = true; }, 4000);
}

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { toast('Não foi possível salvar neste navegador. Verifique o espaço e as permissões.'); return false; }
}

function savedConversations() {
  const saved = readStorage('lupes-conversations', []);
  return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.messages) && item.messages.length > 0 && item.messages.length <= 200 && item.messages.every(message => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.length <= 20000)) : [];
}

topics.forEach(topic => {
  const card = element('button', 'topic-card');
  card.type = 'button';
  const symbol = element('span', `topic-icon tone-${topic.tone}`);
  symbol.innerHTML = icon(topic.icon);
  card.append(symbol, element('h3', '', topic.title), element('p', '', topic.description));
  card.addEventListener('click', () => sendMessage(topic.prompt));
  document.getElementById('topics-grid').append(card);
});

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 145)}px`;
  sendButton.disabled = !activeRequest && !input.value.trim();
}

function setBusy(busy) {
  sendButton.innerHTML = icon(busy ? 'stop' : 'arrow-up');
  sendButton.classList.toggle('is-loading', busy);
  sendButton.setAttribute('aria-label', busy ? 'Interromper resposta' : 'Enviar mensagem');
  document.getElementById('save-chat').disabled = busy;
  resizeInput();
}

function showChat() {
  document.getElementById('welcome-view').hidden = true;
  document.getElementById('chat-view').hidden = false;
  document.getElementById('demo-notice').hidden = configured;
}

function appendMessage(role, content, extraClass = '') {
  const article = element('article', `message ${role} ${extraClass}`);
  const avatar = element('span', 'message-avatar');
  avatar.setAttribute('aria-hidden', 'true');
  if (role === 'user') avatar.textContent = 'V';
  else avatar.innerHTML = icon('compass');
  const body = element('div', 'message-body');
  body.append(element('p', 'message-name', role === 'user' ? 'Você' : 'Lupes · Seu assistente de viagem'), element('div', 'message-text', content));
  article.append(avatar, body);
  messagesElement.append(article);
  article.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
  return article;
}

function demoReply(question) {
  const exactTopic = topics.find(topic => topic.prompt === question);
  if (exactTopic) return exactTopic.demo;
  const normalized = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const keywords = [/tempo|clima|chuva/, /aeroporto|voo|voos/, /document/, /traslado|transporte/, /vacin|saude/, /horario|fuso/, /visto|visa/, /moeda|cambio|dinheiro/];
  const topicIndex = keywords.findIndex(pattern => pattern.test(normalized));
  if (topicIndex !== -1) return topics[topicIndex].demo;
  if (history.length > 2) return 'Anotei os detalhes nesta conversa! No modo demonstração, uso respostas prontas e não consigo analisar seu roteiro de forma personalizada.\n\nVocê pode explorar os oito temas, montar seu checklist ou salvar esta conversa. Para continuar com respostas de IA, configure o Microsoft Foundry conforme o README.';
  return 'Vamos começar a sua próxima aventura! ✈\n\nMe conte três coisas:\n• Qual destino você tem em mente?\n• Quando pretende viajar e por quantos dias?\n• Vai viajar sozinho, a dois ou em grupo?\n\nVocê também pode perguntar sobre documentação, traslado, clima ou os outros temas. Estou em modo demonstração: estas respostas são ilustrativas, sem consultas em tempo real.';
}

async function sendMessage(question = input.value.trim(), retry = false) {
  if (activeRequest || !question || question.length > 4000) return;
  if (history.length >= 198) { toast('Esta conversa chegou ao limite. Salve e comece uma nova.'); return; }
  document.querySelectorAll('.message.error').forEach(node => node.remove());
  if (retry) history.pop();
  showChat();
  if (!retry) appendMessage('user', question);
  history.push({ role: 'user', content: question });
  input.value = '';
  const controller = new AbortController();
  activeRequest = controller;
  setBusy(true);
  const loading = appendMessage('assistant', 'Preparando sua próxima parada', 'typing');
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 125000);
  try {
    await connectionReady;
    if (controller.signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    document.getElementById('demo-notice').hidden = configured;
    let reply;
    if (!configured && connectionState === 'demo') {
      await new Promise(resolve => setTimeout(resolve, 650));
      reply = demoReply(question);
    } else {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-19) }), signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o servidor. Tente novamente.');
      if (typeof result.reply !== 'string' || !result.reply.trim()) throw new Error('O assistente retornou uma resposta vazia. Tente novamente.');
      reply = result.reply;
    }
    if (controller.signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    if (activeRequest !== controller) return;
    loading.remove();
    history.push({ role: 'assistant', content: reply });
    appendMessage('assistant', reply);
  } catch (error) {
    if (activeRequest !== controller) return;
    loading.remove();
    const message = error.name === 'AbortError'
      ? timedOut ? 'A resposta demorou mais que o esperado. Tente novamente.' : 'Resposta interrompida. Você pode tentar novamente ou enviar outra pergunta.'
      : error instanceof TypeError ? 'Não foi possível alcançar o servidor. Verifique sua conexão e tente novamente.' : error.message;
    const errorMessage = appendMessage('assistant', message, 'error');
    const retryButton = element('button', 'retry-button', 'Tentar novamente');
    retryButton.addEventListener('click', () => sendMessage(question, true));
    errorMessage.querySelector('.message-body').append(retryButton);
  } finally {
    clearTimeout(timeout);
    if (activeRequest === controller) { activeRequest = null; setBusy(false); input.focus({ preventScroll: true }); }
  }
}

function resetConversation() {
  activeRequest?.abort();
  activeRequest = null;
  history = [];
  conversationId = null;
  messagesElement.replaceChildren();
  document.getElementById('welcome-view').hidden = false;
  document.getElementById('chat-view').hidden = true;
  input.value = '';
  setBusy(false);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function openDialog(title) {
  document.getElementById('dialog-title').textContent = title;
  dialogContent.replaceChildren();
  if (!dialog.open) dialog.showModal();
}

function saveConversation() {
  if (!history.length || activeRequest) return;
  const saved = savedConversations();
  const id = conversationId || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const conversation = { id, title: history[0].content.slice(0, 90), updatedAt: new Date().toISOString(), messages: history.map(message => ({ ...message })) };
  const updated = [conversation, ...saved.filter(item => item.id !== id)].slice(0, 20);
  if (writeStorage('lupes-conversations', updated)) { conversationId = id; toast('Conversa salva apenas neste navegador.'); }
}

function showSaved() {
  openDialog('Suas conversas salvas');
  const saved = savedConversations();
  dialogContent.append(element('p', 'dialog-copy', 'Ficam somente neste navegador, sem sincronização. Evite salvar informações pessoais em dispositivos compartilhados. São mantidas as 20 conversas salvas mais recentes.'));
  if (!saved.length) { dialogContent.append(element('p', 'empty-state', 'Sua próxima história ainda vai começar.\nInicie uma conversa e toque em “Salvar conversa”.')); return; }
  saved.forEach(conversation => {
    const row = element('div', 'saved-item');
    const open = element('button', 'saved-open');
    const date = new Date(conversation.updatedAt);
    open.append(element('strong', '', conversation.title), element('small', '', Number.isNaN(date.getTime()) ? 'Conversa salva' : date.toLocaleString('pt-BR')));
    open.addEventListener('click', () => {
      if (history.length && !confirm('Abrir esta conversa? Alterações não salvas da conversa atual serão perdidas.')) return;
      resetConversation();
      history = conversation.messages.map(message => ({ role: message.role, content: message.content }));
      conversationId = conversation.id;
      showChat();
      history.forEach(message => appendMessage(message.role, message.content));
      dialog.close();
      input.focus();
    });
    const remove = element('button', 'icon-button');
    remove.innerHTML = icon('x');
    remove.setAttribute('aria-label', `Excluir conversa: ${conversation.title}`);
    remove.addEventListener('click', () => {
      if (!confirm('Excluir esta conversa salva?')) return;
      if (writeStorage('lupes-conversations', savedConversations().filter(item => item.id !== conversation.id))) showSaved();
    });
    row.append(open, remove);
    dialogContent.append(row);
  });
}

function showChecklist() {
  openDialog('Tudo pronto para embarcar?');
  dialogContent.append(element('p', 'dialog-copy', 'Um ponto de partida para se organizar. Adapte a lista ao seu destino e confirme os requisitos oficiais. O progresso fica neste navegador.'));
  const items = ['Definir destino, datas e orçamento', 'Verificar documentos, vistos e conexões', 'Consultar orientações de saúde para a viagem', 'Confirmar passagens e hospedagem', 'Planejar o traslado e os deslocamentos', 'Conferir clima, bagagem e itens pessoais', 'Organizar meios de pagamento e contatos úteis', 'Revisar reservas e horários antes de sair'];
  const stored = readStorage('lupes-checklist', []);
  const checked = new Set(Array.isArray(stored) ? stored.filter(value => Number.isInteger(value) && value >= 0 && value < items.length) : []);
  items.forEach((text, index) => {
    const label = element('label', 'checklist-item');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked.has(index);
    checkbox.addEventListener('change', () => {
      checkbox.checked ? checked.add(index) : checked.delete(index);
      writeStorage('lupes-checklist', [...checked]);
    });
    label.append(checkbox, element('span', '', text));
    dialogContent.append(label);
  });
}

function showConnection() {
  openDialog('Seu companheiro de viagem');
  const target = connectionDetails?.target || 'Microsoft Foundry';
  const status = configured ? `${connectionDetails?.mode === 'agent' ? 'Agente' : 'Modelo'} ${target} configurado. A conexão será validada ao enviar uma pergunta.` : connectionState === 'unavailable' ? 'Servidor indisponível. Reinicie o servidor local para continuar.' : connectionState === 'pending' ? 'A conexão com o Foundry está pendente de configuração. As respostas de demonstração estão desativadas para não confundir com uma conexão real.' : 'Você está no modo demonstração, com respostas locais ilustrativas.';
  dialogContent.append(element('p', 'dialog-copy', status));
  if (Array.isArray(connectionDetails?.missing) && connectionDetails.missing.length) dialogContent.append(element('p', 'dialog-copy', `Falta configurar no .env: ${connectionDetails.missing.join('; ')}.`));
  dialogContent.append(element('p', 'dialog-copy', 'Escolha um dos oito temas ou escreva sua pergunta. Enter envia; Shift + Enter insere uma nova linha. Durante uma resposta, o botão de envio permite interromper a solicitação.'));
  dialogContent.append(element('p', 'dialog-copy', 'Para usar LUPES-TOUR, versão 2, configure FOUNDRY_MODE=agent, FOUNDRY_PROJECT_ENDPOINT e a autenticação Entra no .env. Para chamar somente gpt-5-mini, use FOUNDRY_MODE=model, FOUNDRY_ENDPOINT e FOUNDRY_API_KEY. Consulte o README. Nunca coloque chaves ou tokens no navegador.'));
  dialogContent.append(element('p', 'dialog-copy', 'Quando conectado, suas mensagens e parte do histórico são enviados ao serviço Microsoft configurado. Não envie senhas, dados bancários ou documentos. O modelo, sozinho, não consulta clima, voos, cotações ou regras em tempo real.'));
}

async function checkConnection() {
  if (location.protocol === 'file:') return;
  try {
    const response = await fetch('/api/config', { signal: AbortSignal.timeout(5000) });
    if (response.status === 404) return;
    if (!response.ok) throw new Error('Servidor indisponível');
    if (!response.headers.get('content-type')?.includes('application/json')) return;
    const configuration = await response.json();
    connectionDetails = configuration;
    configured = configuration.configured === true;
    connectionState = configured ? 'configured' : configuration.setupRequired ? 'pending' : 'demo';
    document.getElementById('connection-label').textContent = configured ? configuration.mode === 'agent' ? 'Agente configurado' : 'Modelo configurado' : configuration.setupRequired ? 'Configuração pendente' : 'Modo demonstração';
    if (configuration.setupRequired) document.getElementById('demo-notice').textContent = 'Configuração pendente: abra o indicador de conexão para consultar os campos faltantes. Nenhuma resposta de IA foi gerada.';
    document.getElementById('connection-button').classList.toggle('connected', configured);
    document.getElementById('demo-notice').hidden = configured;
  } catch {
    connectionState = 'unavailable';
    document.getElementById('connection-label').textContent = 'Servidor indisponível';
  }
}

input.addEventListener('input', resizeInput);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!activeRequest) sendMessage(); }
});
document.getElementById('chat-form').addEventListener('submit', event => { event.preventDefault(); if (activeRequest) activeRequest.abort(); else sendMessage(); });
document.getElementById('new-chat').addEventListener('click', () => {
  if (!history.length || confirm('Começar uma nova conversa? Salve a atual antes se quiser guardá-la.')) { resetConversation(); input.focus(); }
});
document.getElementById('nav-explore').addEventListener('click', () => {
  document.getElementById('welcome-view').hidden = false;
  document.getElementById('chat-view').hidden = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
});
document.getElementById('nav-checklist').addEventListener('click', showChecklist);
document.getElementById('nav-saved').addEventListener('click', showSaved);
document.getElementById('save-chat').addEventListener('click', saveConversation);
document.getElementById('connection-button').addEventListener('click', showConnection);
document.getElementById('help-button').addEventListener('click', showConnection);
document.getElementById('inspiration-button').addEventListener('click', () => sendMessage('Me ajude a planejar minha primeira viagem.'));
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
renderIcons();
const connectionReady = checkConnection();
