// Página de propiedades — filtros y listado
let currentPage = 1;
const filters = { operacion: '', tipo: '', dormitorios: '' };

// Leer params de URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('operacion')) filters.operacion = urlParams.get('operacion');
if (urlParams.get('tipo')) filters.tipo = urlParams.get('tipo');
if (urlParams.get('distrito')) document.getElementById('distritoInput').value = urlParams.get('distrito');

// Chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const filterName = chip.dataset.filter;
    document.querySelectorAll(`[data-filter="${filterName}"]`).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filters[filterName] = chip.dataset.val;
  });
});

// Activar chips según URL params
if (filters.operacion) {
  const chip = document.querySelector(`[data-filter="operacion"][data-val="${filters.operacion}"]`);
  if (chip) { document.querySelectorAll('[data-filter="operacion"]').forEach(c => c.classList.remove('active')); chip.classList.add('active'); }
}
if (filters.tipo) {
  const chip = document.querySelector(`[data-filter="tipo"][data-val="${filters.tipo}"]`);
  if (chip) { document.querySelectorAll('[data-filter="tipo"]').forEach(c => c.classList.remove('active')); chip.classList.add('active'); }
}

function limpiarFiltros() {
  filters.operacion = ''; filters.tipo = ''; filters.dormitorios = '';
  document.querySelectorAll('.chip').forEach(c => {
    const isAll = c.dataset.val === '';
    c.classList.toggle('active', isAll);
  });
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('distritoInput').value = '';
  currentPage = 1;
  loadProps();
}

function aplicarFiltros() {
  currentPage = 1;
  loadProps();
}

async function loadProps() {
  const grid = document.getElementById('propGrid');
  const countEl = document.getElementById('resultsCount');
  const pagination = document.getElementById('pagination');
  grid.innerHTML = '<div class="loader" style="grid-column:1/-1"><div class="spinner"></div></div>';

  const params = new URLSearchParams();
  params.set('page', currentPage);
  params.set('limit', 9);
  if (filters.operacion) params.set('operacion', filters.operacion);
  if (filters.tipo) params.set('tipo', filters.tipo);
  if (filters.dormitorios) params.set('dormitorios', filters.dormitorios);
  const minP = document.getElementById('minPrice')?.value;
  const maxP = document.getElementById('maxPrice')?.value;
  const dist = document.getElementById('distritoInput')?.value;
  if (minP) params.set('min_precio', minP);
  if (maxP) params.set('max_precio', maxP);
  if (dist) params.set('distrito', dist);

  try {
    const res = await fetch(`/api/propiedades?${params.toString()}`);
    const data = await res.json();
    if (countEl) countEl.textContent = data.total;

    if (!data.propiedades.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:16px">🔍</div><p>No se encontraron propiedades con los filtros seleccionados.</p></div>';
      if (pagination) pagination.innerHTML = '';
      return;
    }

    grid.innerHTML = data.propiedades.map(renderPropCard).join('');

    // Paginación
    if (pagination) {
      let html = '';
      if (data.paginas > 1) {
        if (currentPage > 1) html += `<div class="page-btn" onclick="goPage(${currentPage - 1})">‹</div>`;
        for (let i = 1; i <= data.paginas; i++) {
          html += `<div class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</div>`;
        }
        if (currentPage < data.paginas) html += `<div class="page-btn" onclick="goPage(${currentPage + 1})">›</div>`;
      }
      pagination.innerHTML = html;
    }
  } catch {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Error al cargar propiedades.</div>';
  }
}

function goPage(n) {
  currentPage = n;
  loadProps();
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

function filterProps() {
  // filtrado en tiempo real opcional — por ahora solo filtra al aplicar
}

// Init
loadProps();
