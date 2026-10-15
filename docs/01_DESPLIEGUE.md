# Desplegar paso a paso

## 1. Crear la base de datos

1. Crea un proyecto en Supabase y guarda su contraseña de base de datos en un lugar privado. Esa contraseña NO es la clave que usa este código.
2. Abre **SQL Editor**, pega `supabase/01_esquema.sql` y ejecútalo una sola vez. Se crea `public.solicitudes`. Si ya existe, no borres datos: revisa antes el esquema. El script está pensado para un proyecto nuevo.
3. Comprueba en **Table Editor** que existe la tabla y que RLS está activada. No agregues políticas de lectura pública.
4. En la configuración del proyecto copia la **Project URL**. En **API Keys** crea/copia una **secret key**, que comienza por `sb_secret_`. El nombre exacto de las secciones puede variar.
5. La tabla debe estar disponible para la Data API del esquema `public` (configuración normal). No publiques la clave ni capturas que la muestren.

Usamos una clave secreta del servidor. La clave publishable/anon no sirve para este repositorio porque los visitantes no tienen permisos. Las claves `sb_secret_` se envían como encabezado `apikey`, no como token Bearer. La clave secreta tiene privilegios amplios: el control de acceso de esta solución está en la API y en no exponerla.

## 2. Subir el código a GitHub

Descomprime el ZIP. Abre la carpeta `sena-expoguaviare`, la que contiene `package.json`, en tu editor. Crea un repositorio y sube su contenido. `public`, `api` y `server` deben quedar en esa raíz; no importes únicamente `public`.

`.gitignore` excluye `.env`, `.env.local` y `.vercel`. Nunca pegues la clave dentro de un archivo JS/HTML. `.env.example` tiene valores ficticios y sí se puede subir.

## 3. Importar en Vercel

1. Importa el repositorio como un proyecto nuevo.
2. Framework preset: **Other**. Root Directory: la carpeta que contiene `package.json`.
3. No necesita Build Command. Output Directory: `public` (ya está en `vercel.json`). Node.js: **22.x**, consistente con `package.json`.
4. Antes de desplegar, agrega variables de entorno:

| Nombre | Valor |
| --- | --- |
| `SUPABASE_URL` | Project URL, por ejemplo `https://xxxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | Clave privada `sb_secret_…` |
| `APP_ORIGIN` | Opcional: URL exacta de producción, sin `/` final |

Para empezar puedes dejar `APP_ORIGIN` sin definir. Cuando conozcas tu URL, configúrala en **Production** y vuelve a desplegar. Si la asignas a Preview con la URL de producción, el formulario de las previews será rechazado; deja esa variable sin definir en Preview o usa su origen exacto. La comprobación de origen es una barrera auxiliar, no autentica a los visitantes ni detiene llamadas directas.

5. Despliega. Vercel sirve `public` y ejecuta el archivo de `api` como función.
6. Si cambias variables, realiza un **nuevo despliegue** para aplicarlas.
7. Abre la URL HTTPS, registra datos ficticios y busca la fila en Supabase. Borra esa fila de prueba después.

## 4. Trabajar localmente

Necesitas Node.js 22 y una cuenta Vercel para el emulador. Desde la carpeta del proyecto:

```bash
npm test
npm run dev
```

`npm run dev` ejecuta `npx vercel dev`; puede pedir instalar la CLI e iniciar sesión para vincular el proyecto. Usa un proyecto/base de pruebas. Para disponer de variables locales, copia `.env.example` a `.env.local` y rellena los valores, o utiliza `npx vercel env pull .env.local` después de vincular el proyecto. Reinicia el emulador al cambiar variables. No definas `APP_ORIGIN` con la URL de producción durante el trabajo local.

Para ver solamente el diseño puedes servir `public` con un servidor estático, pero el formulario no guardará sin la función de Vercel. No simules un mensaje de éxito para ocultar esa ausencia.

## 5. Antes de recibir datos reales

En `public/index.html`, completa el aviso de datos con el responsable designado del proyecto, un canal real de contacto después de la feria y el plazo concreto de conservación que acuerden. No se han inventado nombre, correo ni política institucional. El texto incluido es una base operativa para el proyecto, no una afirmación de aprobación institucional. Si se cambia el contenido del aviso, actualiza su versión tanto en HTML como en el validador y la restricción SQL mediante una migración.

El logo se tomó del archivo suministrado. La propuesta debe revisarse con el instructor antes de usarla como comunicación institucional. La implementación no agrega escudos, certificaciones ni patrocinios.

## Solución de problemas

| Síntoma | Revisar |
| --- | --- |
| 404 en `/api/solicitudes` | Importaste toda la carpeta, no solo `public`; existe `api/solicitudes.js`. |
| GET devuelve 405 | Es correcto: la API solo acepta POST; no es un listado público. |
| 503 al enviar | Variables correctas, nuevo deploy tras cambiarlas, proyecto Supabase activo, tabla creada y Data API disponible. |
| 400 al enviar | Campos, teléfono, consentimiento y mensaje de validación. |
| 403 en Preview | `APP_ORIGIN` no coincide con el origen del navegador. |
| 415 | La petición debe usar `Content-Type: application/json`. |
| No se duplica una fila al reintentar | Es intencional: el UUID se conserva mientras no cambien los campos. |
| No llegan correos | No hay envío de correos; las solicitudes se consultan en Supabase. |

No desactives RLS para arreglar una conexión. Los detalles internos se revisan en las herramientas del proyecto, no se publican en el mensaje de error al visitante.

## Documentación oficial de referencia

- Vercel Node.js: https://vercel.com/docs/functions/runtimes/node-js
- Vercel funciones Node avanzadas: https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration
- Variables: https://vercel.com/docs/environment-variables
- Supabase claves: https://supabase.com/docs/guides/api/api-keys
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
