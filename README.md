# SENA · Articulación con la media · Expoguaviare

Sitio para presentar servicios de desarrollo web a negocios del Guaviare y registrar interesados. HTML, CSS, JavaScript orientado a objetos y PostgreSQL en Supabase. Preparado para Vercel. Sin React, sin compilación del frontend y sin dependencias de producción.

Incluye los nombres **Técnico en Programación de Software** y **Técnico en Sistemas Teleinformáticos**, y el logo suministrado por el instructor, sin modificar sus proporciones o colores.

## Empezar

1. Lee `docs/01_DESPLIEGUE.md`: configuración de Supabase y Vercel.
2. Ejecuta `npm test` con Node.js 22.
3. Sigue `docs/02_GUIA_APRENDICES.md` para desarrollar y sustentar el proyecto.
4. Completa las comprobaciones de `docs/03_PRUEBAS_Y_OPERACION.md` con tu proyecto real.

## Qué incluye

- Landing adaptable a celular, tableta y televisor.
- Servicios, cuatro ejemplos por sector, proceso, programas y preguntas frecuentes.
- Formulario con validación, autorización de contacto, estados de envío y recuperación ante errores.
- API que guarda solicitudes en Supabase; claves privadas solo en el servidor.
- UUID para evitar duplicar el mismo envío al reintentar sin cambiar los datos.
- Tabla SQL con restricciones y RLS; ningún visitante puede consultar los teléfonos.

Los ejemplos de turismo, gastronomía, productos y servicios son ficticios. Las ilustraciones SVG son recursos locales del proyecto. No hay pagos, reservas, chat, autenticación de visitantes ni panel propio; el instructor consulta los registros en Supabase. La oferta de sitios administrables es un servicio por acordar, no una función incluida en esta landing.

## Carpetas

- `public/index.html`: contenido y estructura accesible.
- `public/styles.css`: diseño y adaptación a pantallas pequeñas.
- `public/js/sectores.js`: información de los ejemplos.
- `public/js/app.js`: clases de galería, formulario y peticiones HTTP.
- `public/assets/`: ilustraciones y logo.
- `api/solicitudes.js`: punto de entrada de la función Vercel.
- `server/solicitudes.js`: clases de validación y repositorio.
- `supabase/01_esquema.sql`: tabla, restricciones y permisos.
- `tests/solicitudes.test.js`: pruebas automáticas del backend con datos ficticios.

**Recorrido de los datos:** navegador → POST `/api/solicitudes` → validación en Vercel → API REST de Supabase → PostgreSQL → confirmación al navegador.

No se incluyen credenciales. Las pruebas automáticas usan un sustituto de Supabase y no demuestran conexión real. La verificación final requiere configurar el proyecto y ejecutar una solicitud de prueba. Abrir `index.html` con doble clic no ejecuta la API; utiliza Vercel o `npm run dev`.
