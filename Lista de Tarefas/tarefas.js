'use strict';

const STORAGE_KEY = 'senai_proximo_passo_v1';
const $ = id => document.getElementById(id);
const initialLists = [
  { id: 'geral', name: 'Tarefas gerais' },
  { id: 'aulas', name: 'Aulas e estudos' },
  { id: 'projetos', name: 'Projetos e entregas' }
];
const viewInfo = {
  day: ['Meu dia', 'Escolha suas prioridades e dê o próximo passo.'],
  important: ['Importantes', 'Um lugar para o que merece a sua atenção.'],
  planned: ['Planejadas', 'Seus prazos à vista. Mais tempo para se preparar.'],
  all: ['Todas as tarefas', 'Uma visão completa dos seus próximos passos.'],
  done: ['Concluídas', 'Olhe para tudo o que você já fez acontecer.']
};
let storageReadOnly = false;
let state = loadState();
let currentView = 'day';
let lastDeleted = null;
let editingId = null;
let editingListId = null;
let draftSteps = [];
let lastDay = today();

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function uid() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function validDate(value) {
  if (value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8));
}

function validId(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value); }
function validText(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function normalized(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR'); }

function storageWarning(message) {
  $('storage-warning').hidden = false;
  $('storage-warning').textContent = message;
  $('storage-label').textContent = 'Alterações disponíveis somente nesta sessão';
}

function loadState() {
  const empty = () => ({ version: 1, lists: initialLists.map(list => ({ ...list })), tasks: [] });
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return empty();
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.lists) || !data.lists.length || !Array.isArray(data.tasks)) throw new Error('Formato incompatível');
    const ids = new Set();
    for (const list of data.lists) {
      if (!list || !validId(list.id) || !validText(list.name, 45) || ids.has(list.id)) throw new Error('Lista inválida');
      ids.add(list.id);
    }
    const taskIds = new Set();
    for (const task of data.tasks) {
      if (!task || !validId(task.id) || taskIds.has(task.id) || !validText(task.text, 300) ||
          !ids.has(task.listId) || typeof task.completed !== 'boolean' || typeof task.important !== 'boolean' ||
          !validDate(task.due) || !validDate(task.myDay) || typeof task.notes !== 'string' || task.notes.length > 5000 ||
          !Number.isFinite(task.createdAt) || task.createdAt < 0 || !Array.isArray(task.steps)) throw new Error('Tarefa inválida');
      taskIds.add(task.id);
      const stepIds = new Set();
      for (const step of task.steps) {
        if (!step || !validId(step.id) || stepIds.has(step.id) || !validText(step.text, 200) || typeof step.completed !== 'boolean') throw new Error('Etapa inválida');
        stepIds.add(step.id);
      }
    }
    return { version: 1, lists: data.lists.map(({ id, name }) => ({ id, name })), tasks: data.tasks.map(task => ({
      id: task.id, text: task.text, listId: task.listId, completed: task.completed, important: task.important,
      due: task.due, myDay: task.myDay, notes: task.notes, createdAt: task.createdAt,
      steps: task.steps.map(({ id, text, completed }) => ({ id, text, completed }))
    })) };
  } catch (error) {
    storageReadOnly = true;
    storageWarning('Não foi possível ler os dados salvos. Os dados anteriores não serão sobrescritos. Você pode usar o app nesta sessão e exportar suas novas tarefas.');
    return empty();
  }
}

function persist() {
  if (storageReadOnly) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('storage-warning').hidden = true;
    $('storage-label').textContent = 'Salvo automaticamente neste navegador';
    return true;
  } catch (error) {
    storageWarning('O navegador não permitiu salvar as alterações. Continue nesta sessão e use Exportar tarefas antes de fechar a página.');
    return false;
  }
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function matchesView(task, view = currentView) {
  switch (view) {
    case 'day': return task.myDay === today();
    case 'important': return task.important;
    case 'planned': return Boolean(task.due);
    case 'done': return task.completed;
    case 'all': return true;
    default: return task.listId === view.slice(5);
  }
}

