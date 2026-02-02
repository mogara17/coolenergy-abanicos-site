const express = require('express');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Cargar configuracion centralizada
const config = require('./config');

const app = express();

// Trust proxy (required for Railway, Vercel, etc. - fixes rate limiter)
app.set('trust proxy', 1);

// Security: Helmet for HTTP headers (relaxed CSP for Cloudinary)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Performance: Compression
app.use(compression());

// Security: Rate limiting (usando config)
const apiLimiter = rateLimit({
  windowMs: config.rateLimiting.api.windowMs,
  max: config.rateLimiting.api.max,
  message: config.rateLimiting.api.message,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: config.rateLimiting.auth.windowMs,
  max: config.rateLimiting.auth.max,
  message: config.rateLimiting.auth.message
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10kb' }));

// Cloudinary config (usando config)
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
} else {
  console.warn('WARNING: Cloudinary credentials not configured. Set environment variables.');
}

// LLM discovery: serve llms.txt at .well-known path
app.get('/.well-known/llms.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'llms.txt'));
});

// Health check endpoint
app.get(config.server.healthPath, (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    site: config.site.name
  });
});

// API: Site config (public - para el frontend)
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      site: {
        name: config.site.name,
        url: config.site.url,
        description: config.site.description
      },
      contact: config.contact,
      categories: config.categories,
      analytics: {
        enabled: config.analytics.enabled,
        endpoints: config.analytics.endpoints
      }
    }
  });
});

// Performance: Static files with caching headers
app.use(express.static(path.join(__dirname), {
  maxAge: config.cache.staticFiles,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf)$/)) {
      res.setHeader('Cache-Control', `public, max-age=${7 * 24 * 60 * 60}`);
    }
    if (filePath.match(/\.(css|js)$/)) {
      res.setHeader('Cache-Control', `public, max-age=${24 * 60 * 60}`);
    }
  }
}));

// ================== ANALYTICS ==================

const analytics = {
  pageviews: {},
  events: [],
  sessions: new Set()
};

