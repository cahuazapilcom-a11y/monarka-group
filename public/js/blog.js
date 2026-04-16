// Blog listing
let currentPage = 1;

async function loadBlog() {
  const grid = document.getElementById('blogGrid');
  const pagination = document.getElementById('pagination');
  grid.innerHTML = '<div class="loader" style="grid-column:1/-1"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`/api/blog?page=${currentPage}&limit=6`);
    const data = await res.json();
    if (!data.posts.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:16px">📰</div><p>No hay artículos publicados aún.</p></div>';
      return;
    }
    grid.innerHTML = data.posts.map(renderBlogCard).join('');
    if (pagination && data.paginas > 1) {
      let html = '';
      if (currentPage > 1) html += `<div class="page-btn" onclick="goPage(${currentPage - 1})">‹</div>`;
      for (let i = 1; i <= data.paginas; i++) html += `<div class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</div>`;
      if (currentPage < data.paginas) html += `<div class="page-btn" onclick="goPage(${currentPage + 1})">›</div>`;
      pagination.innerHTML = html;
    }
  } catch {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Error al cargar el blog.</div>';
  }
}

function goPage(n) { currentPage = n; loadBlog(); window.scrollTo({ top: 200, behavior: 'smooth' }); }

loadBlog();
