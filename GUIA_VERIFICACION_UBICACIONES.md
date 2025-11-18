# Guía de Verificación - Departamentos y Ciudades

## Paso 1: Verificar la configuración de la URL

1. Abre `src/app/services/ubicaciones.service.ts`
2. Verifica que la línea 32 tenga la URL correcta de tu API de ubicaciones:

```typescript
private baseUrl = 'http://localhost:8001'; // ← Ajusta esta URL
```

**Si tu API está en:**
- Mismo servidor, puerto diferente: `http://localhost:8001`
- Servidor remoto: `https://api-ubicaciones.tudominio.com`
- Mismo servidor, ruta diferente: `http://localhost:8000/ubicaciones` (y ajusta las rutas en los métodos)

## Paso 2: Verificar que tu API de ubicaciones esté corriendo

### Opción A: Probar en el navegador

Abre estas URLs en tu navegador (ajusta el puerto según tu configuración):

```
http://localhost:8001/departamentos/activos/
http://localhost:8001/ciudades/departamento/1/activas
```

**Deberías ver:**
- Una respuesta JSON con los datos
- Si ves un error 404 o CORS, hay un problema de configuración

### Opción B: Probar con Postman o curl

```bash
# Probar departamentos
curl http://localhost:8001/departamentos/activos/

# Probar ciudades de un departamento (reemplaza 1 con un ID real)
curl http://localhost:8001/ciudades/departamento/1/activas
```

## Paso 3: Verificar en la consola del navegador

1. Abre tu aplicación Angular en el navegador
2. Abre las **Herramientas de Desarrollador** (F12)
3. Ve a la pestaña **Console**
4. Navega a la página de **Usuarios**
5. Observa si hay errores en la consola

**Errores comunes:**

- `Failed to fetch` o `Network Error`:
  - La API no está corriendo
  - La URL está mal configurada
  - Problema de CORS

- `404 Not Found`:
  - El endpoint no existe en tu API
  - La ruta está mal escrita

- `CORS policy`:
  - Tu API necesita configurar CORS para permitir peticiones desde `http://localhost:4200`

## Paso 4: Verificar visualmente en el formulario

1. Ve a la página de **Gestión de Usuarios**
2. Haz clic en **"➕ Nuevo Usuario"** o edita un usuario existente
3. Verifica que veas:
   - ✅ Campo "Departamento" después del campo "Estado"
   - ✅ Campo "Ciudad" después del campo "Departamento"
   - ✅ El campo "Ciudad" está deshabilitado inicialmente

## Paso 5: Probar la funcionalidad completa

### Test 1: Cargar Departamentos

1. Al abrir el formulario, los departamentos deberían cargarse automáticamente
2. Abre la consola del navegador (F12 → Network)
3. Busca una petición a `/departamentos/activos/`
4. Verifica que:
   - ✅ La petición se hace correctamente
   - ✅ La respuesta tiene datos
   - ✅ El select de "Departamento" se llena con opciones

**Si no funciona:**
- Revisa la consola para errores
- Verifica que la URL en `ubicaciones.service.ts` sea correcta
- Verifica que tu API esté corriendo

### Test 2: Seleccionar Departamento y Cargar Ciudades

1. En el formulario, selecciona un departamento del dropdown
2. Observa:
   - ✅ El campo "Ciudad" se habilita
   - ✅ Aparece "Cargando ciudades..." brevemente
   - ✅ El select de "Ciudad" se llena con ciudades del departamento seleccionado

3. Abre la consola del navegador (F12 → Network)
4. Busca una petición a `/ciudades/departamento/{id}/activas`
5. Verifica que:
   - ✅ La petición se hace con el ID correcto del departamento
   - ✅ La respuesta tiene ciudades

**Si no funciona:**
- Verifica que el endpoint en tu API acepte el ID del departamento
- Revisa el formato de la respuesta (debe ser un array o `{ resultado: [...] }`)

### Test 3: Guardar Usuario con Ubicación

1. Llena el formulario de usuario:
   - Nombres, Apellidos, Email, etc.
   - Selecciona un **Departamento**
   - Selecciona una **Ciudad**
2. Haz clic en **"✅ Crear Usuario"** o **"💾 Guardar cambios"**
3. Abre la consola del navegador (F12 → Network)
4. Busca la petición POST/PUT a `/create_user` o `/update_user/{id}`
5. Verifica en el **Payload** (Request) que incluya:
   ```json
   {
     "nombres": "...",
     "apellidos": "...",
     "departamento_id": 1,
     "ciudad_id": 5,
     ...
   }
   ```

