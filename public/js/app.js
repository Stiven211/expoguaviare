import { sectors, sectorNames } from './sectores.js';

/**
 * Clase 1: controla solamente la galería de ejemplos.
 * Estado: sector seleccionado. Métodos: escuchar eventos y mostrar un sector.
 * No consulta Supabase: sus datos son ejemplos locales.
 */
class GaleriaSectores {
  constructor() {
    this.sector = 'turismo';
    this.botones = [...document.querySelectorAll('[data-sector]')];
    this.botones.forEach((boton, indice) => {
      boton.addEventListener('click', () => this.mostrar(boton.dataset.sector));
      // Las pestañas también funcionan con teclado (patrón accesible).
      boton.addEventListener('keydown', (evento) => {
        const destinos = { ArrowRight: (indice + 1) % 4, ArrowLeft: (indice + 3) % 4, Home: 0, End: 3 };
        if (!(evento.key in destinos)) return;
        evento.preventDefault();
        const siguiente = this.botones[destinos[evento.key]];
        this.mostrar(siguiente.dataset.sector);
        siguiente.focus();
      });
    });
    document.querySelector('#use-sector').addEventListener('click', () => {
      document.querySelector('#sector').value = this.sector;
      document.querySelector('#negocio').focus();
    });
  }

  mostrar(clave) {
    const datos = sectors[clave];
    if (!datos) return;
    this.sector = clave;
    this.botones.forEach((boton) => {
      const activo = boton.dataset.sector === clave;
      boton.setAttribute('aria-selected', String(activo));
      boton.tabIndex = activo ? 0 : -1;
    });
    document.querySelector('#sector-panel').setAttribute('aria-labelledby', `tab-${clave}`);
    const imagen = document.querySelector('#sector-image');
    imagen.src = `assets/${datos.image}`;
    imagen.alt = datos.alt;
    const textos = {
      'sample-subtitle': datos.subtitle, 'sample-title': datos.title,
      'sector-number': sectorNames[clave], 'sector-title': datos.heading,
      'sector-desc': datos.description, 'sector-limit': datos.limit
    };
    // textContent trata el contenido como texto, nunca como HTML ejecutable.
    Object.entries(textos).forEach(([id, texto]) => {
      document.getElementById(id).textContent = texto;
    });
    document.querySelector('#sector-features').replaceChildren(...datos.features.map((texto) => {
      const elemento = document.createElement('li');
      elemento.textContent = texto;
      return elemento;
    }));
  }
}

/** Clase 2: conoce HTTP; no conoce botones, estilos ni campos del formulario. */
export class ServicioSolicitudes {
  async guardar(datos) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 15000);
    try {
      const respuesta = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
        signal: controlador.signal
      });
      const resultado = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(resultado.error || 'No pudimos guardar la solicitud. Intenta nuevamente.');
      return resultado;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new Error('No pudimos confirmar el envío. Revisa la conexión y vuelve a intentar; conservamos tu formulario.');
      }
      throw error;
    } finally {
      clearTimeout(temporizador);
    }
  }
}

/**
 * Clase 3: controla el formulario y utiliza un ServicioSolicitudes.
 * Esto es composición: un objeto usa a otro, sin herencia innecesaria.
 */
class FormularioSolicitud {
  constructor(servicio) {
    this.servicio = servicio;
    this.formulario = document.querySelector('#solicitud-form');
    this.boton = document.querySelector('#enviar');
    this.estado = document.querySelector('#form-status');
    this.enviando = false;
    this.ultimoContenido = null;
    this.id = crypto.randomUUID(); // Identifica UN intento lógico, incluso si hay reintento de red.
    this.formulario.addEventListener('submit', (evento) => this.enviar(evento));
    document.querySelectorAll('[data-service]').forEach((enlace) => {
      enlace.addEventListener('click', () => {
        this.formulario.elements.servicio.value = enlace.dataset.service;
      });
    });
  }

  informar(mensaje, error = false) {
    this.estado.textContent = mensaje;
    this.estado.dataset.error = String(error);
  }

  async enviar(evento) {
    evento.preventDefault();
    if (this.enviando || !this.formulario.reportValidity()) return;
    const campos = Object.fromEntries(new FormData(this.formulario));
    // Un reintento idéntico conserva el UUID; editar los datos inicia otra solicitud.
    const contenido = JSON.stringify(campos);
    if (this.ultimoContenido !== null && contenido !== this.ultimoContenido) this.id = crypto.randomUUID();
    this.ultimoContenido = contenido;
    const datos = { ...campos, id: this.id, consentimiento: campos.consentimiento === 'on' };
    // HTML no detecta cadenas formadas solo por espacios: añadimos esa comprobación.
    if (datos.nombre.trim().length < 2 || datos.negocio.trim().length < 2) {
      this.informar('Escribe el nombre de tu negocio y tu nombre, con al menos dos caracteres.', true);
      return;
    }
    this.enviando = true;
    this.boton.disabled = true;
    this.formulario.setAttribute('aria-busy', 'true');
    this.informar('Guardando tu solicitud…');
    try {
      const resultado = await this.servicio.guardar(datos);
      this.formulario.reset();
      this.id = crypto.randomUUID();
      this.informar(`Solicitud registrada. Referencia: ${resultado.id}. El equipo podrá revisar tu idea.`);
      this.estado.focus();
    } catch (error) {
      this.informar(error.message, true); // No borra campos si el envío falla.
    } finally {
      this.enviando = false;
      this.boton.disabled = false;
      this.formulario.removeAttribute('aria-busy');
    }
  }
}

// Punto de entrada: creamos los objetos después de cargar el HTML (type="module").
new GaleriaSectores();
new FormularioSolicitud(new ServicioSolicitudes());