app.post(config.analytics.endpoints.pageview, [
  body('page').isString().trim().escape().isLength({ max: 200 }),
  body('referrer').optional().isString().trim().escape().isLength({ max: 500 }),
  body('sessionId').optional().isString().trim().isLength({ max: 50 })
], (req, res) => {
  if (!config.analytics.enabled) {
    return res.json({ success: true, message: 'Analytics disabled' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { page, referrer, sessionId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  if (!analytics.pageviews[today]) {
    analytics.pageviews[today] = {};
  }
  if (!analytics.pageviews[today][page]) {
    analytics.pageviews[today][page] = 0;
  }
  analytics.pageviews[today][page]++;

  if (sessionId) {
    analytics.sessions.add(sessionId);
  }

  res.json({ success: true });
});

app.post(config.analytics.endpoints.event, [
  body('event').isString().trim().escape().isLength({ max: 100 }),
  body('data').optional().isObject()
], (req, res) => {
  if (!config.analytics.enabled) {
    return res.json({ success: true, message: 'Analytics disabled' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { event, data } = req.body;
  analytics.events.push({
    event,
    data: data || {},
    timestamp: new Date().toISOString()
  });

  if (analytics.events.length > config.analytics.maxEvents) {
    analytics.events = analytics.events.slice(-config.analytics.maxEvents);
  }

  res.json({ success: true });
});

// ================== AUTHENTICATION ==================

app.post('/api/auth/login', [
  body('password').isString().isLength({ min: 1, max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Password requerido' });
  }

  const { password } = req.body;

  try {
    const isValid = await bcrypt.compare(password, config.auth.adminPasswordHash);

    if (isValid) {
      const token = jwt.sign({ role: 'admin' }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiresIn
      });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, error: 'Password incorrecto' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error de autenticacion' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  jwt.verify(token, config.auth.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token invalido o expirado' });
    }
    req.user = user;
    next();
  });
}

// ================== CLOUDINARY API ==================

function requireCloudinary(req, res, next) {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    return res.status(503).json({
      success: false,
      error: 'Cloudinary no configurado. Configura las variables de entorno.'
    });
  }
  next();
}

app.get('/api/images', requireCloudinary, async (req, res) => {
  try {
    const { category } = req.query;

    let options = {
      type: 'upload',
      prefix: config.cloudinary.baseFolder,
      max_results: 500
    };

    if (category && category !== 'all') {
      if (!config.categories.list.includes(category)) {
        return res.status(400).json({ success: false, error: 'Categoria invalida' });
      }
      options.prefix = `${config.cloudinary.baseFolder}/${category}`;
    }

    const result = await cloudinary.api.resources(options);

    const images = result.resources
      .map(img => ({
        public_id: img.public_id,
        url: img.secure_url,
        thumbnail: cloudinary.url(img.public_id, {
          width: config.cloudinary.thumbnailSize.width,
          height: config.cloudinary.thumbnailSize.height,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true
        }),
        full: cloudinary.url(img.public_id, {
          width: config.cloudinary.fullSize.width,
          quality: 'auto',
          fetch_format: 'auto',
          secure: true
        }),
        category: extractCategory(img.public_id),
        created_at: img.created_at
      }))
      .filter(img => config.categories.list.includes(img.category));

    res.json({ success: true, images, source: 'cloudinary' });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ success: false, error: 'Error listando imagenes' });
  }
});

// API: Fallback images (when Cloudinary is unavailable)
app.get('/api/images/fallback', (req, res) => {
  try {
    const fallbackData = require('./fallback-images.json');
    const { category } = req.query;

    if (!fallbackData.enabled) {
      return res.json({ success: true, images: [], source: 'fallback-disabled' });
    }

    const baseUrl = `https://raw.githubusercontent.com/${fallbackData.githubRepo}/${fallbackData.branch}/${fallbackData.basePath}`;

    let images = fallbackData.images.map(img => ({
      public_id: img.id,
      url: `${baseUrl}/${img.filename}`,
      thumbnail: `${baseUrl}/${img.filename}`,
      full: `${baseUrl}/${img.filename}`,
      category: img.category,
      source: 'github-fallback'
    }));

    // Filter by category if specified
    if (category && category !== 'all') {
      if (!config.categories.list.includes(category)) {
        return res.status(400).json({ success: false, error: 'Categoria invalida' });
      }
      images = images.filter(img => img.category === category);
    }

    res.json({ success: true, images, source: 'fallback' });
  } catch (error) {
    console.error('Error loading fallback images:', error);
    res.status(500).json({ success: false, error: 'Error cargando imagenes de respaldo' });
  }
});

app.post('/api/upload/signature', authenticateToken, requireCloudinary, [
  body('category').isString().isIn(config.categories.list)
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Categoria invalida' });
  }

  const { category } = req.body;
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `${config.cloudinary.baseFolder}/${category}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    config.cloudinary.apiSecret
  );

  res.json({
    signature,
    timestamp,
    folder,
    api_key: config.cloudinary.apiKey,
    cloud_name: config.cloudinary.cloudName
  });
});

app.delete('/api/images/:publicId(*)', authenticateToken, requireCloudinary, async (req, res) => {
  try {
    const publicId = req.params.publicId;

    if (!publicId.startsWith(config.cloudinary.baseFolder + '/')) {
      return res.status(400).json({ success: false, error: 'ID de imagen invalido' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ success: true, message: 'Imagen eliminada' });
    } else {
      res.status(400).json({ success: false, error: 'No se pudo eliminar la imagen' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, error: 'Error eliminando imagen' });
  }
});

app.get('/api/stats', authenticateToken, requireCloudinary, async (req, res) => {
  try {
    const stats = { total: 0 };

    for (const cat of config.categories.list) {
      try {
        const result = await cloudinary.api.resources({
          type: 'upload',
          prefix: `${config.cloudinary.baseFolder}/${cat}`,
          max_results: 500
        });
        stats[cat] = result.resources.length;
        stats.total += result.resources.length;
      } catch (e) {
        stats[cat] = 0;
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo estadisticas' });
  }
});

app.get('/api/analytics', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayViews = analytics.pageviews[today] || {};

  let totalToday = 0;
  Object.values(todayViews).forEach(v => totalToday += v);

  res.json({
    success: true,
    analytics: {
      todayPageviews: totalToday,
      uniqueSessions: analytics.sessions.size,
      pageviews: analytics.pageviews,
      recentEvents: analytics.events.slice(-50)
    }
  });
});

function extractCategory(publicId) {
  const parts = publicId.split('/');
  if (parts.length >= 3) {
    return parts[2];
  }
  return 'sin-categoria';
}

// Admin route (usando config.server.adminPath)
app.get(config.server.adminPath, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: ${config.server.adminPath}`);
  console.log(`Cloudinary configured: ${!!config.cloudinary.cloudName}`);
  console.log(`Site URL: ${config.site.url}`);
});
