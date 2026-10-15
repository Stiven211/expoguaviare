import test from 'node:test';
import assert from 'node:assert/strict';
import { ValidadorSolicitud, RepositorioSolicitudes } from '../server/solicitudes.js';
import { crearManejador } from '../api/solicitudes.js';

const ejemplo = () => ({
  id: '11111111-1111-4111-8111-111111111111', nombre: ' Ana Pérez ',
  negocio: 'Mi negocio', telefono: '+57 (310) 123-4567', sector: 'comida',
  servicio: 'catalogo', mensaje: 'Quiero mostrar mi menú', consentimiento: true, website: ''
});

test('Normaliza campos y no permite que el visitante asigne datos internos', () => {
  const limpio = new ValidadorSolicitud().validar({ ...ejemplo(), creado_en: '2000-01-01', rol: 'admin' });
  assert.equal(limpio.nombre, 'Ana Pérez');
  assert.equal(limpio.telefono, '573101234567');
  assert.equal(limpio.aviso_version, 'expoguaviare-v1');
  assert.equal('rol' in limpio, false);
  assert.equal('creado_en' in limpio, false);
});
for (const [caso, cambios] of [
  ['nombre vacío', { nombre: '  ' }], ['sector desconocido', { sector: 'otro' }],
  ['sin autorización', { consentimiento: false }], ['autorización falsamente textual', { consentimiento: 'true' }],
  ['mensaje excesivo', { mensaje: 'a'.repeat(601) }], ['UUID inválido', { id: 'x'.repeat(36) }],
  ['teléfono inválido', { telefono: 'abcdefg' }], ['robot', { website: 'spam' }]
]) {
  test(`Rechaza ${caso}`, () => assert.throws(() => new ValidadorSolicitud().validar({ ...ejemplo(), ...cambios })));
}

test('Repositorio envía clave en apikey y pide ignorar duplicados', async () => {
  let llamada;
  const repo = new RepositorioSolicitudes('https://ejemplo.supabase.co', 'sb_secret_PRUEBA', async (url, opciones) => {
    llamada = { url, opciones }; return { ok: true };
  });
  assert.equal(await repo.guardar(ejemplo()), ejemplo().id);
  assert.match(llamada.url, /on_conflict=id$/);
  assert.equal(llamada.opciones.headers.apikey, 'sb_secret_PRUEBA');
  assert.equal(llamada.opciones.headers.Authorization, undefined);
  assert.match(llamada.opciones.headers.Prefer, /ignore-duplicates/);
});

test('Repositorio no considera exitosa una respuesta fallida de Supabase', async () => {
  const repo = new RepositorioSolicitudes('https://ejemplo.supabase.co', 'prueba', async () => ({ ok: false }));
  await assert.rejects(repo.guardar(ejemplo()));
});

// Simulamos la interfaz req/res de Vercel sin levantar un servidor ni usar datos reales.
async function llamar(cambios = {}, repositorio = { guardar: async (datos) => datos.id }) {
  const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: ejemplo(), ...cambios };
  const res = {
    headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(codigo) { this.codigo = codigo; return this; },
    json(datos) { this.datos = datos; return this; }
  };
  await crearManejador(() => repositorio)(req, res);
  return res;
}

test('API confirma guardado y no devuelve datos personales', async () => {
  const res = await llamar();
  assert.equal(res.codigo, 201);
  assert.deepEqual(res.datos, { id: ejemplo().id });
});
test('API no permite listar solicitudes mediante GET', async () => {
  const res = await llamar({ method: 'GET' });
  assert.equal(res.codigo, 405); assert.equal(res.headers.Allow, 'POST');
});
test('API rechaza tipo incorrecto, JSON roto y cuerpo excesivo', async () => {
  assert.equal((await llamar({ headers: {} })).codigo, 415);
  assert.equal((await llamar({ body: '{' })).codigo, 400);
  assert.equal((await llamar({ body: { texto: 'a'.repeat(9000) } })).codigo, 413);
});
test('API valida antes de llamar a la base de datos', async () => {
  let llamado = false;
  const res = await llamar({ body: { ...ejemplo(), consentimiento: false } }, { guardar: async () => { llamado = true; } });
  assert.equal(res.codigo, 400); assert.equal(llamado, false);
});
test('API oculta información interna cuando falla la base', async () => {
  const res = await llamar({}, { guardar: async () => { throw new Error('clave-secreta-de-prueba'); } });
  assert.equal(res.codigo, 503); assert.doesNotMatch(JSON.stringify(res.datos), /clave-secreta/);
});
test('Origen configurado rechaza una petición desde otro sitio', async () => {
  const anterior = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://ejemplo.vercel.app';
  try {
    const res = await llamar({ headers: { 'content-type': 'application/json', origin: 'https://otro.example' } });
    assert.equal(res.codigo, 403);
  } finally {
    if (anterior === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = anterior;
  }
});
