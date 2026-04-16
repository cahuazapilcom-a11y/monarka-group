const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'monarka_secret_2024';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/images/propiedades');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `prop_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const admin = await get('SELECT * FROM admins WHERE usuario = ?', [usuario]);
    if (!admin || !bcrypt.compareSync(password, admin.password))
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign({ id: admin.id, usuario: admin.usuario }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: admin.usuario });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const propiedades = (await get('SELECT COUNT(*) as c FROM propiedades')).c;
    const activas = (await get('SELECT COUNT(*) as c FROM propiedades WHERE activo = 1')).c;
    const posts = (await get('SELECT COUNT(*) as c FROM blog')).c;
    const mensajes = (await get('SELECT COUNT(*) as c FROM contactos WHERE leido = 0')).c;
    res.json({ propiedades, activas, posts, mensajes_nuevos: mensajes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== PROPIEDADES =====
router.get('/propiedades', auth, async (req, res) => {
  try {
    const props = await all('SELECT * FROM propiedades ORDER BY creado_en DESC');
    res.json(props.map(p => ({ ...p, imagenes: JSON.parse(p.imagenes || '[]') })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/propiedades', auth, upload.array('imagenes', 10), async (req, res) => {
  try {
    const { titulo, descripcion, tipo, operacion, precio, moneda, direccion, distrito, ciudad,
      dormitorios, banos, area, estacionamiento, planta, total_plantas, ano_construccion,
      destacado, activo, lat, lng } = req.body;
    const imagenes = req.files ? req.files.map(f => `/images/propiedades/${f.filename}`) : [];
    const result = await run(`INSERT INTO propiedades
      (titulo, descripcion, tipo, operacion, precio, moneda, direccion, distrito, ciudad,
       dormitorios, banos, area, estacionamiento, planta, total_plantas, ano_construccion,
       destacado, activo, lat, lng, imagen_principal, imagenes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [titulo, descripcion, tipo, operacion, Number(precio), moneda || 'USD',
       direccion, distrito, ciudad || 'Lima',
       Number(dormitorios) || 0, Number(banos) || 0, Number(area) || null,
       Number(estacionamiento) || 0, Number(planta) || null, Number(total_plantas) || null,
       Number(ano_construccion) || null,
       destacado === 'true' || destacado === '1' ? 1 : 0,
       activo === 'false' || activo === '0' ? 0 : 1,
       lat ? Number(lat) : null, lng ? Number(lng) : null,
       imagenes[0] || null, JSON.stringify(imagenes)]);
    res.json({ id: result.lastID, ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/propiedades/:id', auth, upload.array('imagenes', 10), async (req, res) => {
  try {
    const { titulo, descripcion, tipo, operacion, precio, moneda, direccion, distrito, ciudad,
      dormitorios, banos, area, estacionamiento, planta, total_plantas, ano_construccion,
      destacado, activo, lat, lng } = req.body;
    const existing = await get('SELECT imagenes, imagen_principal FROM propiedades WHERE id = ?', [req.params.id]);
    let imagenes = JSON.parse(existing?.imagenes || '[]');
    if (req.files?.length) imagenes = [...imagenes, ...req.files.map(f => `/images/propiedades/${f.filename}`)];
    const imagen_principal = imagenes[0] || existing?.imagen_principal || null;
    await run(`UPDATE propiedades SET titulo=?,descripcion=?,tipo=?,operacion=?,precio=?,moneda=?,
      direccion=?,distrito=?,ciudad=?,dormitorios=?,banos=?,area=?,estacionamiento=?,
      planta=?,total_plantas=?,ano_construccion=?,destacado=?,activo=?,lat=?,lng=?,
      imagen_principal=?,imagenes=? WHERE id=?`,
      [titulo, descripcion, tipo, operacion, Number(precio), moneda || 'USD',
       direccion, distrito, ciudad || 'Lima',
       Number(dormitorios) || 0, Number(banos) || 0, Number(area) || null,
       Number(estacionamiento) || 0, Number(planta) || null, Number(total_plantas) || null,
       Number(ano_construccion) || null,
       destacado === 'true' || destacado === '1' ? 1 : 0,
       activo === 'false' || activo === '0' ? 0 : 1,
       lat ? Number(lat) : null, lng ? Number(lng) : null,
       imagen_principal, JSON.stringify(imagenes), req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/propiedades/:id', auth, async (req, res) => {
  try {
    await run('UPDATE propiedades SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== BLOG =====
router.get('/blog', auth, async (req, res) => {
  try { res.json(await all('SELECT * FROM blog ORDER BY creado_en DESC')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/blog', auth, upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, slug, resumen, contenido, publicado } = req.body;
    const imagen = req.file ? `/images/propiedades/${req.file.filename}` : null;
    const result = await run('INSERT INTO blog (titulo, slug, resumen, contenido, imagen, publicado) VALUES (?,?,?,?,?,?)',
      [titulo, slug, resumen, contenido, imagen, publicado === 'true' ? 1 : 0]);
    res.json({ id: result.lastID, ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/blog/:id', auth, upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, slug, resumen, contenido, publicado } = req.body;
    const existing = await get('SELECT imagen FROM blog WHERE id = ?', [req.params.id]);
    const imagen = req.file ? `/images/propiedades/${req.file.filename}` : existing?.imagen;
    await run('UPDATE blog SET titulo=?,slug=?,resumen=?,contenido=?,imagen=?,publicado=? WHERE id=?',
      [titulo, slug, resumen, contenido, imagen, publicado === 'true' ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/blog/:id', auth, async (req, res) => {
  try {
    await run('DELETE FROM blog WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== CONTACTOS =====
router.get('/contactos', auth, async (req, res) => {
  try { res.json(await all('SELECT * FROM contactos ORDER BY creado_en DESC')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/contactos/:id/leer', auth, async (req, res) => {
  try {
    await run('UPDATE contactos SET leido = 1 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
