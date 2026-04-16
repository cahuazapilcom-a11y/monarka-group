const API = '/api/admin';
let token = localStorage.getItem('monarka_token');
let allProps = [], allPosts = [], allContactos = [];

// ===== AUTH =====
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const usuario = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  try {
    const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, password }) });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem('monarka_token', token);
      document.getElementById('welcomeMsg').textContent = `Bienvenido, ${data.usuario}`;
      showApp();
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  } catch { document.getElementById('loginError').style.display = 'block'; }
});

function logout() {
  localStorage.removeItem('monarka_token');
  token = null;
  document.getElementById('adminApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function authHeaders() { return { 'Authorization': `Bearer ${token}` }; }

// ===== INIT =====
function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'block';
  loadDashboard();
}

if (token) { showApp(); }

// ===== NAV =====
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => showPage(item.dataset.page));
});

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  document.querySelector(`[data-page="${name}"]`)?.classList.add('active');
  if (name === 'dashboard') loadDashboard();
  if (name === 'propiedades') loadProps();
  if (name === 'blog') loadBlog();
  if (name === 'contactos') loadContactos();
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/dashboard`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-val">${data.propiedades}</div><div class="stat-label">Total Propiedades</div></div>
      <div class="stat-card"><div class="stat-val">${data.activas}</div><div class="stat-label">Propiedades Activas</div></div>
      <div class="stat-card"><div class="stat-val">${data.posts}</div><div class="stat-label">Posts del Blog</div></div>
      <div class="stat-card"><div class="stat-val" style="color:${data.mensajes_nuevos > 0 ? '#ef4444' : 'var(--primary)'}">${data.mensajes_nuevos}</div><div class="stat-label">Mensajes Nuevos</div></div>`;
    if (data.mensajes_nuevos > 0) {
      const badge = document.getElementById('msgBadge');
      badge.style.display = 'inline'; badge.textContent = data.mensajes_nuevos;
    }
    loadRecentProps();
  } catch { console.error('Error dashboard'); }
}

async function loadRecentProps() {
  const el = document.getElementById('recentProps');
  try {
    const res = await fetch(`${API}/propiedades`, { headers: authHeaders() });
    const props = await res.json();
    const recent = props.slice(0, 5);
    el.innerHTML = `<table><thead><tr><th>Imagen</th><th>Título</th><th>Tipo</th><th>Operación</th><th>Precio</th><th>Estado</th></tr></thead><tbody>
      ${recent.map(p => `<tr>
        <td>${p.imagen_principal ? `<img class="td-img" src="${p.imagen_principal}" alt="">` : '<div style="width:60px;height:45px;background:var(--dark3);border-radius:6px;display:flex;align-items:center;justify-content:center">🏠</div>'}</td>
        <td><strong>${p.titulo}</strong><br><small style="color:var(--muted)">${p.distrito || ''}</small></td>
        <td>${p.tipo}</td>
        <td><span class="badge badge-${p.operacion === 'venta' ? 'green' : 'blue'}">${p.operacion}</span></td>
        <td>${fmtPrice(p.precio, p.moneda)}</td>
        <td><span class="badge ${p.activo ? 'badge-green' : 'badge-red'}">${p.activo ? 'Activa' : 'Inactiva'}</span></td>
      </tr>`).join('')}
    </tbody></table>`;
  } catch { el.innerHTML = '<div class="empty-state">Error al cargar</div>'; }
}

