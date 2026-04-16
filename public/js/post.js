// Post individual
const slug = window.location.pathname.split('/blog/')[1];

async function loadPost() {
  try {
    const res = await fetch(`/api/blog/${slug}`);
    if (!res.ok) { document.getElementById('postLoading').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:60px">Artículo no encontrado.</p>'; return; }
    const post = await res.json();
    document.title = `${post.titulo} | MONARKA GROUP`;
    document.getElementById('postBreadcrumb').textContent = post.titulo;
    document.getElementById('postTitle').textContent = post.titulo;
    document.getElementById('postAuthor').textContent = `Por ${post.autor}`;
    document.getElementById('postDate').textContent = new Date(post.creado_en).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('postBody').innerHTML = post.contenido || '';
    if (post.imagen) {
      const heroImg = document.getElementById('postHeroImg');
      heroImg.style.display = 'block';
      document.getElementById('postHeroImgEl').src = post.imagen;
      document.getElementById('postHeroImgEl').alt = post.titulo;
    }
    document.getElementById('postLoading').style.display = 'none';
    document.getElementById('postLayoutEl').style.display = 'grid';
    loadRelated(post.id);
  } catch {
    document.getElementById('postLoading').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:60px">Error al cargar el artículo.</p>';
  }
}

async function loadRelated(currentId) {
  const list = document.getElementById('relatedList');
  try {
    const res = await fetch('/api/blog?limit=4');
    const data = await res.json();
    const related = data.posts.filter(p => p.id !== currentId).slice(0, 3);
    if (!related.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">No hay artículos relacionados.</p>'; return; }
    list.innerHTML = related.map(p => `
      <div class="related-post">
        <div class="related-post-img">
          ${p.imagen ? `<img src="${p.imagen}" alt="${p.titulo}" loading="lazy">` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">📰</div>'}
        </div>
        <div>
          <div class="related-post-title"><a href="/blog/${p.slug}">${p.titulo}</a></div>
          <div style="color:var(--muted);font-size:.75rem;margin-top:4px">${new Date(p.creado_en).toLocaleDateString('es-PE')}</div>
        </div>
      </div>`).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">Error al cargar.</p>';
  }
}

loadPost();