**Si no funciona:**
- Verifica que el backend acepte estos campos
- Revisa que los campos estén en el modelo del backend

### Test 4: Editar Usuario con Ubicación

1. Crea o edita un usuario que ya tenga `departamento_id` y `ciudad_id` guardados
2. Haz clic en **"✏️ Editar"** en un usuario
3. Verifica que:
   - ✅ El departamento se selecciona automáticamente
   - ✅ Las ciudades del departamento se cargan automáticamente
   - ✅ La ciudad se selecciona automáticamente

## Paso 6: Verificar en la Base de Datos

1. Conecta a tu base de datos
2. Ejecuta:

```sql
SELECT id, nombres, apellidos, departamento_id, ciudad_id 
FROM usuarios 
ORDER BY id DESC 
LIMIT 5;
```

3. Verifica que:
   - ✅ Los campos `departamento_id` y `ciudad_id` tengan valores (o NULL si no se seleccionaron)
   - ✅ Los IDs correspondan a departamentos/ciudades válidos en tu API externa

## Solución de Problemas Comunes

### Problema: "Failed to fetch" o Error de Red

**Causas posibles:**
- La API de ubicaciones no está corriendo
- La URL está mal configurada
- Problema de firewall o red

**Solución:**
1. Verifica que la API esté corriendo: `http://localhost:8001/departamentos/activos/`
2. Verifica la URL en `ubicaciones.service.ts`
3. Prueba la conexión con curl o Postman

### Problema: Error CORS

**Síntoma:**
```
Access to fetch at 'http://localhost:8001/...' from origin 'http://localhost:4200' 
has been blocked by CORS policy
```

**Solución:**
En tu API de ubicaciones (FastAPI), agrega:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # URL de tu frontend Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problema: Los departamentos no se cargan

**Verifica:**
1. ¿La petición se hace? (F12 → Network)
2. ¿La respuesta tiene el formato correcto?
3. ¿Hay errores en la consola?

**Formato esperado:**
```json
// Opción 1: Array directo
[{"id": 1, "nombre": "Antioquia"}, ...]

// Opción 2: Objeto con resultado
{"resultado": [{"id": 1, "nombre": "Antioquia"}, ...]}
```

### Problema: Las ciudades no se cargan al seleccionar departamento

**Verifica:**
1. ¿Se hace la petición con el ID correcto?
2. ¿El endpoint existe en tu API?
3. ¿La respuesta tiene el formato correcto?

**Endpoint esperado:**
```
GET /ciudades/departamento/{departamento_id}/activas
```

### Problema: Los campos no se guardan en el backend

**Verifica:**
1. ¿El payload incluye `departamento_id` y `ciudad_id`?
2. ¿El backend acepta estos campos en el modelo?
3. ¿Las columnas existen en la tabla de la base de datos?

**Ejecuta el script SQL si no lo has hecho:**
```sql
ALTER TABLE usuarios 
ADD COLUMN departamento_id INT NULL,
ADD COLUMN ciudad_id INT NULL;
```

## Checklist de Verificación

- [ ] La URL de la API está configurada correctamente
- [ ] La API de ubicaciones está corriendo
- [ ] Los endpoints responden correctamente (probar en navegador/Postman)
- [ ] No hay errores de CORS
- [ ] Los campos aparecen en el formulario
- [ ] Los departamentos se cargan al abrir el formulario
- [ ] Las ciudades se cargan al seleccionar un departamento
- [ ] Los datos se guardan correctamente (verificar en BD)
- [ ] Los datos se cargan correctamente al editar

## Prueba Rápida (1 minuto)

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Navega a la página de Usuarios
4. Abre el formulario de nuevo usuario
5. Verifica que aparezca una petición a `/departamentos/activos/`
6. Selecciona un departamento
7. Verifica que aparezca una petición a `/ciudades/departamento/{id}/activas`
8. Si ambas peticiones aparecen y tienen respuesta 200, ¡funciona! ✅

## ¿Necesitas ayuda?

Si algo no funciona:
1. Revisa la consola del navegador (F12 → Console)
2. Revisa la pestaña Network para ver las peticiones HTTP
3. Verifica los logs de tu API de ubicaciones
4. Compara los endpoints esperados con los que tienes en tu API