// ===== PROPIEDADES =====
async function loadProps() {
  const wrap = document.getElementById('propsTableWrap');
  wrap.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}/propiedades`, { headers: authHeaders() });
    allProps = await res.json();
    renderPropsTable(allProps);
  } catch { wrap.innerHTML = '<div class="empty-state">Error al cargar propiedades</div>'; }
}

function renderPropsTable(props) {
  const wrap = document.getElementById('propsTableWrap');
  if (!props.length) { wrap.innerHTML = '<div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><p>No hay propiedades</p></div>'; return; }
  wrap.innerHTML = `<table><thead><tr><th>Imagen</th><th>Título</th><th>Tipo / Op.</th><th>Precio</th><th>Distrito</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
    ${props.map(p => `<tr>
      <td>${p.imagen_principal ? `<img class="td-img" src="${p.imagen_principal}" onerror="this.style.display='none'">` : '<div style="width:60px;height:45px;background:var(--dark3);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">🏠</div>'}</td>
      <td><strong>${p.titulo}</strong>${p.destacado ? ' ⭐' : ''}</td>
      <td><span class="badge badge-gray">${p.tipo}</span><br><span class="badge badge-${p.operacion === 'venta' ? 'green' : 'blue'}" style="margin-top:3px">${p.operacion}</span></td>
      <td>${fmtPrice(p.precio, p.moneda)}</td>
      <td>${p.distrito || '—'}</td>
      <td><span class="badge ${p.activo ? 'badge-green' : 'badge-red'}">${p.activo ? 'Activa' : 'Inactiva'}</span></td>
      <td><div class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="editProp(${p.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProp(${p.id})">🗑️</button>
        <a href="/propiedad/${p.id}" target="_blank" class="btn btn-secondary btn-sm">👁️</a>
      </div></td>
    </tr>`).join('')}
  </tbody></table>`;
}

function filterProps() {
  const q = document.getElementById('propSearch').value.toLowerCase();
  renderPropsTable(allProps.filter(p => p.titulo.toLowerCase().includes(q) || (p.distrito || '').toLowerCase().includes(q)));
}

// Modal Prop
function openPropModal(data = null) {
  document.getElementById('propModal').classList.add('open');
  document.getElementById('propModalTitle').textContent = data ? 'Editar Propiedad' : 'Nueva Propiedad';
  document.getElementById('propId').value = '';
  document.getElementById('propForm').reset();
  document.getElementById('currentImages').innerHTML = '';
  if (data) {
    document.getElementById('propId').value = data.id;
    const form = document.getElementById('propForm');
    Object.entries(data).forEach(([k, v]) => {
      const el = form.elements[k];
      if (el && v !== null) el.value = v;
    });
    if (data.imagenes?.length) {
      document.getElementById('currentImages').innerHTML = data.imagenes.map(img =>
        `<img src="${img}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">`).join('');
    }
  }
}
function closePropModal() { document.getElementById('propModal').classList.remove('open'); }

async function editProp(id) {
  const p = allProps.find(x => x.id === id);
  if (p) openPropModal(p);
}

async function saveProp() {
  const id = document.getElementById('propId').value;
  const form = document.getElementById('propForm');
  const fd = new FormData(form);
  const url = id ? `${API}/propiedades/${id}` : `${API}/propiedades`;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: authHeaders(), body: fd });
    const data = await res.json();
    if (res.ok) {
      closePropModal();
      showAlert('propAlert', id ? 'Propiedad actualizada correctamente.' : 'Propiedad creada correctamente.');
      loadProps();
    } else alert(data.error || 'Error al guardar');
  } catch { alert('Error al guardar'); }
}

async function deleteProp(id) {
  if (!confirm('¿Desactivar esta propiedad?')) return;
  await fetch(`${API}/propiedades/${id}`, { method: 'DELETE', headers: authHeaders() });
  loadProps();
}

// ===== BLOG =====
async function loadBlog() {
  const wrap = document.getElementById('blogTableWrap');
  wrap.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}/blog`, { headers: authHeaders() });
    allPosts = await res.json();
    renderBlogTable(allPosts);
  } catch { wrap.innerHTML = '<div class="empty-state">Error al cargar blog</div>'; }
}

function renderBlogTable(posts) {
  const wrap = document.getElementById('blogTableWrap');
  if (!posts.length) { wrap.innerHTML = '<div class="empty-state">No hay posts</div>'; return; }
  wrap.innerHTML = `<table><thead><tr><th>Título</th><th>Slug</th><th>Autor</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>
    ${posts.map(p => `<tr>
      <td><strong>${p.titulo}</strong></td>
      <td style="color:var(--muted);font-size:.8rem">${p.slug}</td>
      <td>${p.autor}</td>
      <td><span class="badge ${p.publicado ? 'badge-green' : 'badge-gray'}">${p.publicado ? 'Publicado' : 'Borrador'}</span></td>
      <td style="color:var(--muted);font-size:.8rem">${new Date(p.creado_en).toLocaleDateString('es-PE')}</td>
      <td><div class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="editPost(${p.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost(${p.id})">🗑️</button>
        <a href="/blog/${p.slug}" target="_blank" class="btn btn-secondary btn-sm">👁️</a>
      </div></td>
    </tr>`).join('')}
  </tbody></table>`;
}

