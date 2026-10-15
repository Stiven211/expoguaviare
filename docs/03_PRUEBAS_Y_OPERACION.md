# Verificación y operación del stand

## Pruebas automáticas incluidas

Ejecutar `npm test`. No requieren claves ni conexión externa. Cubren normalización, campos no permitidos, consentimiento, límites, UUID, tipo de contenido, métodos HTTP, manejo de errores, origen opcional y petición REST. El repositorio es simulado. La prueba del encabezado de duplicados no verifica por sí sola el comportamiento real de PostgreSQL.

## Comprobación con el despliegue real

1. En un celular y en el computador del stand: recorrer secciones, comprobar que no hay desplazamiento horizontal ni elementos cortados. Revisar zoom del navegador al 200 %.
2. Usar Tab para recorrer enlaces y formulario; usar flechas, Inicio y Fin en las pestañas. Confirmar foco visible y que el mensaje de estado se puede leer.
3. Cambiar los cuatro sectores y seleccionar una opción de servicio. Revisar que las opciones elegidas llegan al formulario.
4. Enviar una solicitud ficticia y comprobar exactamente una fila, con hora generada en la base, teléfono normalizado y versión del aviso.
5. Intentar enviar sin consentimiento, con teléfono inválido y con campos en blanco. El servidor debe rechazar incluso si se omite la validación del navegador.
6. En herramientas de desarrollo, observar que la petición va a `/api/solicitudes` y no contiene la clave de Supabase. La respuesta exitosa contiene solo el ID.
7. Repetir la misma petición POST con su UUID: la cantidad de filas no aumenta. Cambiar UUID inicia otra solicitud. No modificar datos reales para estas pruebas.
8. Abrir `/api/solicitudes` directamente: debe devolver 405; nunca una lista de personas.
9. Con una clave publishable de prueba, comprobar que una consulta REST a `solicitudes` no entrega filas/datos y que un INSERT está denegado. No usar la clave secreta para esta comprobación. Verificar RLS y permisos en Supabase.
10. Desconectar internet antes de enviar: debe aparecer un error sin borrar los campos ni un falso éxito. Reconectar y reintentar. Si el servidor alcanzó a guardar antes del corte, el UUID evita duplicar el reintento idéntico.
11. Revisar que los registros de errores no muestran nombres, teléfonos ni claves. Borrar las filas ficticias al finalizar.

No se ha ejecutado esta comprobación real porque el paquete no dispone de tus credenciales, proyecto de Supabase ni despliegue Vercel. Tampoco sustituye una auditoría de seguridad.

## Durante la feria

- Mantener la página pública en el televisor y administrar datos en otra ventana que no se proyecte.
- No mostrar Table Editor con teléfonos de otras personas al público.
- Contar con conectividad principal y una alternativa. La galería cargada funciona sin nuevas peticiones; el formulario necesita internet.
- Desactivar suspensión de pantalla durante la demostración y volver a configurarla al terminar.
- Confirmar quién hace seguimiento. El formulario no manda WhatsApp, correo ni notificaciones automáticas.
- Si hay una falla, conversar con el visitante y explicar el estado real; no presentar como guardado un registro que no se confirmó.

## Mantenimiento mínimo

El instructor gestiona el acceso a Supabase y Vercel. Revisar solicitudes desde Table Editor, restringir miembros del proyecto y retirar accesos innecesarios. Acordar responsable, plazo de conservación y canal de atención del aviso. Eliminar registros cuando ya no sean necesarios; no incorporar teléfonos al repositorio ni a ejemplos públicos.

Si una clave se expone, revocarla/rotarla en Supabase, actualizarla en Vercel y desplegar de nuevo. La disponibilidad y los límites dependen de los planes elegidos: no se promete alojamiento gratuito permanente ni protección completa contra abuso.

## Cambios comunes

- Textos y nombres: `public/index.html`.
- Colores y tamaños: `public/styles.css`.
- Ejemplos: `public/js/sectores.js`.
- Nuevos campos: actualizar HTML, validador, SQL y pruebas juntos. No basta con añadir un input.
- Otro sector o servicio: actualizar opciones HTML, listas permitidas del validador y restricciones de PostgreSQL.
- Un panel con acceso: es un alcance adicional; requiere autenticación, permisos y pruebas. No agregar un listado público a esta API.
