# MONARKA GROUP - Sitio Web Inmobiliaria

## Instalación local

```bash
cd monarka-group
npm install
npm run dev   # con nodemon (auto-reload)
# o
npm start     # producción
```

Abre: http://localhost:3000

## Credenciales Admin por defecto
- **URL:** http://localhost:3000/admin
- **Usuario:** admin
- **Password:** monarka2024

> ⚠️ Cambia la contraseña desde el panel después del primer login (próximamente) o directo en la BD.

## Estructura
```
monarka-group/
├── server.js          # Servidor Express
├── database.js        # SQLite + datos de ejemplo
├── routes/
│   ├── properties.js  # API propiedades
│   ├── blog.js        # API blog
│   ├── contact.js     # API contacto
│   └── admin.js       # API admin (protegida con JWT)
├── public/
│   ├── index.html     # Homepage
│   ├── propiedades.html
│   ├── propiedad.html
│   ├── blog.html
│   ├── post.html
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── properties.js
│   │   ├── propiedad.js
│   │   ├── blog.js
│   │   └── post.js
│   ├── images/        # Imágenes (agrega hero-bg.jpg y about.jpg)
│   └── admin/
│       ├── index.html # Panel de administración
│       └── js/admin.js
└── render.yaml        # Config deploy en Render
```

## Deploy en GitHub + Render

### 1. GitHub
```bash
cd monarka-group
git init
git add .
git commit -m "Initial commit - MONARKA GROUP website"
git remote add origin https://github.com/TU_USUARIO/monarka-group.git
git push -u origin main
```

### 2. Render
1. Ve a [render.com](https://render.com) y crea una cuenta
2. New → Web Service → conecta tu repo de GitHub
3. El `render.yaml` se detecta automáticamente
4. Haz clic en **Deploy**

## Imágenes recomendadas
Agrega en `public/images/`:
- `hero-bg.jpg` — foto de edificio/ciudad para el hero
- `about.jpg` — foto de oficina o edificio para "Quiénes Somos"
