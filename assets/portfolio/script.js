/* Progressive enhancement: project links remain available without JavaScript. */
(() => {
  'use strict';
  const search = document.getElementById('project-search');
  const cards = [...document.querySelectorAll('.project-card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const status = document.getElementById('filter-status');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const catalog = cards.map(card => ({ card, category: card.dataset.category,
    text: normalize(`${card.dataset.keywords} ${card.querySelector('h3').textContent} ${card.querySelector('.card-content > p').textContent} ${card.querySelector('.tags').textContent}`) }));
  let category = 'all';

  function filterProjects() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const project of catalog) {
      const visible = (category === 'all' || category === project.category) && terms.every(term => project.text.includes(term));
      project.card.hidden = !visible;
      if (visible) count++;
    }
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    document.getElementById('empty-state').hidden = count > 0;
    document.getElementById('project-grid').classList.toggle('filtered', category !== 'all' || terms.length > 0);
    status.textContent = `${count} ${count === 1 ? 'projeto encontrado' : 'projetos encontrados'}.`;
  }

  for (const button of filters) button.addEventListener('click', () => { category = button.dataset.filter; filterProjects(); });
  search.addEventListener('input', filterProjects);
  document.getElementById('reset-filters').addEventListener('click', () => {
    search.value = '';
    category = 'all';
    filterProjects();
    search.focus();
  });
  document.getElementById('project-tools').hidden = false;
})();
