// Página de detalle de propiedad
const propId = window.location.pathname.split('/').pop();

async function loadProp() {
  try {
    const res = await fetch(`/api/propiedades/${propId}`);
    if (!res.ok) { document.getElementById('propLoading').innerHTML = '<p style="color:var(--text-muted);text-align:center">Propiedad no encontrada.</p>'; return; }
    const p = await res.json();

    document.title = `${p.titulo} | MONARKA GROUP`;
    document.getElementById('propBreadcrumb').textContent = p.titulo;
    document.getElementById('propLoading').style.display = 'none';
    document.getElementById('propContent').style.display = 'block';

    // Precio y título
    document.getElementById('propPrice').textContent = formatPrice(p.precio, p.moneda) + (p.operacion === 'alquiler' ? '/mes' : '');
    document.getElementById('propTitle').textContent = p.titulo;
    document.getElementById('propLocText').textContent = [p.direccion, p.distrito, p.ciudad].filter(Boolean).join(', ');
    document.getElementById('mapAddress').textContent = [p.direccion, p.distrito, p.ciudad].filter(Boolean).join(', ');

    // Badges
    const opBadge = p.operacion === 'venta'
      ? '<span class="badge badge-venta">Venta</span>'
      : p.operacion === 'alquiler'
        ? '<span class="badge badge-alquiler">Alquiler</span>'
        : '<span class="badge badge-ambos">Venta/Alquiler</span>';
    document.getElementById('propBadges').innerHTML = opBadge + `<span class="badge" style="background:rgba(255,255,255,.08);color:var(--text-muted)">${p.tipo}</span>`;

    // Specs
    const specs = [];
    if (p.dormitorios > 0) specs.push({ val: p.dormitorios, lbl: 'Dormitorios' });
    if (p.banos > 0) specs.push({ val: p.banos, lbl: 'Baños' });
    if (p.area) specs.push({ val: `${p.area} m²`, lbl: 'Área' });
    if (p.estacionamiento > 0) specs.push({ val: p.estacionamiento, lbl: 'Parking' });
    document.getElementById('propSpecs').innerHTML = specs.map(s => `<div class="spec-item"><div class="spec-val">${s.val}</div><div class="spec-lbl">${s.lbl}</div></div>`).join('');

    // Descripción
    document.getElementById('propDesc').textContent = p.descripcion || 'Sin descripción disponible.';

    // Datos registrales desde la base de datos
    const reg = p.registral ? (typeof p.registral === 'string' ? JSON.parse(p.registral) : p.registral) : null;
    if (reg) {
      document.getElementById('regUbicacion').textContent = reg.ubicacion;
      document.getElementById('regArea').textContent = reg.area;
      document.getElementById('regPartida').textContent = reg.partida;
      document.getElementById('registralBox').style.display = 'block';
    }

    // Info adicional
    const rows = [
      ['Tipo', p.tipo?.charAt(0).toUpperCase() + p.tipo?.slice(1)],
      ['Operación', p.operacion?.charAt(0).toUpperCase() + p.operacion?.slice(1)],
      ['Distrito', p.distrito],
    ].filter(r => r[1]);
    document.getElementById('infoTable').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');

    // Galería
    const imgs = p.imagenes.length > 0 ? p.imagenes : (p.imagen_principal ? [p.imagen_principal] : []);
    if (imgs.length > 0) {
      document.getElementById('mainImg').src = imgs[0];
      document.getElementById('mainImg').alt = p.titulo;
      const thumbs = document.getElementById('thumbsContainer');
      thumbs.innerHTML = imgs.map((img, i) => `
        <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="changeImg('${img}', this)">
          <img src="${img}" alt="Imagen ${i + 1}" loading="lazy">
        </div>`).join('');
    } else {
      document.getElementById('mainImg').style.display = 'none';
      document.querySelector('.gallery-main').innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem">🏠</div>';
    }

    // Mapa
    if (p.lat && p.lng) {
      const mapContainer = document.getElementById('mapContainer');
      mapContainer.innerHTML = `<iframe width="100%" height="300" style="border:0" loading="lazy" allowfullscreen
        src="https://maps.google.com/maps?q=${p.lat},${p.lng}&z=16&output=embed"></iframe>`;
    }

    // Form contacto
    document.getElementById('propContactId').value = p.id;
    const propContactForm = document.getElementById('propContactForm');
    if (propContactForm) {
      propContactForm.addEventListener('submit', async e => {
        e.preventDefault();
        await submitContactForm(propContactForm, document.getElementById('propContactSuccess'));
      });
    }
  } catch (err) {
    document.getElementById('propLoading').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Error al cargar la propiedad.</p>';
  }
}

function changeImg(src, el) {
  document.getElementById('mainImg').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

loadProp();
