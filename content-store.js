/**
 * Content Store - Manage site content as JSON
 * Loads/saves to data/content.json with defaults from hardcoded content
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'content.json');

const VALID_SECTIONS = ['hero', 'categories', 'about', 'faq', 'contact', 'footer', 'gallery'];

const DEFAULT_CONTENT = {
  hero: {
    title: 'Desmayate de la',
    titleHighlight: 'emocion',
    titleEnd: 'y no del calor',
    tagline: 'Abanicos premium para festivales, raves y la vida. Bambu, nylon, diseños unicos. Tu energia, tu estilo.',
    ctaPrimary: { text: 'Ver Abanicos', href: '#galeria' },
    ctaSecondary: { text: 'Contactar', href: 'https://wa.me/59895192300' }
  },

  categories: [
    { id: 'xl-reflective', name: 'XL Reflective', description: '66cm de reflejo puro. Brillan con cada flash de luz.', tag: '66cm - Bambu' },
    { id: 'xl-psicodelicos', name: 'XL Psicodélicos', description: '66cm de viaje visual. Diseños que explotan de color.', tag: '66cm - Bambu' },
    { id: 'xl-glow', name: 'XL Glow', description: '66cm que brillan en la oscuridad. Hechos para la noche.', tag: '66cm - Bambu' },
    { id: 'xl-holographic', name: 'XL Holographic', description: '66cm de efecto holográfico. Cambian con cada ángulo.', tag: '66cm - Bambu' },
    { id: 'l-electric', name: 'L Electric', description: '50cm de energía vibrante. Colores que electrifican.', tag: '50cm - Bambu' },
    { id: 'l-dark', name: 'L Dark', description: '50cm de estilo oscuro. Elegancia underground.', tag: '50cm - Bambu' },
    { id: 'm-glitter', name: 'M Glitter', description: '40cm con brillo sutil. Tu compañero diario con destellos.', tag: '40cm - Madera' },
    { id: 'm-basic', name: 'M Basic', description: '40cm de estilo limpio. Simple, elegante, esencial.', tag: '40cm - Madera' },
    { id: 'porta-abanico-xl-l', name: 'Porta Abanico XL/L', description: 'Protege tu abanico grande. Llévalo a todos lados.', tag: 'Accesorio' },
    { id: 'porta-abanico-m', name: 'Porta Abanico M', description: 'Protege tu abanico mediano. Compacto y práctico.', tag: 'Accesorio' }
  ],

  about: {
    title: 'Hechos con amor',
    titleHighlight: 'rave',
    paragraphs: [
      'Cool Energy nacio de la pasion por la musica electronica y la necesidad de mantenerse fresco en la pista. Cada abanico es mas que un accesorio, es una declaracion de estilo.',
      'Trabajamos con bambu de alta calidad y nylon resistente para que tu abanico aguante tantas noches como vos. Y si queres algo unico, hacemos personalizados dibujados a mano.'
    ],
    image: 'images/5b91cf4c597a5e5cdce439d470836771.jpg',
    badges: ['Hechos en Uruguay', 'Bambu de calidad', 'Diseños exclusivos', 'Super resistentes']
  },

  faq: [
    {
      question: 'Como compro un abanico para fiestas o raves?',
      answer: 'Escribinos por WhatsApp al <a href="https://wa.me/59895192300">+598 95 192 300</a>. Te mostramos las opciones disponibles, te asesoramos segun tu estilo y coordinamos el pago y la entrega. Aceptamos Mercado Pago, transferencia y efectivo.'
    },
    {
      question: 'Hacen envios a todo Uruguay?',
      answer: 'Si, enviamos a todo el pais. Tambien podes retirar gratis en nuestro punto de pickup: <a href="https://maps.app.goo.gl/FFoHeHtXo3TPgDqo6" target="_blank">La Minga, 18 de julio 1070, Local 02, Galeria London, Montevideo</a>.'
    },
    {
      question: 'Puedo pedir un abanico personalizado con mi propio diseno?',
      answer: 'Si! Hacemos abanicos personalizados dibujados a mano sobre base negra en talle XL (66cm) o L (50cm). El costo extra minimo es de $600 sobre el precio base. Contactanos por <a href="https://wa.me/59895192300">WhatsApp</a> con tu idea y te hacemos un boceto.'
    },
    {
      question: 'De que material son los abanicos y cuanto duran?',
      answer: 'Los abanicos XL y L tienen varillas de bambu y tela de nylon resistente. Los M tienen varillas de madera y tela de nylon. Todos estan hechos para ser duraderos y resistir muchas fiestas, raves y festivales.'
    },
    {
      question: 'Que abanico me conviene para un rave o festival?',
      answer: 'Los XL de 66cm son los mas populares para raves y festivales. Los Reflective brillan con el flash de las fotos, los Glow brillan en la oscuridad, los Holographic cambian de color, y los Psicodelicos tienen los disenos mas coloridos. Si preferis algo mas compacto, los L de 50cm tambien son geniales.'
    }
  ],

  contact: {
    title: '¿Listo para tu',
    titleHighlight: 'abanico',
    titleEnd: '?',
    subtitle: 'Escribinos por WhatsApp y te ayudamos a elegir el perfecto para vos.',
    phone: '095 192 300',
    instagram: { handle: '@coolenergy.uy_abanicos', url: 'https://www.instagram.com/coolenergy.uy_abanicos' },
    whatsappNumber: '59895192300',
    pickup: {
      name: 'La Minga',
      address: '18 de julio 1070, Local 02, Galeria London',
      city: 'Montevideo',
      mapUrl: 'https://maps.app.goo.gl/FFoHeHtXo3TPgDqo6'
    }
  },

  footer: {
    description: 'Abanicos premium para la escena electronica uruguaya. Hechos con amor desde 2020.',
    paymentMethods: ['Mercado Pago', 'Transferencia', 'Efectivo']
  },

  gallery: {
    imageDescriptions: {}
  }
};

// Required keys per section for validation
const REQUIRED_KEYS = {
  hero: ['title', 'titleHighlight', 'titleEnd', 'tagline'],
  categories: null, // array validation
  about: ['title', 'titleHighlight', 'paragraphs', 'badges'],
  faq: null, // array validation
  contact: ['title', 'titleHighlight', 'subtitle', 'phone', 'whatsappNumber'],
  footer: ['description', 'paymentMethods'],
  gallery: ['imageDescriptions']
};

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Merge with defaults to fill any missing sections
      return { ...DEFAULT_CONTENT, ...data };
    }
  } catch (err) {
    console.error('Error loading content.json, using defaults:', err.message);
  }
  // First run or error: save defaults and return them
  save(DEFAULT_CONTENT);
  return { ...DEFAULT_CONTENT };
}

function save(content) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving content.json:', err.message);
    throw err;
  }
}

function getAll() {
  return load();
}

function getSection(key) {
  if (!VALID_SECTIONS.includes(key)) {
    return null;
  }
  const content = load();
  return content[key] || DEFAULT_CONTENT[key];
}

function updateSection(key, data) {
  if (!VALID_SECTIONS.includes(key)) {
    return { success: false, error: 'Seccion invalida' };
  }

  // Validate
  const error = validateSection(key, data);
  if (error) {
    return { success: false, error };
  }

  const content = load();
  content[key] = data;
  save(content);
  return { success: true };
}

function validateSection(key, data) {
  if (data === null || data === undefined) {
    return 'Datos requeridos';
  }

  // Array sections
  if (key === 'categories' || key === 'faq') {
    if (!Array.isArray(data)) {
      return `${key} debe ser un array`;
    }
    if (key === 'categories') {
      for (const item of data) {
        if (!item.id || !item.name) return 'Cada categoria requiere id y name';
      }
    }
    if (key === 'faq') {
      for (const item of data) {
        if (!item.question || !item.answer) return 'Cada FAQ requiere question y answer';
      }
    }
    return null;
  }

  // Object sections
  if (typeof data !== 'object' || Array.isArray(data)) {
    return `${key} debe ser un objeto`;
  }

  const required = REQUIRED_KEYS[key];
  if (required) {
    for (const k of required) {
      if (!(k in data)) {
        return `Campo requerido: ${k}`;
      }
    }
  }

  return null;
}

// Simple XSS sanitizer - strips script tags and event handlers
function sanitize(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = sanitize(v);
    }
    return result;
  }
  return obj;
}

module.exports = {
  VALID_SECTIONS,
  DEFAULT_CONTENT,
  load,
  save,
  getAll,
  getSection,
  updateSection,
  sanitize
};