function visibleTasks() {
  const query = normalized($('task-search').value.trim());
  const tasks = state.tasks.filter(task => matchesView(task) && normalized(`${task.text} ${task.notes}`).includes(query));
  const sort = $('task-sort').value;
  return tasks.sort((a, b) => {
    if (sort === 'due') return (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99') || b.createdAt - a.createdAt;
    if (sort === 'important') return Number(b.important) - Number(a.important) || b.createdAt - a.createdAt;
    if (sort === 'title') return a.text.localeCompare(b.text, 'pt-BR');
    return b.createdAt - a.createdAt;
  });
}

function setView(view) {
  if (!Object.hasOwn(viewInfo, view) && !state.lists.some(list => `list:${list.id}` === view)) return;
  currentView = view;
  $('task-search').value = '';
  $('add-important').setAttribute('aria-pressed', String(view === 'important'));
  if (view.startsWith('list:')) $('task-list-select').value = view.slice(5);
  if (view === 'planned' && !$('task-due').value) $('task-due').value = today();
  render();
}

function listOptions(select, preferred = select.value) {
  select.replaceChildren(...state.lists.map(list => {
    const option = element('option', '', list.name); option.value = list.id; return option;
  }));
  select.value = state.lists.some(list => list.id === preferred) ? preferred : state.lists[0].id;
}

function renderNavigation() {
  document.querySelectorAll('#smart-nav [data-view]').forEach(button => {
    const active = button.dataset.view === currentView;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    const count = state.tasks.filter(task => matchesView(task, button.dataset.view) && (button.dataset.view === 'done' || !task.completed)).length;
    button.querySelector('.nav-count').textContent = String(count);
  });
  $('custom-lists').replaceChildren(...state.lists.map((list, index) => {
    const button = element('button', 'nav-item');
    button.type = 'button'; button.dataset.view = `list:${list.id}`;
    if (button.dataset.view === currentView) { button.classList.add('active'); button.setAttribute('aria-current', 'page'); }
    const dot = element('span', 'list-dot');
    dot.style.backgroundColor = ['#dbb873', '#91bba9', '#b5a5d9', '#d8a8b6'][index % 4]; dot.setAttribute('aria-hidden', 'true');
    const count = state.tasks.filter(task => task.listId === list.id && !task.completed).length;
    button.append(dot, element('span', '', list.name), element('span', 'nav-count', String(count)));
    button.addEventListener('click', () => setView(`list:${list.id}`));
    return button;
  }));
}

function actionButton(task, action, symbol, label, pressed) {
  const button = element('button', `icon-button ${action}-task`);
  button.type = 'button'; button.dataset.taskId = task.id; button.dataset.action = action;
  button.setAttribute('aria-label', `${label}: ${task.text}`); button.title = label;
  if (pressed !== undefined) button.setAttribute('aria-pressed', String(pressed));
  button.append(icon(symbol));
  return button;
}

function taskRow(task) {
  const row = element('li', `task-row${task.completed ? ' completed' : ''}`); row.dataset.id = task.id;
  const label = element('label', 'task-checkbox-label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox'; checkbox.checked = task.completed; checkbox.dataset.taskId = task.id; checkbox.dataset.action = 'complete';
  label.append(checkbox, element('span', 'sr-only', `Concluir: ${task.text}`));
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    if (task.completed) $('completed-section').open = true;
    commit(`${task.completed ? 'Concluída' : 'Reaberta'}: ${shortTitle(task.text)}`, { taskId: task.id, action: 'complete' });
  });
  const content = element('div', 'task-content');
  const title = element('button', 'task-title-button', task.text);
  title.type = 'button'; title.dataset.taskId = task.id; title.dataset.action = 'edit'; title.setAttribute('aria-label', `Editar: ${task.text}`);
  title.addEventListener('click', () => openEditor(task.id));
  const meta = element('div', 'task-meta');
  meta.append(element('span', '', state.lists.find(list => list.id === task.listId)?.name || 'Tarefas gerais'));
  if (task.due) {
    const late = !task.completed && task.due < today();
    const due = element('span', late ? 'overdue' : task.due === today() ? 'due-today' : '');
    const formatted = new Date(`${task.due}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', ...(task.due.slice(0, 4) !== today().slice(0, 4) ? { year: 'numeric' } : {}) });
    due.append(icon('calendar'), document.createTextNode(`${late ? 'Em atraso · ' : 'Entrega · '}${task.due === today() ? 'Hoje' : formatted}`)); meta.append(due);
  }
  if (task.steps.length) meta.append(element('span', '', `${task.steps.filter(step => step.completed).length}/${task.steps.length} etapas`));
  if (task.notes) meta.append(element('span', '', 'Com anotações'));
  content.append(title, meta);
  const actions = element('div', 'task-actions');
  const day = actionButton(task, 'day', 'sun', task.myDay === today() ? 'Remover de Meu dia' : 'Adicionar ao Meu dia', task.myDay === today());
  day.classList.toggle('is-day', task.myDay === today());
  day.addEventListener('click', () => { task.myDay = task.myDay === today() ? '' : today(); commit(task.myDay ? 'Tarefa adicionada ao Meu dia.' : 'Tarefa removida de Meu dia. Ela continua em Todas as tarefas.', { taskId: task.id, action: 'day' }); });
  const star = actionButton(task, 'important', 'star', task.important ? 'Remover importância' : 'Marcar como importante', task.important);
  star.classList.toggle('is-important', task.important);
  star.addEventListener('click', () => { task.important = !task.important; commit(task.important ? 'Tarefa marcada como importante.' : 'Importância removida.', { taskId: task.id, action: 'important' }); });
  const remove = actionButton(task, 'delete', 'trash', 'Excluir');
  remove.addEventListener('click', () => deleteTask(task.id));
  actions.append(day, star, remove); row.append(label, content, actions);
  return row;
}

function focusSnapshot() {
  const active = document.activeElement;
  if (active.dataset.taskId) return { taskId: active.dataset.taskId, action: active.dataset.action };
  if (active.dataset.view) return { view: active.dataset.view };
  return null;
}

function restoreFocus(snapshot) {
  if (!snapshot) return;
  let target;
  if (snapshot.taskId) target = [...document.querySelectorAll('[data-task-id]')].find(node => node.dataset.taskId === snapshot.taskId && node.dataset.action === snapshot.action);
  if (snapshot.view) target = [...document.querySelectorAll('[data-view]')].find(node => node.dataset.view === snapshot.view);
  if (target?.closest('details')) target.closest('details').open = true;
  (target || $('task-input')).focus({ preventScroll: true });
}

function render(focus = focusSnapshot()) {
  renderNavigation();
  const list = state.lists.find(item => `list:${item.id}` === currentView);
  const [title, description] = viewInfo[currentView] || [list?.name || 'Tarefas', 'Um espaço para organizar esta parte da sua jornada.'];
  $('view-title').textContent = title; $('view-description').textContent = description; $('rename-list-btn').hidden = !list;
  const selected = visibleTasks();
  const pending = selected.filter(task => !task.completed);
  const done = selected.filter(task => task.completed);
  $('task-list').replaceChildren(...(currentView === 'done' ? done : pending).map(taskRow));
  $('task-list').setAttribute('aria-label', currentView === 'done' ? 'Tarefas concluídas' : 'Tarefas pendentes');
  $('completed-list').replaceChildren(...(currentView === 'done' ? [] : done).map(taskRow));
  $('completed-section').hidden = currentView === 'done' || !done.length;
  $('completed-summary').textContent = `Concluídas (${done.length})`;
  $('counter').textContent = currentView === 'done' ? `${done.length} tarefa(s) concluída(s) nesta visão` : `${pending.length} tarefa(s) pendente(s) nesta visão`;
  const empty = currentView === 'done' ? !done.length : !pending.length;
  $('empty-state').hidden = !empty;
  const searching = Boolean($('task-search').value.trim());
  $('empty-title').textContent = searching ? 'Nenhuma tarefa encontrada.' : currentView === 'done' ? 'Suas conquistas vão aparecer aqui.' : done.length ? 'Um passo a menos. Uma conquista a mais.' : currentView === 'day' ? 'Seu dia começa com um passo.' : 'Espaço livre para o próximo passo.';
  $('empty-description').textContent = searching ? 'Experimente outra palavra ou consulte Todas as tarefas.' : currentView === 'done' ? 'Marque uma tarefa como concluída para acompanhar seu progresso.' : done.length ? 'Você concluiu todas as tarefas desta visão. Continue no seu ritmo.' : currentView === 'day' ? 'Adicione uma tarefa acima ou use o ícone de sol para trazer uma tarefa existente para Meu dia.' : 'Adicione uma tarefa ou organize as existentes usando os detalhes de cada uma.';
  const dayTasks = state.tasks.filter(task => task.myDay === today());
  const doneToday = dayTasks.filter(task => task.completed).length;
  const progress = dayTasks.length ? Math.round(doneToday / dayTasks.length * 100) : 0;
  $('today-pending').textContent = String(dayTasks.length - doneToday);
  $('overdue-count').textContent = String(state.tasks.filter(task => !task.completed && task.due && task.due < today()).length);
  $('progress-label').textContent = `${progress}%`;
  $('day-progress').style.setProperty('--progress', `${progress}%`);
  $('day-progress').setAttribute('aria-valuenow', String(progress));
  $('day-progress').setAttribute('aria-valuetext', `${doneToday} de ${dayTasks.length} tarefas do dia concluídas`);
  $('today-label').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  restoreFocus(focus);
}

function shortTitle(text) { return text.length > 75 ? `${text.slice(0, 75)}…` : text; }

function notify(message, undo = false) {
  if (!undo) lastDeleted = null;
  $('toast').hidden = false;
  $('status-message').textContent = message;
  $('undo-btn').hidden = !undo;
}

function commit(message, focus) { persist(); render(focus); notify(message); }

function deleteTask(id) {
  const index = state.tasks.findIndex(task => task.id === id);
  if (index < 0) return;
  const ordered = visibleTasks().filter(task => task.completed === state.tasks[index].completed);
  const visualIndex = ordered.findIndex(task => task.id === id);
  const next = ordered[visualIndex + 1] || ordered[visualIndex - 1];
  const [task] = state.tasks.splice(index, 1);
  lastDeleted = { task, index };
  persist(); render(next ? { taskId: next.id, action: 'delete' } : { taskId: '', action: '' });
  notify(`Excluída: ${shortTitle(task.text)}`, true);
}

function validateTitle(input) {
  input.setCustomValidity(input.value.trim() ? '' : 'Escreva um título; espaços sozinhos não formam uma tarefa.');
  return input.reportValidity();
}

$('task-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!validateTitle($('task-input'))) return;
  const text = $('task-input').value.trim();
  if (text.length > 300 || !validDate($('task-due').value)) return;
  const task = { id: uid(), text, completed: false, listId: $('task-list-select').value,
    important: $('add-important').getAttribute('aria-pressed') === 'true', due: $('task-due').value,
    myDay: currentView === 'day' ? today() : '', notes: '', steps: [], createdAt: Date.now() };
  state.tasks.push(task);
  $('task-input').value = ''; $('task-due').value = '';
  $('add-important').setAttribute('aria-pressed', String(currentView === 'important'));
  if (currentView === 'planned') $('task-due').value = today();
  if (!matchesView(task)) currentView = 'all';
  $('task-search').value = '';
  commit('Tarefa adicionada. Mais um passo no seu planejamento.');
  $('task-input').focus();
});

function openEditor(id) {
  const task = state.tasks.find(item => item.id === id); if (!task) return;
  editingId = id; draftSteps = task.steps.map(step => ({ ...step }));
  $('edit-title').value = task.text; $('edit-title').setCustomValidity('');
  $('edit-due').value = task.due; $('edit-notes').value = task.notes;
  $('edit-important').checked = task.important; $('edit-day').checked = task.myDay === today();
  $('step-input').value = ''; $('step-input').setCustomValidity(''); listOptions($('edit-list'), task.listId);
  renderSteps(); $('task-dialog').showModal(); $('edit-title').focus();
}

function renderSteps() {
  $('edit-steps').replaceChildren(...draftSteps.map(step => {
    const li = element('li', 'step-row'); const label = document.createElement('label');
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = step.completed;
    checkbox.addEventListener('change', () => { step.completed = checkbox.checked; });
    label.append(checkbox, element('span', '', step.text));
    const remove = element('button', 'icon-button'); remove.type = 'button'; remove.setAttribute('aria-label', `Excluir etapa: ${step.text}`); remove.append(icon('close'));
    remove.addEventListener('click', () => { draftSteps = draftSteps.filter(item => item.id !== step.id); renderSteps(); $('step-input').focus(); });
    li.append(label, remove); return li;
  }));
}

function addStep() {
  const input = $('step-input'); if (!input.value.trim()) return;
  draftSteps.push({ id: uid(), text: input.value.trim().slice(0, 200), completed: false });
  input.value = ''; renderSteps(); input.focus();
}

$('edit-form').addEventListener('submit', event => {
  event.preventDefault(); if (!validateTitle($('edit-title'))) return;
  const task = state.tasks.find(item => item.id === editingId); if (!task) return;
  if (!validDate($('edit-due').value)) return;
  if ($('step-input').value.trim()) addStep();
  Object.assign(task, { text: $('edit-title').value.trim(), listId: $('edit-list').value,
    due: $('edit-due').value, notes: $('edit-notes').value, important: $('edit-important').checked,
    myDay: $('edit-day').checked ? today() : '', steps: draftSteps.map(step => ({ ...step })) });
  $('task-dialog').close();
  commit('Alterações salvas.', { taskId: task.id, action: 'edit' });
});

function openListDialog(rename = false) {
  editingListId = rename ? currentView.slice(5) : null;
  const list = state.lists.find(item => item.id === editingListId);
  $('list-dialog-heading').textContent = list ? 'Um novo nome para sua lista.' : 'Uma lista, um novo foco.';
  $('save-list-btn').textContent = list ? 'Salvar nome' : 'Criar lista';
  $('list-name').value = list?.name || ''; $('list-name').setCustomValidity('');
  $('list-dialog').showModal(); $('list-name').focus();
}

$('list-form').addEventListener('submit', event => {
  event.preventDefault(); const input = $('list-name'); const name = input.value.trim();
  const duplicate = state.lists.some(list => list.id !== editingListId && normalized(list.name) === normalized(name));
  input.setCustomValidity(!name ? 'Informe o nome da lista.' : duplicate ? 'Já existe uma lista com esse nome.' : '');
  if (!input.reportValidity()) return;
  if (editingListId) state.lists.find(list => list.id === editingListId).name = name;
  else { const id = uid(); state.lists.push({ id, name }); currentView = `list:${id}`; }
  listOptions($('task-list-select'), currentView.startsWith('list:') ? currentView.slice(5) : undefined);
  $('task-search').value = ''; $('list-dialog').close(); commit('Lista salva.'); $('task-input').focus();
});

$('undo-btn').addEventListener('click', () => {
  if (!lastDeleted) return;
  const { task, index } = lastDeleted; lastDeleted = null;
  if (!state.tasks.some(item => item.id === task.id)) state.tasks.splice(Math.min(index, state.tasks.length), 0, task);
  commit('Exclusão desfeita. Sua tarefa está de volta.', { taskId: task.id, action: 'edit' });
});
$('dismiss-toast').addEventListener('click', () => { $('toast').hidden = true; lastDeleted = null; $('task-input').focus({ preventScroll: true }); });
document.querySelectorAll('#smart-nav [data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('task-search').addEventListener('input', () => render());
$('task-sort').addEventListener('change', () => render());
$('add-important').addEventListener('click', () => $('add-important').setAttribute('aria-pressed', String($('add-important').getAttribute('aria-pressed') !== 'true')));
$('focus-add-btn').addEventListener('click', () => { $('task-input').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); $('task-input').focus({ preventScroll: true }); });
$('new-list-btn').addEventListener('click', () => openListDialog());
$('rename-list-btn').addEventListener('click', () => openListDialog(true));
$('add-step-btn').addEventListener('click', addStep);
$('step-input').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); addStep(); } });
['task-input', 'edit-title', 'list-name'].forEach(id => $(id).addEventListener('input', () => $(id).setCustomValidity('')));
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('export-btn').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `proximo-passo-${today()}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Arquivo de tarefas preparado para download.');
});

// O planejamento de Meu dia é diário; tarefas anteriores continuam em Todas as tarefas.
function refreshDay() { if (lastDay !== today()) { lastDay = today(); render(); } }
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });
setInterval(refreshDay, 60000);
listOptions($('task-list-select'));
render();
