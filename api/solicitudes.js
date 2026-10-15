import { ValidadorSolicitud, RepositorioSolicitudes, ErrorValidacion } from '../server/solicitudes.js';

/**
 * Vercel ejecuta esta función para /api/solicitudes.
 * Flujo: comprobar petición → validar → guardar → responder.
 * La fábrica permite inyectar un repositorio simulado en las pruebas.
 */
export function crearManejador(crearRepositorio = () => new RepositorioSolicitudes(
  process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY
)) {
  return async function manejador(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const responder = (estado, datos) => res.status(estado).json(datos);
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return responder(405, { error: 'Método no permitido.' });
    }
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
      return responder(415, { error: 'Utiliza contenido JSON.' });
    }
    // APP_ORIGIN es opcional. Añade una comprobación de origen para producción.
    // No es autenticación ni protección completa contra robots.
    if (process.env.APP_ORIGIN && req.headers.origin && req.headers.origin !== process.env.APP_ORIGIN) {
      return responder(403, { error: 'Origen no permitido.' });
    }
    try {
      // Vercel normalmente entrega req.body como objeto cuando recibe JSON.
      const cuerpo = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
      if (Buffer.byteLength(cuerpo, 'utf8') > 8192) return responder(413, { error: 'La solicitud es demasiado grande.' });
      let datos;
      try { datos = JSON.parse(cuerpo); }
      catch { return responder(400, { error: 'JSON no válido.' }); }
      const solicitud = new ValidadorSolicitud().validar(datos);
      const id = await crearRepositorio().guardar(solicitud);
      return responder(201, { id });
    } catch (error) {
      if (error instanceof ErrorValidacion) return responder(400, { error: error.message });
      // No devolvemos claves, SQL ni respuestas internas de Supabase al visitante.
      console.error('No se pudo registrar la solicitud:', error.name);
      return responder(503, { error: 'No pudimos confirmar el registro. Intenta nuevamente en unos momentos.' });
    }
  };
}
export default crearManejador();
