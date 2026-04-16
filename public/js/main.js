// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) scrollTopBtn.classList.toggle('show', window.scrollY > 300);
});

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Scroll top
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== FORMATO PRECIO =====
function formatPrice(price, moneda = 'USD') {
  if (moneda === 'USD') return `$ ${Number(price).toLocaleString('es-PE')}`;
  return `S/ ${Number(price).toLocaleString('es-PE')}`;
}

// ===== CARD PROPIEDAD =====
function renderPropCard(p) {
  const img = p.imagen_principal
    ? `<img src="${p.imagen_principal}" alt="${p.titulo}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=prop-img-placeholder>🏠</div>'">`
    : `<div class="prop-img-placeholder">🏠</div>`;

  const opBadge = p.operacion === 'venta'
    ? '<span class="badge badge-venta">Venta</span>'
    : p.operacion === 'alquiler'
      ? '<span class="badge badge-alquiler">Alquiler</span>'
      : '<span class="badge badge-ambos">Venta/Alquiler</span>';

  const tipoBadge = `<span class="badge" style="background:rgba(255,255,255,.08);color:var(--text-muted);border:1px solid var(--border)">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)}</span>`;

  const features = [];
  if (p.dormitorios > 0) features.push(`<div class="prop-feat"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>${p.dormitorios} Dorm.</div>`);
  if (p.banos > 0) features.push(`<div class="prop-feat"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12h16M4 6h16M4 18h16"/></svg>${p.banos} Baños</div>`);
  if (p.area) features.push(`<div class="prop-feat"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>${p.area} m²</div>`);

  return `
    <div class="prop-card" onclick="window.location='/propiedad/${p.id}'">
      <div class="prop-img">
        ${img}
        <div class="prop-badges">${opBadge} ${tipoBadge}</div>
        ${p.destacado ? '<div class="prop-fav" title="Destacada">★</div>' : ''}
      </div>
      <div class="prop-body">
        <div class="prop-price">${formatPrice(p.precio, p.moneda)}<span>${p.operacion === 'alquiler' ? '/mes' : ''}</span></div>
        <div class="prop-title">${p.titulo}</div>
        <div class="prop-location">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.distrito || ''}, ${p.ciudad || 'Lima'}
        </div>
        ${features.length ? `<div class="prop-features">${features.join('')}</div>` : ''}
      </div>
    </div>`;
}

// ===== FORMULARIOS DE CONTACTO =====
async function submitContactForm(formEl, successEl) {
  const data = Object.fromEntries(new FormData(formEl).entries());
  try {
    const res = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (res.ok) {
      formEl.reset();
      if (successEl) { successEl.style.display = 'block'; setTimeout(() => successEl.style.display = 'none', 5000); }
      showToast('¡Mensaje enviado! Te contactaremos pronto.');
    } else {
      showToast(json.error || 'Error al enviar', 'error');
    }
  } catch {
    showToast('Error de conexión', 'error');
  }
}

// Hero contact form
const heroForm = document.getElementById('heroContactForm');
if (heroForm) heroForm.addEventListener('submit', e => { e.preventDefault(); submitContactForm(heroForm, null); });

// Main contact form
const contactForm = document.getElementById('contactForm');
if (contactForm) contactForm.addEventListener('submit', e => { e.preventDefault(); submitContactForm(contactForm, document.getElementById('contactSuccess')); });

// ===== HOMEPAGE: cargar propiedades destacadas =====
async function loadFeaturedProps() {
  const grid = document.getElementById('propGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/propiedades?destacado=1&limit=6');
    const data = await res.json();
    if (!data.propiedades.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">No hay propiedades disponibles.</p>';
      return;
    }
    grid.innerHTML = data.propiedades.map(renderPropCard).join('');
    const stat = document.getElementById('statPropiedades');
    if (stat) stat.textContent = `+${data.total}`;
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">Error al cargar propiedades.</p>';
  }
}

// ===== HOMEPAGE: cargar blog =====
async function loadBlogPreview() {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/blog?limit=3');
    const data = await res.json();
    if (!data.posts.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">No hay posts disponibles.</p>';
      return;
    }
    grid.innerHTML = data.posts.map(renderBlogCard).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted)">Error al cargar el blog.</p>';
  }
}

function renderBlogCard(p) {
  const img = p.imagen
    ? `<img src="${p.imagen}" alt="${p.titulo}" loading="lazy">`
    : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:2.5rem">📰</div>`;
  const date = new Date(p.creado_en).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div class="blog-card">
      <div class="blog-img">${img}</div>
      <div class="blog-body">
        <div class="blog-date">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${date}
        </div>
        <a href="/blog/${p.slug}" class="blog-title">${p.titulo}</a>
        <p class="blog-excerpt">${p.resumen || ''}</p>
        <a href="/blog/${p.slug}" class="blog-link">Leer más →</a>
      </div>
    </div>`;
}

// ===== BÚSQUEDA HERO =====
function buscarPropiedades() {
  const op = document.getElementById('filterOp')?.value || '';
  const tipo = document.getElementById('filterTipo')?.value || '';
  const distrito = document.getElementById('filterDistrito')?.value || '';
  const precio = document.getElementById('filterPrecio')?.value || '';
  const params = new URLSearchParams();
  if (op) params.set('operacion', op);
  if (tipo) params.set('tipo', tipo);
  if (distrito) params.set('distrito', distrito);
  if (precio) params.set('max_precio', precio);
  window.location.href = `/propiedades?${params.toString()}`;
}

// Init homepage
if (document.getElementById('propGrid')) loadFeaturedProps();
if (document.getElementById('blogGrid') && !document.getElementById('pagination')) loadBlogPreview();
