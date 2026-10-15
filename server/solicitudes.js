/** Error controlado: se puede mostrar su mensaje al visitante. */
export class ErrorValidacion extends Error {}

/**
 * No confiamos en el navegador: cualquier persona puede llamar la API directamente.
 * Esta clase selecciona los campos permitidos, limita tamaños y normaliza el teléfono.
 */
export class ValidadorSolicitud {
  validar(datos) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new ErrorValidacion('Envía un objeto JSON válido.');
    }
    const texto = (campo, minimo, maximo) => {
      if (typeof datos[campo] !== 'string') throw new ErrorValidacion(`Revisa el campo ${campo}.`);
      const valor = datos[campo].trim();
      if (valor.length < minimo || valor.length > maximo || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(valor)) {
        throw new ErrorValidacion(`Revisa el campo ${campo}: entre ${minimo} y ${maximo} caracteres.`);
      }
      return valor;
    };
    const id = texto('id', 36, 36);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new ErrorValidacion('El identificador no es válido. Recarga la página.');
    }
    if (datos.website) throw new ErrorValidacion('No se pudo aceptar el formulario.');
    if (datos.consentimiento !== true) throw new ErrorValidacion('Debes autorizar el contacto sobre tu solicitud.');
    const telefonoOriginal = texto('telefono', 7, 24);
    if (!/^[+\d() .-]+$/.test(telefonoOriginal)) throw new ErrorValidacion('Revisa el teléfono.');
    const telefono = telefonoOriginal.replace(/[^0-9]/g, '');
    if (!/^\d{7,15}$/.test(telefono)) throw new ErrorValidacion('El teléfono debe tener entre 7 y 15 dígitos.');
    const sector = texto('sector', 1, 30);
    const servicio = texto('servicio', 1, 30);
    if (!['turismo', 'comida', 'productos', 'servicios'].includes(sector)) throw new ErrorValidacion('Selecciona un sector válido.');
    if (!['presentacion', 'catalogo', 'administrable', 'orientacion'].includes(servicio)) throw new ErrorValidacion('Selecciona un servicio válido.');
    return {
      id, nombre: texto('nombre', 2, 80), negocio: texto('negocio', 2, 80), telefono,
      sector, servicio, mensaje: texto('mensaje', 0, 600),
      consentimiento: true, aviso_version: 'expoguaviare-v1'
    };
  }
}

/**
 * Repositorio: concentra el acceso a la base de datos en un solo lugar.
 * Usamos la API REST de Supabase con fetch nativo: no hace falta instalar su SDK.
 * La clave solo se lee en el servidor. Jamás importar este archivo desde public/.
 */
export class RepositorioSolicitudes {
  constructor(url, clave, clienteHttp = fetch) {
    if (!url || !clave) throw new Error('Falta configurar Supabase.');
    const base = new URL(url);
    if (base.protocol !== 'https:') throw new Error('Supabase requiere HTTPS.');
    this.url = `${base.origin}/rest/v1/solicitudes?on_conflict=id`;
    this.clave = clave;
    this.clienteHttp = clienteHttp; // Permite probar sin conexión real a Supabase.
  }

  async guardar(solicitud) {
    const respuesta = await this.clienteHttp(this.url, {
      method: 'POST',
      headers: {
        apikey: this.clave,
        // Las nuevas claves sb_secret NO son JWT: no van en Authorization.
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify(solicitud),
      signal: AbortSignal.timeout(8000)
    });
    if (!respuesta.ok) throw new Error('Supabase no confirmó la escritura.');
    // Un UUID repetido no inserta otra fila ni cambia una solicitud anterior.
    return solicitud.id;
  }
}
