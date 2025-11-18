# Solución para Error de CORS

## El Problema

Tu API de ubicaciones en `http://localhost:3000` está bloqueando las peticiones desde `http://localhost:4200` (tu frontend Angular) porque no tiene configurado CORS.

## Solución: Configurar CORS en tu Backend

### Si tu backend es Express.js (Node.js)

1. **Instala el paquete `cors`** (si no lo tienes):

```bash
npm install cors
```

2. **Configura CORS en tu archivo principal** (normalmente `app.js`, `server.js`, o `index.js`):

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:4200', // URL de tu frontend Angular
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// O si quieres permitir todas las peticiones (solo para desarrollo):
// app.use(cors());

// Tus rutas aquí
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/ciudades', ciudadRoutes);

// ... resto de tu código
```

### Si tu backend es FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # URL de tu frontend Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tus rutas aquí
app.include_router(departamento_router, prefix="/api/departamentos")
app.include_router(ciudad_router, prefix="/api/ciudades")
```

### Si tu backend es otro framework

**Spring Boot (Java):**
```java
@CrossOrigin(origins = "http://localhost:4200")
```

**Laravel (PHP):**
```php
// En config/cors.php
'allowed_origins' => ['http://localhost:4200'],
```

## Verificación Rápida

Después de configurar CORS:

1. **Reinicia tu servidor backend**
2. **Recarga la página en el navegador** (Ctrl+F5 o Cmd+Shift+R)
3. **Abre la consola del navegador** (F12)
4. **Verifica que ya no aparezca el error de CORS**

## Solución Temporal (Solo para Desarrollo)

Si necesitas una solución rápida solo para desarrollo, puedes usar un proxy en Angular. Pero **la mejor solución es configurar CORS en el backend**.

### Opción: Proxy en Angular (Solo Desarrollo)

Crea un archivo `proxy.conf.json` en la raíz de tu proyecto:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Luego modifica `angular.json` o ejecuta:

```bash
ng serve --proxy-config proxy.conf.json
```

Y cambia la URL base en `ubicaciones.service.ts` a:

```typescript
private baseUrl = ''; // Vacío porque usará el proxy
```

Pero **recomiendo configurar CORS en el backend** en lugar de usar proxy.

## ¿Qué es CORS?

CORS (Cross-Origin Resource Sharing) es una política de seguridad del navegador que bloquea peticiones entre diferentes orígenes (diferentes puertos, dominios o protocolos) a menos que el servidor explícitamente lo permita.

En tu caso:
- **Origen del frontend**: `http://localhost:4200`
- **Origen del backend**: `http://localhost:3000`
- Son diferentes orígenes → Necesitas CORS