function openBlogModal(data = null) {
  document.getElementById('blogModal').classList.add('open');
  document.getElementById('blogModalTitle').textContent = data ? 'Editar Post' : 'Nuevo Post';
  document.getElementById('blogId').value = '';
  document.getElementById('blogForm').reset();
  if (data) {
    document.getElementById('blogId').value = data.id;
    const form = document.getElementById('blogForm');
    ['titulo', 'slug', 'resumen', 'contenido', 'publicado'].forEach(k => {
      const el = form.elements[k];
      if (el && data[k] !== null) el.value = data[k];
    });
  }
  // Auto-slug
  document.querySelector('#blogForm [name="titulo"]').addEventListener('input', function () {
    if (!document.getElementById('blogId').value) {
      document.getElementById('blogSlug').value = this.value.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  });
}
function closeBlogModal() { document.getElementById('blogModal').classList.remove('open'); }

async function editPost(id) {
  const p = allPosts.find(x => x.id === id);
  if (p) openBlogModal(p);
}

async function saveBlog() {
  const id = document.getElementById('blogId').value;
  const form = document.getElementById('blogForm');
  const fd = new FormData(form);
  const url = id ? `${API}/blog/${id}` : `${API}/blog`;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: authHeaders(), body: fd });
    const data = await res.json();
    if (res.ok) {
      closeBlogModal();
      showAlert('blogAlert', id ? 'Post actualizado.' : 'Post creado.');
      loadBlog();
    } else alert(data.error || 'Error al guardar');
  } catch { alert('Error al guardar'); }
}

async function deletePost(id) {
  if (!confirm('¿Eliminar este post?')) return;
  await fetch(`${API}/blog/${id}`, { method: 'DELETE', headers: authHeaders() });
  loadBlog();
}

// ===== CONTACTOS =====
async function loadContactos() {
  const wrap = document.getElementById('contactosTableWrap');
  wrap.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}/contactos`, { headers: authHeaders() });
    allContactos = await res.json();
    renderContactosTable(allContactos);
    document.getElementById('msgBadge').style.display = 'none';
  } catch { wrap.innerHTML = '<div class="empty-state">Error al cargar mensajes</div>'; }
}

function renderContactosTable(contactos) {
  const wrap = document.getElementById('contactosTableWrap');
  if (!contactos.length) { wrap.innerHTML = '<div class="empty-state">No hay mensajes</div>'; return; }
  wrap.innerHTML = `<table><thead><tr><th>Nombre</th><th>Email</th><th>Mensaje</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
    ${contactos.map(c => `<tr style="${!c.leido ? 'font-weight:600' : ''}">
      <td>${c.nombre} ${c.apellido || ''}</td>
      <td><a href="mailto:${c.email}" style="color:var(--primary)">${c.email}</a></td>
      <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.mensaje}</td>
      <td style="color:var(--muted);font-size:.8rem">${new Date(c.creado_en).toLocaleDateString('es-PE')}</td>
      <td><span class="badge ${c.leido ? 'badge-gray' : 'badge-green'}">${c.leido ? 'Leído' : 'Nuevo'}</span></td>
      <td>${!c.leido ? `<button class="btn btn-secondary btn-sm" onclick="marcarLeido(${c.id})">✓ Marcar leído</button>` : ''}</td>
    </tr>`).join('')}
  </tbody></table>`;
}

async function marcarLeido(id) {
  await fetch(`${API}/contactos/${id}/leer`, { method: 'PUT', headers: authHeaders() });
  loadContactos();
}

// ===== UTILS =====
function fmtPrice(p, m = 'USD') { return `${m === 'USD' ? '$' : 'S/'} ${Number(p).toLocaleString('es-PE')}`; }

function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '✓ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});
