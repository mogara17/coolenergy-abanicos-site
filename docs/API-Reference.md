# API Reference - Cool Energy Abanicos

Documentacion completa de los endpoints de la API.

---

## Tabla de Contenidos

1. [Informacion General](#informacion-general)
2. [Autenticacion](#autenticacion)
3. [Endpoints Publicos](#endpoints-publicos)
4. [Endpoints Protegidos](#endpoints-protegidos)
5. [Codigos de Error](#codigos-de-error)

---

## Informacion General

### Base URL

```
https://coolenergy-uy.up.railway.app
```

### Headers Comunes

| Header | Valor | Descripcion |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Para requests con body |
| `Authorization` | `Bearer <token>` | Para endpoints protegidos |

### Rate Limiting

| Tipo | Limite | Ventana |
|------|--------|---------|
| API General | 100 requests | 15 minutos |
| Autenticacion | 5 requests | 15 minutos |

---

## Autenticacion

### POST `/api/auth/login`

Autenticar como administrador y obtener token JWT.

**Rate Limit:** 5 requests / 15 minutos

**Request Body:**

```json
{
  "password": "string"
}
```

**Response Exitosa (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error (401):**

```json
{
  "success": false,
  "error": "Password incorrecto"
}
```

**Ejemplo cURL:**

```bash
curl -X POST https://tu-sitio.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "tu-password"}'
```

---

## Endpoints Publicos

### GET `/health`

Health check del servidor.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-01-16T12:00:00.000Z",
  "site": "Cool Energy Abanicos"
}
```

---

### GET `/api/config`

Obtener configuracion publica del sitio.

**Response (200):**

```json
{
  "success": true,
  "config": {
    "site": {
      "name": "Cool Energy Abanicos",
      "url": "https://...",
      "description": "Abanicos premium..."
    },
    "contact": {
      "whatsapp": "59895192300",
      "instagram": "coolenergy.uy",
      "email": "hola@coolenergy.uy"
    },
    "categories": {
      "list": ["xl-reflective", "xl-psicodelicos", "xl-glow", "xl-holographic", "l-electric", "l-dark", "m-glitter", "m-basic", "porta-abanico-xl-l", "porta-abanico-m"],
      "labels": {...}
    },
    "analytics": {
      "enabled": true,
      "endpoints": {...}
    }
  }
}
```

---

### GET `/api/images`

Listar imagenes de la galeria desde Cloudinary.

**Query Parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `category` | string | Filtrar por categoria (`all`, `xl-reflective`, `xl-psicodelicos`, `xl-glow`, `xl-holographic`, `l-electric`, `l-dark`, `m-glitter`, `m-basic`, `porta-abanico-xl-l`, `porta-abanico-m`) |

**Response (200):**

```json
{
  "success": true,
  "images": [
    {
      "public_id": "coolenergy/abanicos/xl-reflective/imagen1",
      "url": "https://res.cloudinary.com/.../imagen1.jpg",
      "thumbnail": "https://res.cloudinary.com/.../w_300,h_300/imagen1.jpg",
      "full": "https://res.cloudinary.com/.../w_1200/imagen1.jpg",
      "category": "xl-reflective",
      "created_at": "2026-01-15T10:30:00.000Z"
    }
  ],
  "source": "cloudinary"
}
```

**Ejemplo cURL:**

```bash
# Todas las imagenes
curl https://tu-sitio.railway.app/api/images

# Solo categoria rave-xl
curl https://tu-sitio.railway.app/api/images?category=rave-xl
```

---

### GET `/api/images/fallback`

Obtener imagenes de respaldo (cuando Cloudinary no esta disponible).

**Query Parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `category` | string | Filtrar por categoria |

**Response (200):**

```json
{
  "success": true,
  "images": [
    {
      "public_id": "fallback-001",
      "url": "https://raw.githubusercontent.com/.../imagen.jpg",
      "thumbnail": "https://raw.githubusercontent.com/.../imagen.jpg",
      "full": "https://raw.githubusercontent.com/.../imagen.jpg",
      "category": "xl-reflective",
      "source": "github-fallback"
    }
  ],
  "source": "fallback"
}
```

---

### POST `/api/analytics/pageview`

Registrar una visita de pagina.

**Request Body:**

```json
{
  "page": "/galeria",
  "referrer": "https://google.com",
  "sessionId": "uuid-session-id"
}
```

| Campo | Tipo | Requerido | Max Length |
|-------|------|-----------|------------|
| `page` | string | Si | 200 |
| `referrer` | string | No | 500 |
| `sessionId` | string | No | 50 |

**Response (200):**

```json
{
  "success": true
}
```

---

### POST `/api/analytics/event`

Registrar un evento personalizado.

**Request Body:**

```json
{
  "event": "category_click",
  "data": {
    "category": "rave-xl"
  }
}
```

| Campo | Tipo | Requerido | Max Length |
|-------|------|-----------|------------|
| `event` | string | Si | 100 |
| `data` | object | No | - |

**Response (200):**

```json
{
  "success": true
}
```

---

### GET `/api/content`

Obtener todo el contenido editable del sitio.

**Response (200):**

```json
{
  "success": true,
  "content": {
    "hero": {
      "titleStart": "Desmayate de la",
      "titleHighlight": "emocion",
      "titleEnd": "y no del calor",
      "tagline": "...",
      "ctaPrimaryText": "Ver catalogo",
      "ctaPrimaryHref": "#catalogo",
      "ctaSecondaryText": "Contactanos",
      "ctaSecondaryHref": "#contacto"
    },
    "categories": [...],
    "about": {...},
    "faq": [...],
    "contact": {...},
    "footer": {...},
    "gallery": {...}
  }
}
```

---

### GET `/api/content/:section`

Obtener una seccion especifica del contenido.

**URL Parameters:**

| Parametro | Valores Permitidos |
|-----------|-------------------|
| `section` | `hero`, `categories`, `about`, `faq`, `contact`, `footer`, `gallery` |

**Response (200):**

```json
{
  "success": true,
  "section": "hero",
  "data": {
    "titleStart": "Desmayate de la",
    "titleHighlight": "emocion",
    "titleEnd": "y no del calor",
    "tagline": "..."
  }
}
```

---

## Endpoints Protegidos

Todos los endpoints protegidos requieren el header `Authorization: Bearer <token>`.

### PUT `/api/content/:section`

Actualizar una seccion del contenido editable.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**URL Parameters:**

| Parametro | Valores Permitidos |
|-----------|-------------------|
| `section` | `hero`, `categories`, `about`, `faq`, `contact`, `footer`, `gallery` |

**Request Body:**

```json
{
  "data": {
    "titleStart": "Nuevo titulo",
    "titleHighlight": "destacado",
    "titleEnd": "final del titulo"
  }
}
```

El contenido de `data` varia segun la seccion. Se sanitiza automaticamente contra XSS.

**Response (200):**

```json
{
  "success": true,
  "message": "Contenido actualizado"
}
```

---

### GET `/api/stats`

Obtener estadisticas de imagenes por categoria.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "success": true,
  "stats": {
    "total": 45,
    "xl-reflective": 8,
    "xl-psicodelicos": 6,
    "xl-glow": 5,
    "xl-holographic": 4,
    "l-electric": 6,
    "l-dark": 5,
    "m-glitter": 4,
    "m-basic": 3,
    "porta-abanico-xl-l": 2,
    "porta-abanico-m": 2
  }
}
```

**Response Error (401):**

```json
{
  "success": false,
  "error": "Token requerido"
}
```

---

### GET `/api/analytics`

Obtener datos de analytics.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "success": true,
  "analytics": {
    "todayPageviews": 150,
    "uniqueSessions": 45,
    "pageviews": {
      "2026-01-16": {
        "/": 50,
        "/galeria": 30,
        "/nosotros": 20
      }
    },
    "recentEvents": [
      {
        "event": "category_click",
        "data": {"category": "rave-xl"},
        "timestamp": "2026-01-16T12:00:00.000Z"
      }
    ]
  }
}
```

---

### POST `/api/upload/signature`

Obtener firma para subir imagen a Cloudinary.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**Request Body:**

```json
{
  "category": "rave-xl"
}
```

| Campo | Tipo | Valores Permitidos |
|-------|------|-------------------|
| `category` | string | Cualquiera de las 10 categorias: `xl-reflective`, `xl-psicodelicos`, `xl-glow`, `xl-holographic`, `l-electric`, `l-dark`, `m-glitter`, `m-basic`, `porta-abanico-xl-l`, `porta-abanico-m` |

**Response (200):**

```json
{
  "signature": "a1b2c3d4e5f6...",
  "timestamp": 1705406400,
  "folder": "coolenergy/abanicos/xl-reflective",
  "api_key": "123456789012345",
  "cloud_name": "tu-cloud-name"
}
```

**Uso con Cloudinary:**

```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('signature', response.signature);
formData.append('timestamp', response.timestamp);
formData.append('folder', response.folder);
formData.append('api_key', response.api_key);

fetch(`https://api.cloudinary.com/v1_1/${response.cloud_name}/image/upload`, {
  method: 'POST',
  body: formData
});
```

---

### DELETE `/api/images/:publicId`

Eliminar una imagen de Cloudinary.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**URL Parameters:**

| Parametro | Descripcion |
|-----------|-------------|
| `publicId` | ID completo de la imagen (ej: `coolenergy/abanicos/xl-reflective/imagen1`) |

**Response (200):**

```json
{
  "success": true,
  "message": "Imagen eliminada"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "error": "ID de imagen invalido"
}
```

**Ejemplo cURL:**

```bash
curl -X DELETE https://tu-sitio.railway.app/api/images/coolenergy/abanicos/xl-reflective/imagen1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Codigos de Error

| Codigo | Descripcion |
|--------|-------------|
| 200 | Exito |
| 400 | Request invalido (parametros incorrectos) |
| 401 | No autenticado (token faltante) |
| 403 | Token invalido o expirado |
| 404 | Recurso no encontrado |
| 429 | Rate limit excedido |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible (Cloudinary no configurado) |

### Formato de Error

```json
{
  "success": false,
  "error": "Descripcion del error"
}
```

### Errores de Validacion

```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "msg": "Invalid value",
      "path": "page",
      "location": "body"
    }
  ]
}
```

---

## Flujos Comunes

### Subir Imagen

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Server
    participant CL as Cloudinary

    C->>S: POST /api/auth/login
    S->>C: {token: "..."}
    C->>S: POST /api/upload/signature (+ token)
    S->>C: {signature, timestamp, folder, api_key}
    C->>CL: POST /upload (+ firma + imagen)
    CL->>C: {secure_url: "..."}
    C->>S: GET /api/images (refresh)
    S->>C: Lista actualizada
```

### Eliminar Imagen

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Server
    participant CL as Cloudinary

    C->>S: DELETE /api/images/:id (+ token)
    S->>CL: destroy(publicId)
    CL->>S: {result: "ok"}
    S->>C: {success: true}
```

---

*Documentacion API - Cool Energy Abanicos - Febrero 2026*
