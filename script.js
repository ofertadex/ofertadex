const PAGE_SIZE = 50;

const grid        = document.getElementById('grid');
const buscaInput  = document.getElementById('busca');
const filterBar   = document.getElementById('filter-bar');
const resultsInfo = document.getElementById('results-info');

let todosProdutos  = [];
let filtrados      = [];
let paginaAtual    = 0;
let carregando     = false;
let categoriaAtiva = '';
let termoBusca     = '';

/* ── utilitários ── */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarPreco(centavos) {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

function cardHtml(p) {
  return `
    <a class="card" href="${esc(p.affiliate_url)}" target="_blank" rel="noopener sponsored"
       aria-label="${esc(p.titulo)}">
      <div class="card-img">
        <img src="${esc(p.imagem_url)}" alt="${esc(p.titulo)}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22/>'"/>
      </div>
      <div class="card-body">
        ${p.categoria ? `<span class="card-cat">${esc(p.categoria)}</span>` : ''}
        <p class="card-titulo">${esc(p.titulo)}</p>
      </div>
      <div class="card-footer">
        <span class="card-preco"><sup>R$</sup>${formatarPreco(p.preco_cent)}</span>
        <span class="btn-ver">Ver oferta</span>
      </div>
    </a>`;
}

/* ── categorias ── */
function buildCategorias(data) {
  const cats = [...new Set(data.map(p => p.categoria).filter(Boolean))].sort();
  filterBar.querySelectorAll('.pill:not([data-cat=""])').forEach(el => el.remove());
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => setCategoria(cat));
    filterBar.appendChild(btn);
  });
}

function setCategoria(cat) {
  categoriaAtiva = cat;
  filterBar.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === cat);
  });
  resetGrid();
}

/* ── filtro ── */
function aplicarFiltro() {
  const termo = termoBusca.toLowerCase().trim();
  filtrados = todosProdutos.filter(p => {
    const matchCat   = !categoriaAtiva || p.categoria === categoriaAtiva;
    const matchBusca = !termo
      || p.titulo.toLowerCase().includes(termo)
      || (p.categoria || '').toLowerCase().includes(termo);
    return matchCat && matchBusca;
  });
}

function atualizarInfo() {
  if (filtrados.length === todosProdutos.length) {
    resultsInfo.textContent = `${todosProdutos.length} produto${todosProdutos.length !== 1 ? 's' : ''}`;
  } else {
    resultsInfo.textContent =
      `${filtrados.length} de ${todosProdutos.length} produto${todosProdutos.length !== 1 ? 's' : ''}`;
  }
}

/* ── render incremental ── */
function resetGrid() {
  paginaAtual = 0;
  grid.innerHTML = '';
  removerSentinel();
  aplicarFiltro();
  atualizarInfo();

  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
        </svg>
        <p>Nenhum produto encontrado${termoBusca ? ` para "<strong>${esc(termoBusca)}</strong>"` : ''}.</p>
      </div>`;
    return;
  }

  appendPagina();
}

function appendPagina() {
  if (carregando) return;
  const inicio = paginaAtual * PAGE_SIZE;
  if (inicio >= filtrados.length) return;

  carregando = true;
  removerSentinel();

  const fatia = filtrados.slice(inicio, inicio + PAGE_SIZE);
  const frag  = document.createDocumentFragment();

  fatia.forEach(p => {
    const div = document.createElement('div');
    div.innerHTML = cardHtml(p);
    frag.appendChild(div.firstElementChild);
  });

  grid.appendChild(frag);
  paginaAtual++;

  if (paginaAtual * PAGE_SIZE < filtrados.length) {
    requestAnimationFrame(() => {
      carregando = false;
      inserirSentinel();
    });
  } else {
    carregando = false;
  }
}

/* ── sentinel (IntersectionObserver para scroll infinito) ── */
let sentinelEl = null;
let observer   = null;

function inserirSentinel() {
  removerSentinel();

  sentinelEl = document.createElement('div');
  sentinelEl.id = 'sentinel';
  sentinelEl.innerHTML = `<div class="loader"><div class="spinner"></div> Carregando mais…</div>`;
  grid.appendChild(sentinelEl);

  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) appendPagina();
  }, { rootMargin: '200px' });

  observer.observe(sentinelEl);
}

function removerSentinel() {
  if (observer) { observer.disconnect(); observer = null; }
  if (sentinelEl) { sentinelEl.remove(); sentinelEl = null; }
}

/* ── eventos ── */
filterBar.querySelector('.pill[data-cat=""]').addEventListener('click', () => setCategoria(''));

let debounceTimer;
buscaInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    termoBusca = buscaInput.value;
    resetGrid();
  }, 220);
});

/* ── carrega JSON ── */
grid.innerHTML = `<div class="loading-state">
  <div class="spinner"></div>
  <p>Carregando ofertas…</p>
</div>`;

fetch('https://opensheet.elk.sh/1tD4G3BqFdVzh5ZkZPUIP1V-HCI__j_WPGdSFqmi7n64/Publicados')
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(data => {
    todosProdutos = data.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    buildCategorias(todosProdutos);
    resetGrid();
  })
  .catch(err => {
    grid.innerHTML = `<div class="empty"><p>Erro ao carregar produtos: ${esc(err.message)}</p></div>`;
  });
