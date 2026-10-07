/* Livraria Bahubali — JavaScript puro. Valor representa o total do registro.
   Os prompts e as decisões de implementação estão documentados em PROMPTS.md. */
"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const number = new Intl.NumberFormat("pt-BR");
  const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });
  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const colors = ["#315d48", "#9bac82", "#ccad70", "#d6dccc", "#749e91", "#ae835e", "#859399", "#baaea0"];
  const storageKey = "bahubali.vendas.v1";
  const required = ["Data", "Loja", "Categoria", "Produto", "Quantidade", "Valor"];
  const charts = {};
  const chartTransitions = new WeakMap();
  let data = [], filtered = [], source = {}, months = [], categories = [], busy = false, toastTimer;
  let sorting = { key: "date", direction: -1 };
  const currency = (cents) => money.format(cents / 100);
  const shortMonth = (month) => `${monthNames[Number(month.slice(5)) - 1]}/${month.slice(2, 4)}`;
  const formatDate = (date) => date.split("-").reverse().join("/");
  const total = (rows, key) => rows.reduce((sum, row) => sum + row[key], 0);
  const unique = (rows, key) => [...new Set(rows.map((row) => row[key]))].sort(collator.compare);
  const colorFor = (category) => colors[categories.indexOf(category) % colors.length];

  function showToast(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    toastTimer = setTimeout(() => { $("toast").hidden = true; }, 6500);
  }

  function feedback(message, error = false) {
    $("import-feedback").textContent = message;
    $("import-feedback").classList.toggle("error", error);
    $("import-feedback").hidden = false;
  }

  function parseCSV(text) {
    const parsed = Papa.parse(text.replace(/^\uFEFF/, ""), {
      header: true, skipEmptyLines: "greedy", delimitersToGuess: [",", ";", "\t"],
      transformHeader: (header) => header.trim(),
    });
    const missing = required.filter((name) => !parsed.meta.fields?.includes(name));
    if (missing.length) throw new Error(`Colunas ausentes: ${missing.join(", ")}. Baixe o modelo e confira o cabeçalho.`);
    if (parsed.errors.length) {
      const issue = parsed.errors[0];
      throw new Error(`CSV malformado${Number.isInteger(issue.row) ? ` no registro ${issue.row + 1} após o cabeçalho` : ""}. Confira os separadores, as aspas e a quantidade de colunas.`);
    }
    if (!parsed.data.length) throw new Error("O arquivo não contém vendas. Inclua ao menos um registro após o cabeçalho.");
    if (parsed.data.length > 20000) throw new Error("O limite é de 20.000 registros por arquivo.");
    const errors = [];
    const rows = parsed.data.map((raw, index) => {
      const fail = (reason) => { errors.push(`Registro ${index + 1}: ${reason}`); };
      const date = raw.Data.trim();
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "1900-01-01" && date <= "2100-12-31";
      const timestamp = validDate ? new Date(`${date}T12:00:00Z`) : null;
      if (!timestamp || Number.isNaN(timestamp.getTime()) || timestamp.toISOString().slice(0, 10) !== date) fail("Data inválida. Use AAAA-MM-DD, entre 1900 e 2100.");
      const store = raw.Loja.trim(), category = raw.Categoria.trim(), product = raw.Produto.trim();
      if (![store, category, product].every((value) => value.length > 0 && value.length <= 180)) fail("Loja, Categoria e Produto precisam ter de 1 a 180 caracteres.");
      const quantity = Number(raw.Quantidade.trim());
      if (!/^\d+$/.test(raw.Quantidade.trim()) || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000000) fail("Quantidade deve ser um inteiro de 1 a 1.000.000.");
      let amount = raw.Valor.trim().replace(/^R\$\s*/, "");
      if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(amount)) amount = amount.replace(/\./g, "");
      if (!/^\d+([.,]\d{1,2})?$/.test(amount)) fail("Valor inválido. Use um total positivo ou zero, com até duas casas decimais.");
      const cents = Math.round(Number(amount.replace(",", ".")) * 100);
      if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100000000000) fail("Valor fora do limite de R$ 1 bilhão por registro.");
      return { date, store, category, product, quantity, cents, index };
    });
    if (errors.length) throw new Error(`${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n… e mais ${errors.length - 5} problema(s).` : ""}\nA base atual foi preservada.`);
    if (unique(rows, "category").length > 30 || unique(rows, "store").length > 100) throw new Error("Use até 30 categorias e 100 lojas por base para manter a leitura dos gráficos.");
    return rows;
  }

  function buildMonths(rows) {
    const dates = rows.map((row) => row.date).sort();
    let year = Number(dates[0].slice(0, 4)), month = Number(dates[0].slice(5, 7));
    const end = dates.at(-1).slice(0, 7), result = [];
    while (true) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      result.push(key);
      if (key === end) break;
      if (++month === 13) { month = 1; year++; }
    }
    return result;
  }

  function populateSelect(id, values, label) {
    const select = $(id), previous = select.value;
    select.replaceChildren(new Option(label, ""), ...values.map((value) => new Option(value, value)));
    select.value = values.includes(previous) ? previous : "";
  }

  function installData(rows, metadata, reset = false) {
    data = rows;
    source = metadata;
    months = buildMonths(rows);
    categories = unique(rows, "category");
    if (reset) { $("loja").value = ""; $("categoria").value = ""; }
    populateSelect("loja", unique(rows, "store"), "Todas as lojas");
    populateSelect("categoria", categories, "Todas as categorias");
    const dates = rows.map((row) => row.date).sort();
    $("hero-period").textContent = `${formatDate(dates[0])} a ${formatDate(dates.at(-1))} · ${number.format(rows.length)} vendas na base`;
    $("period-label").textContent = `${shortMonth(months[0])} — ${shortMonth(months.at(-1))}`;
    $("source-name").textContent = source.name;
    $("source-details").textContent = `${number.format(rows.length)} registros · ${unique(rows, "store").length} lojas · ${categories.length} categorias · ${source.importedAt ? `Importada em ${new Date(source.importedAt).toLocaleString("pt-BR")}` : "Base fornecida com o projeto"}`;
    render();
  }

  function grouped(rows, key, metric) {
    const map = new Map();
    rows.forEach((row) => map.set(row[key], (map.get(row[key]) || 0) + row[metric]));
    return [...map].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]));
  }

  function render() {
    filtered = data.filter((row) => (!$("loja").value || row.store === $("loja").value) && (!$("categoria").value || row.category === $("categoria").value));
    const revenue = total(filtered, "cents"), quantity = total(filtered, "quantity");
    const products = grouped(filtered, "product", "quantity");
    const categoryRevenue = new Map(grouped(filtered, "category", "cents"));
    const activeCategories = categories.filter((category) => !$("categoria").value || category === $("categoria").value);
    const monthlyRevenue = new Map();
    filtered.forEach((row) => { const month = row.date.slice(0, 7); monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + row.cents); });
    $("kpi-revenue").textContent = currency(revenue);
    $("kpi-quantity").textContent = number.format(quantity);
    $("kpi-sales").textContent = number.format(filtered.length);
    $("kpi-ticket").textContent = currency(filtered.length ? revenue / filtered.length : 0);
    $("kpi-product").textContent = products[0]?.[0] || "Sem vendas";
    const ties = products.filter((product) => product[1] === products[0]?.[1]);
    $("kpi-product-note").textContent = products.length ? `${number.format(products[0][1])} unidades${ties.length > 1 ? ` · empate entre ${ties.length} produtos` : " na seleção"}` : "Experimente outra combinação de filtros";
    $("kpi-product").title = ties.map((product) => product[0]).join(", ");
    const lastMonth = months.at(-1);
    const previousDate = new Date(`${lastMonth}-01T12:00:00Z`);
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    const current = monthlyRevenue.get(lastMonth) || 0, previous = monthlyRevenue.get(previousMonth) || 0;
    const change = previous ? (current - previous) / previous * 100 : null;
    $("kpi-change").textContent = change === null ? "—" : `${change > 0 ? "+" : ""}${percent.format(change)}%`;
    $("kpi-change").classList.toggle("positive", change > 0);
    $("kpi-change").classList.toggle("negative", change < 0);
    $("kpi-change-note").textContent = `${shortMonth(lastMonth)} × ${shortMonth(previousMonth)}${change === null ? " · sem receita no mês anterior" : ""}`;
    $("selection-count").textContent = `${number.format(filtered.length)} de ${number.format(data.length)} vendas`;
    $("export-data").disabled = !filtered.length;
    renderCharts(activeCategories, categoryRevenue, monthlyRevenue, products, revenue);
    renderTable();
  }

  const baseOptions = () => ({ responsive: true, maintainAspectRatio: false,
    animation: matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 850, easing: "easeInOutQuart" },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#183f36", padding: 11, cornerRadius: 6, displayColors: true } },
    scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: "#89917e", font: { size: 10 }, maxRotation: 0, autoSkip: true } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: "#eef0e7" }, ticks: { color: "#89917e", font: { size: 9 }, maxTicksLimit: 5 } } },
  });

  function updateChart(id, type, labels, datasets, options, empty, description) {
    const canvas = $(id);
    canvas.setAttribute("aria-label", description);
    canvas.nextElementSibling.hidden = !empty;
    if (charts[id]) {
      const chart = charts[id];
      chart.data.labels = labels;
      // Mantém os datasets para interpolar a partir da posição atual das barras,
      // dos pontos e dos segmentos, inclusive ao trocar filtros rapidamente.
      datasets.forEach((dataset, index) => {
        if (chart.data.datasets[index]) Object.assign(chart.data.datasets[index], dataset);
        else chart.data.datasets.push(dataset);
      });
      chart.data.datasets.length = datasets.length;
      chart.options = options;
      chart.update();

      chartTransitions.get(canvas)?.cancel();
      if (options.animation !== false && !empty && typeof canvas.animate === "function") {
        chartTransitions.set(canvas, canvas.animate([
          { opacity: 0.55, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 450, easing: "ease-out" }));
      }
    } else charts[id] = new Chart(canvas, { type, data: { labels, datasets }, options });
  }

  function renderCharts(activeCategories, categoryRevenue, monthlyRevenue, products, revenue) {
    const categoryValues = activeCategories.map((category) => (categoryRevenue.get(category) || 0) / 100);
    const barOptions = baseOptions();
    barOptions.scales.y.ticks.callback = (value) => `R$ ${number.format(value)}`;
    barOptions.plugins.tooltip.callbacks = { label: (context) => money.format(context.parsed.y) };
    updateChart("category-chart", "bar", activeCategories, [{ data: categoryValues, backgroundColor: activeCategories.map(colorFor), borderRadius: 5, maxBarThickness: 56 }], barOptions, !filtered.length, activeCategories.map((category, i) => `${category}: ${money.format(categoryValues[i])}`).join("; "));

    const donutOptions = baseOptions();
    delete donutOptions.scales;
    donutOptions.cutout = "76%";
    donutOptions.layout = { padding: 8 };
    donutOptions.plugins.tooltip.callbacks = { label: (context) => `${money.format(context.parsed)} · ${percent.format(revenue ? context.parsed * 10000 / revenue : 0)}%` };
    updateChart("share-chart", "doughnut", activeCategories, [{ data: categoryValues, backgroundColor: activeCategories.map(colorFor), borderWidth: 4, borderColor: "#fff", borderRadius: 3, hoverOffset: 3 }], donutOptions, !revenue, `Participação na receita. ${activeCategories.map((category, i) => `${category}: ${percent.format(revenue ? categoryValues[i] * 10000 / revenue : 0)}%`).join("; ")}`);
    $("share-legend").replaceChildren(...activeCategories.map((category, i) => {
      const row = document.createElement("div"), dot = document.createElement("span"), label = document.createElement("span"), value = document.createElement("strong");
      row.className = "legend-row"; dot.className = "legend-dot"; dot.style.backgroundColor = colorFor(category);
      label.textContent = category; value.textContent = `${percent.format(revenue ? categoryValues[i] * 10000 / revenue : 0)}%`;
      row.append(dot, label, value); return row;
    }));

    const lineOptions = baseOptions();
    lineOptions.scales.y.ticks.callback = (value) => `R$ ${number.format(value)}`;
    lineOptions.scales.x.ticks.maxTicksLimit = 12;
    lineOptions.plugins.tooltip.callbacks = { label: (context) => money.format(context.parsed.y) };
    const monthlyValues = months.map((month) => (monthlyRevenue.get(month) || 0) / 100);
    updateChart("monthly-chart", "line", months.map(shortMonth), [{ data: monthlyValues, borderColor: "#53784b", backgroundColor: "#a5b48720", fill: true, tension: .3, borderWidth: 2, pointRadius: months.length > 24 ? 0 : 3, pointBackgroundColor: "#fff", pointBorderWidth: 2, pointHoverRadius: 5 }], lineOptions, !filtered.length, months.map((month, i) => `${shortMonth(month)}: ${money.format(monthlyValues[i])}`).join("; "));

    const top = products.slice(0, 5), productOptions = baseOptions();
    productOptions.indexAxis = "y";
    productOptions.scales.x.grid = { color: "#eef0e7" };
    productOptions.scales.x.beginAtZero = true;
    productOptions.scales.x.ticks.precision = 0;
    productOptions.scales.y.grid = { display: false };
    productOptions.scales.y.ticks.font = { size: 9 };
    productOptions.scales.y.ticks.callback = function (value) { const label = this.getLabelForValue(value); return label.length > 24 ? `${label.slice(0, 23)}…` : label; };
    productOptions.plugins.tooltip.callbacks = { label: (context) => `${number.format(context.parsed.x)} unidades` };
    updateChart("products-chart", "bar", top.map(([name]) => name), [{ data: top.map(([, value]) => value), backgroundColor: ["#315d48", "#6c8962", "#94a77c", "#b3be99", "#cfcead"], borderRadius: 4, maxBarThickness: 19 }], productOptions, !filtered.length, top.map(([name, value]) => `${name}: ${value} unidades`).join("; "));
  }

  function renderTable() {
    // A ordenação atua nas dez vendas mais recentes, preservando o requisito.
    const recent = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.index - a.index).slice(0, 10);
    recent.sort((a, b) => {
      const left = a[sorting.key], right = b[sorting.key];
      return sorting.direction * (typeof left === "number" ? left - right : collator.compare(left, right)) || b.index - a.index;
    });
    const body = $("sales-body"); body.replaceChildren();
    recent.forEach((row) => {
      const tr = document.createElement("tr");
      [formatDate(row.date), row.store, row.category, row.product, number.format(row.quantity), currency(row.cents)].forEach((value, index) => {
        const td = document.createElement("td");
        if (index === 2) { const tag = document.createElement("span"); tag.className = "category-tag"; tag.textContent = value; tag.style.backgroundColor = `${colorFor(row.category)}20`; tag.style.color = "#516343"; td.append(tag); }
        else td.textContent = value;
        if (index > 3) td.className = "numeric";
        tr.append(td);
      }); body.append(tr);
    });
    if (!recent.length) { const tr = document.createElement("tr"), td = document.createElement("td"); tr.className = "empty-row"; td.colSpan = 6; td.textContent = "Nenhuma venda encontrada. Limpe os filtros ou escolha outra combinação."; tr.append(td); body.append(tr); }
    document.querySelectorAll("[data-sort]").forEach((button) => {
      const active = button.dataset.sort === sorting.key;
      button.parentElement.setAttribute("aria-sort", active ? sorting.direction === 1 ? "ascending" : "descending" : "none");
      button.querySelector("span").textContent = active ? sorting.direction === 1 ? "↑" : "↓" : "↕";
    });
    $("table-count").textContent = `Exibindo ${recent.length} de ${number.format(filtered.length)} vendas`;
  }

  async function importFile(file) {
    if (!file || busy) return;
    if (!/\.csv$/i.test(file.name)) { feedback("Escolha um arquivo com extensão .csv. No Excel, use Salvar como → CSV UTF-8.", true); return; }
    if (file.size > 5 * 1024 * 1024) { feedback("O arquivo excede 5 MB. Divida sua base em arquivos menores.", true); return; }
    busy = true; $("csv-file").disabled = true; $("restore-original").disabled = true;
    feedback("Validando o arquivo…");
    try {
      const buffer = await file.arrayBuffer();
      let text;
      try { text = new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
      catch { text = new TextDecoder("windows-1252").decode(buffer); }
      const rows = parseCSV(text), metadata = { name: file.name, importedAt: new Date().toISOString() };
      installData(rows, metadata, true);
      let saved = true;
      try { localStorage.setItem(storageKey, JSON.stringify({ csv: text, ...metadata })); }
      catch { saved = false; }
      feedback(`${number.format(rows.length)} vendas importadas com sucesso. Filtros reiniciados e dashboard atualizado.${saved ? " A base foi salva neste navegador." : " O navegador não permitiu salvar a base: importe novamente quando reabrir a página."}`);
      showToast(`Base atualizada: ${number.format(rows.length)} vendas prontas para explorar.`);
    } catch (error) { feedback(error.message || "Não foi possível ler o arquivo. Confira o formato CSV.", true); }
    finally { busy = false; $("csv-file").disabled = false; $("restore-original").disabled = false; $("csv-file").value = ""; }
  }

  function downloadCSV(filename, rows) {
    const csv = Papa.unparse({ fields: required, data: rows }, { escapeFormulae: true, newline: "\r\n" });
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setupEvents() {
    ["loja", "categoria"].forEach((id) => $(id).addEventListener("change", render));
    $("clear-filters").addEventListener("click", () => { $("loja").value = ""; $("categoria").value = ""; render(); });
    document.querySelectorAll("[data-sort]").forEach((button) => button.addEventListener("click", () => { const key = button.dataset.sort; sorting = { key, direction: sorting.key === key ? -sorting.direction : 1 }; renderTable(); }));
    document.querySelectorAll("[data-open-import]").forEach((button) => button.addEventListener("click", () => { $("import-feedback").hidden = true; $("import-dialog").showModal(); }));
    ["close-import", "cancel-import"].forEach((id) => $(id).addEventListener("click", () => $("import-dialog").close()));
    $("import-dialog").addEventListener("click", (event) => { const rect = $("import-dialog").getBoundingClientRect(); if (event.target === $("import-dialog") && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) $("import-dialog").close(); });
    $("csv-file").addEventListener("change", (event) => importFile(event.target.files[0]));
    const drop = $("drop-zone");
    ["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("dragover"); }));
    drop.addEventListener("drop", (event) => { if (event.dataTransfer.files.length !== 1) feedback("Envie um único CSV completo por vez.", true); else importFile(event.dataTransfer.files[0]); });
    $("download-template").addEventListener("click", () => downloadCSV("modelo_vendas_bahubali.csv", [["2026-08-26", "Centro", "Ficção", "Exemplo de livro", 2, "59.80"]]));
    $("export-data").addEventListener("click", () => downloadCSV("vendas_bahubali_selecao.csv", filtered.map((row) => [row.date, row.store, row.category, row.product, row.quantity, (row.cents / 100).toFixed(2)])));
    $("restore-original").addEventListener("click", () => {
      try { installData(parseCSV(window.BAHUBALI_INITIAL_CSV), { name: "vendas_livraria.csv" }, true); } catch (error) { feedback(error.message, true); return; }
      let removed = true;
      try { localStorage.removeItem(storageKey); } catch { removed = false; }
      feedback(`Base fornecida restaurada. ${number.format(data.length)} vendas carregadas.${removed ? "" : " O navegador bloqueou a limpeza do armazenamento. A base anterior poderá reaparecer ao reabrir."}`);
      showToast("Base fornecida restaurada.");
    });
    document.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", () => { document.querySelectorAll("nav a").forEach((item) => item.classList.toggle("active", item === link)); }));
  }

  async function init() {
    if (!window.Papa || !window.Chart) { $("source-details").textContent = "Bibliotecas não encontradas. Mantenha a pasta vendor junto ao index.html e recarregue."; return; }
    Chart.defaults.font.family = '"Segoe UI", Arial, sans-serif';
    Chart.defaults.color = "#7e8975";
    setupEvents();
    let stored;
    try { stored = localStorage.getItem(storageKey); } catch { /* A importação continua disponível sem armazenamento. */ }
    if (stored) {
      try { const saved = JSON.parse(stored); installData(parseCSV(saved.csv), { name: String(saved.name || "Base importada"), importedAt: saved.importedAt }); return; }
      catch { showToast("A base salva não pôde ser lida. Carregamos a base fornecida; você pode importar seu CSV novamente."); }
    }
    let csv = window.BAHUBALI_INITIAL_CSV;
    // Abrir index.html com duplo clique também funciona: a cópia local evita CORS em file://.
    if (["http:", "https:"].includes(location.protocol)) {
      try { const response = await fetch("vendas_livraria.csv", { cache: "no-store" }); if (response.ok) csv = await response.text(); } catch { /* Fallback offline. */ }
    }
    try { installData(parseCSV(csv), { name: "vendas_livraria.csv" }); }
    catch (error) {
      $("source-details").textContent = "Não foi possível carregar a base. Use Atualizar base para importar um CSV válido.";
      showToast(error.message);
    }
  }

  init();
})();
