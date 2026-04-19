const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'monarka.db');
const db = new sqlite3.Database(DB_PATH);

// Helpers: promisify
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });
}

// Inicializar tablas y datos
async function init() {
  await run(`CREATE TABLE IF NOT EXISTS propiedades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL,
    operacion TEXT NOT NULL,
    precio REAL NOT NULL,
    moneda TEXT DEFAULT 'USD',
    direccion TEXT,
    distrito TEXT,
    ciudad TEXT DEFAULT 'Lima',
    dormitorios INTEGER DEFAULT 0,
    banos INTEGER DEFAULT 0,
    area REAL,
    estacionamiento INTEGER DEFAULT 0,
    planta INTEGER,
    total_plantas INTEGER,
    ano_construccion INTEGER,
    imagen_principal TEXT,
    imagenes TEXT DEFAULT '[]',
    lat REAL,
    lng REAL,
    destacado INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS blog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    resumen TEXT,
    contenido TEXT,
    imagen TEXT,
    autor TEXT DEFAULT 'MONARKA GROUP',
    publicado INTEGER DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS contactos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT,
    email TEXT NOT NULL,
    telefono TEXT,
    mensaje TEXT,
    propiedad_id INTEGER,
    leido INTEGER DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Admin por defecto
  const adminExiste = await get('SELECT id FROM admins WHERE usuario = ?', ['admin']);
  if (!adminExiste) {
    const hash = bcrypt.hashSync('monarka2024', 10);
    await run('INSERT INTO admins (usuario, password) VALUES (?, ?)', ['admin', hash]);
    console.log('Admin creado: usuario=admin, password=monarka2024');
  }

  // Propiedades de ejemplo
  const count = await get('SELECT COUNT(*) as c FROM propiedades');
  if (count.c === 0) {
    const ins = (args) => run(`INSERT INTO propiedades
      (titulo, descripcion, tipo, operacion, precio, moneda, direccion, distrito, dormitorios, banos, area, estacionamiento, ano_construccion, destacado, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args);

    await ins(['MZ. A, LOTE 1 LOTIZACION LA CAMPIÑA', 'Predio - Calle La Campiña, Yurimaguas', 'terreno', 'venta', 30000, 'PEN', 'Av. Larco 450', 'Miraflores', 0, 0, 295.83, 0, null, 1, -12.1211, -77.0282]);
    await ins(['Urb. Libertad del Paranapura, Yurimaguas', 'Predio - Calle Saniyacu, Urb. Libertad del Paranapura, Yurimaguas', 'terreno', 'venta', 69000, 'PEN', 'Calle Saniyacu, Urb. Libertad del Paranapura', 'Yurimaguas', 0, 0, 167.70, 0, null, 1, -12.0960, -77.0384]);
    await ins(['Oficina Premium en San Isidro', 'Oficina corporativa en edificio empresarial de primer nivel, con recepción compartida y salas de reuniones.', 'oficina', 'alquiler', 3500, 'USD', 'Av. Rivera Navarrete 765', 'San Isidro', 0, 2, 95, 1, 2020, 0, -12.0932, -77.0280]);
    await ins(['Departamento en Barranco', 'Departamento con encanto en el corazón de Barranco, cerca de galerías de arte y restaurantes.', 'apartamento', 'alquiler', 1800, 'USD', 'Jr. Centenario 120', 'Barranco', 2, 1, 75, 0, 2015, 1, -12.1503, -77.0211]);
    await ins(['Terreno en La Molina', 'Terreno plano en zona residencial exclusiva, todos los servicios, ideal para construir la casa de sus sueños.', 'terreno', 'venta', 220000, 'USD', 'Av. La Fontana 890', 'La Molina', 0, 0, 450, 0, null, 0, -12.0852, -76.9302]);
    await ins(['Local Comercial en Surco', 'Local en esquina con alto flujo peatonal, vidrios templados, ideal para boutique o restaurante.', 'local', 'ambos', 4200, 'USD', 'Av. Primavera 1240', 'Santiago de Surco', 0, 1, 60, 0, 2019, 0, -12.1100, -77.0034]);
  }

  // Actualizar propiedad 1 con datos correctos
  await run(`UPDATE propiedades SET titulo = ?, tipo = ?, precio = ?, moneda = ?, imagen_principal = ?, lat = ?, lng = ?, direccion = ?, distrito = ? WHERE id = 1`, ['MZ. A, LOTE 1 LOTIZACION LA CAMPIÑA', 'terreno', 30000, 'PEN', '/images/logroño.png', -5.9050939, -76.1376790, 'Calle La Campiña, Caserío Belén', 'Yurimaguas']);
  // Actualizar propiedad 2
  await run(`UPDATE propiedades SET imagen_principal = ?, imagenes = ?, descripcion = ?, titulo = ?, tipo = ?, distrito = ?, ciudad = NULL, lat = ?, lng = ?, precio = ?, moneda = ? WHERE id = 2`, ['/images/buena.png', JSON.stringify(['/images/buena.png']), 'Predio - Calle Saniyacu, Urb. Libertad del Paranapura, Yurimaguas', 'Urb. Libertad del Paranapura, Yurimaguas', 'terreno', 'Yurimaguas', -5.8834442, -76.1311200, 69000, 'PEN']);

  // Blog de ejemplo
  const blogCount = await get('SELECT COUNT(*) as c FROM blog');
  if (blogCount.c === 0) {
    await run('INSERT INTO blog (titulo, slug, resumen, contenido, publicado) VALUES (?, ?, ?, ?, ?)', [
      '5 consejos para comprar tu primera vivienda',
      '5-consejos-comprar-primera-vivienda',
      'Comprar una vivienda por primera vez puede ser abrumador. Aquí te damos los consejos clave para tomar la mejor decisión.',
      '<p>Comprar tu primera vivienda es una de las decisiones más importantes de tu vida.</p><h3>1. Define tu presupuesto</h3><p>Antes de buscar propiedades, calcula cuánto puedes pagar mensualmente sin comprometer tu calidad de vida.</p><h3>2. Investiga la zona</h3><p>Visita el barrio en diferentes momentos del día. Evalúa servicios, transporte y seguridad.</p><h3>3. Revisa el estado legal</h3><p>Asegúrate que la propiedad esté libre de cargas y con todos los documentos en regla.</p><h3>4. No te apresures</h3><p>Tómate el tiempo necesario para comparar opciones.</p><h3>5. Trabaja con expertos</h3><p>Un agente inmobiliario de confianza como MONARKA GROUP puede ahorrarte tiempo y dinero.</p>',
      1
    ]);
    await run('INSERT INTO blog (titulo, slug, resumen, contenido, publicado) VALUES (?, ?, ?, ?, ?)', [
      'El mercado inmobiliario en Lima 2024',
      'mercado-inmobiliario-lima-2024',
      'Análisis del comportamiento del mercado inmobiliario en Lima durante 2024 y las tendencias para el próximo año.',
      '<p>El mercado inmobiliario en Lima ha mostrado una recuperación significativa durante el 2024.</p><h3>Tendencias principales</h3><p>Los distritos de Miraflores, San Isidro y Barranco continúan siendo los más demandados.</p><h3>Precios</h3><p>Los precios por m² en zonas premium se han mantenido estables, con un incremento moderado del 3-5%.</p>',
      1
    ]);
  }

  console.log('Base de datos inicializada correctamente.');
}

module.exports = { db, run, get, all, init };
