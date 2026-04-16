const express = require('express');
const router = express.Router();
const { run } = require('../database');

router.post('/', async (req, res) => {
  const { nombre, apellido, email, telefono, mensaje, propiedad_id } = req.body;
  if (!nombre || !email || !mensaje)
    return res.status(400).json({ error: 'Nombre, email y mensaje son requeridos' });
  try {
    await run(
      'INSERT INTO contactos (nombre, apellido, email, telefono, mensaje, propiedad_id) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido || null, email, telefono || null, mensaje, propiedad_id || null]
    );
    res.json({ ok: true, mensaje: 'Mensaje enviado correctamente. Te contactaremos pronto.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
