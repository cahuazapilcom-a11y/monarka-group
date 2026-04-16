require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { init } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/propiedades', require('./routes/properties'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/contacto', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

app.get('/propiedades', (req, res) => res.sendFile(path.join(__dirname, 'public/propiedades.html')));
app.get('/propiedad/:id', (req, res) => res.sendFile(path.join(__dirname, 'public/propiedad.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public/blog.html')));
app.get('/blog/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public/post.html')));
app.get('/admin*', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));

init().then(() => {
  app.listen(PORT, () => {
    console.log(`MONARKA GROUP corriendo en http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}).catch(err => {
  console.error('Error iniciando la base de datos:', err);
  process.exit(1);
});
