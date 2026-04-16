const express = require('express');
const router = express.Router();
const { all, get } = require('../database');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const countRow = await get('SELECT COUNT(*) as c FROM blog WHERE publicado = 1');
    const total = countRow.c;
    const offset = (Number(page) - 1) * Number(limit);
    const posts = await all(
      'SELECT id, titulo, slug, resumen, imagen, autor, creado_en FROM blog WHERE publicado = 1 ORDER BY creado_en DESC LIMIT ? OFFSET ?',
      [Number(limit), offset]
    );
    res.json({ total, paginas: Math.ceil(total / Number(limit)), pagina: Number(page), posts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const post = await get('SELECT * FROM blog WHERE slug = ? AND publicado = 1', [req.params.slug]);
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
