const express = require('express');
const router = express.Router();
const { all, get } = require('../database');

// GET /api/propiedades
router.get('/', async (req, res) => {
  try {
    const { tipo, operacion, distrito, min_precio, max_precio, dormitorios, destacado, buscar, page = 1, limit = 9 } = req.query;
    let query = 'SELECT * FROM propiedades WHERE activo = 1';
    const params = [];

    if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
    if (operacion && operacion !== 'ambos') { query += ' AND (operacion = ? OR operacion = "ambos")'; params.push(operacion); }
    if (distrito) { query += ' AND distrito LIKE ?'; params.push(`%${distrito}%`); }
    if (min_precio) { query += ' AND precio >= ?'; params.push(Number(min_precio)); }
    if (max_precio) { query += ' AND precio <= ?'; params.push(Number(max_precio)); }
    if (dormitorios) { query += ' AND dormitorios >= ?'; params.push(Number(dormitorios)); }
    if (destacado) { query += ' AND destacado = 1'; }
    if (buscar) { query += ' AND (titulo LIKE ? OR descripcion LIKE ? OR distrito LIKE ?)'; params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`); }

    query += ' ORDER BY destacado DESC, creado_en DESC';

    const countRow = await get(`SELECT COUNT(*) as c FROM (${query})`, params);
    const total = countRow.c;
    const offset = (Number(page) - 1) * Number(limit);

    const propiedades = await all(query + ` LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
    const result = propiedades.map(p => ({ ...p, imagenes: JSON.parse(p.imagenes || '[]') }));

    res.json({ total, paginas: Math.ceil(total / Number(limit)), pagina: Number(page), propiedades: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/propiedades/:id
router.get('/:id', async (req, res) => {
  try {
    const prop = await get('SELECT * FROM propiedades WHERE id = ? AND activo = 1', [req.params.id]);
    if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' });
    prop.imagenes = JSON.parse(prop.imagenes || '[]');
    res.json(prop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
