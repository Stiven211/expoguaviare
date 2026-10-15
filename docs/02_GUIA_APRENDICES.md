# Guía de desarrollo y sustentación

## Qué problema resolvemos

Un emprendimiento que visita Expoguaviare necesita entender qué puede hacer una web por su negocio y dejar una solicitud. Nuestra página muestra servicios y ejemplos, recoge la información mínima y la guarda para que el equipo pueda darle seguimiento.

El alcance es pequeño: una landing, cuatro ejemplos y un formulario conectado a una tabla. No prometemos que el sitio del stand ya incluya una tienda, reservas o un panel de administración para clientes.

## Cómo recorrer el código

1. Abre `public/index.html`: identifica las secciones, los enlaces por ancla y el formulario. Los atributos `id` sirven para localizar elementos; `name` identifica los datos que recoge `FormData`.
2. Revisa `public/styles.css`: las variables de `:root` definen colores; Grid y Flexbox distribuyen bloques; las consultas `@media` adaptan la composición a móvil. No hay Bootstrap.
3. Lee `public/js/sectores.js`: son datos ficticios en objetos. Cambiar una pestaña no necesita ir a internet.
4. Lee `public/js/app.js`: primero las clases y después las dos instrucciones `new` que arrancan la aplicación.
5. Sigue un envío hasta `api/solicitudes.js`, luego `server/solicitudes.js` y finalmente la tabla del script SQL.
6. Ejecuta las pruebas y cambia un dato inválido para ver qué validación lo rechaza.

## POO usada de forma concreta

Una **clase** define cómo se construye un objeto y qué acciones puede realizar. Una **instancia** es el objeto creado con `new`. Un **atributo** guarda estado; un **método** realiza una acción; `this` se refiere a la instancia que está trabajando.

| Clase | Responsabilidad | Estado o dependencia | Métodos principales |
| --- | --- | --- | --- |
| `GaleriaSectores` | Cambiar ejemplos y gestionar pestañas | Sector actual y botones | `mostrar` |
| `FormularioSolicitud` | Leer campos y mostrar estados de envío | Formulario, ID, servicio, bandera `enviando` | `enviar`, `informar` |
| `ServicioSolicitudes` | Enviar JSON al servidor | No conserva datos entre llamadas | `guardar` |
| `ValidadorSolicitud` | Validar y seleccionar datos permitidos | No conserva estado | `validar` |
| `RepositorioSolicitudes` | Escribir mediante la API REST de Supabase | URL, clave y función HTTP | `guardar` |
| `ErrorValidacion` | Identificar errores que puede corregir el visitante | Mensaje heredado de `Error` | Constructor heredado |

**Composición:** el formulario recibe un servicio en su constructor. No necesita conocer la base de datos. El repositorio recibe una función HTTP; en las pruebas se sustituye por una función controlada. Esto se llama inyección de dependencias: pasar una herramienta a un objeto en lugar de dejarla fija dentro de él.

**Encapsulación:** agrupamos estado y comportamiento en clases con responsabilidades delimitadas. Sus propiedades JavaScript no están declaradas privadas con `#`; no debemos afirmar que son inaccesibles. La clave es privada porque este módulo se ejecuta en el servidor, no porque la propiedad se llame `clave`.

**Herencia:** solo usamos `extends Error` para distinguir errores de validación. No hace falta inventar una jerarquía de negocios o formularios para demostrar POO. Las clases aportan organización; no convierten por sí solas un programa en seguro.

## Explicar un envío en siete pasos

1. El visitante completa el formulario. HTML verifica campos obligatorios y longitudes.
2. `FormularioSolicitud` cancela la recarga con `preventDefault`, recoge campos con `FormData` y activa el estado de envío.
3. `ServicioSolicitudes` realiza un `fetch` POST a `/api/solicitudes`, con JSON en el cuerpo.
4. Vercel ejecuta la función del servidor, verifica método, tipo, tamaño y valida todos los campos de nuevo.
5. El repositorio envía únicamente los campos permitidos a la API REST de Supabase. La clave se obtiene de variables de entorno del servidor.
6. PostgreSQL aplica restricciones. El ID es clave primaria: repetir el mismo UUID no crea otra fila.
7. Vercel devuelve el ID. Solo después el navegador muestra la confirmación y limpia el formulario. Si falla, conserva los campos para reintentar.

`async/await` permite esperar una petición sin bloquear la interfaz. `try/catch/finally` distingue éxito, error y limpieza del estado. `AbortController` limita la espera del navegador. La cancelación NO garantiza que el servidor no haya guardado: por eso existe el UUID de reintento.

## Preguntas que puede hacer un experto

**¿Por qué JavaScript en dos lugares?** En el navegador maneja la interfaz. En Vercel, Node.js ejecuta código del servidor y accede a secretos. Son entornos diferentes aunque compartan lenguaje.

**¿Por qué validar dos veces?** La validación del navegador ayuda al usuario, pero se puede omitir. El servidor es la frontera de confianza; PostgreSQL añade restricciones para mantener consistencia.

**¿Por qué no consultar Supabase directamente desde el navegador?** Elegimos un flujo sencillo con una API propia, validación centralizada y tabla sin acceso público. También existen arquitecturas con clave publishable y RLS cuidadosamente diseñado; aquí no las necesitamos.

**¿Qué es REST?** Una forma de interactuar con recursos mediante HTTP. Enviamos JSON por POST; Supabase lo transforma en una operación de base de datos. No construimos SQL concatenando entradas del usuario.

**¿RLS protege de todo?** No. RLS limita filas según roles/políticas. La clave secreta del servidor omite RLS. Por eso esa clave nunca debe salir del servidor y la API solo expone la operación necesaria. Una filtración de la clave requiere rotarla.

**¿Se puede listar la base desde esta web?** No hay endpoint GET de consulta y los roles públicos no tienen permisos en la tabla. El instructor usa Supabase con su cuenta autorizada.

**¿Cómo evitan inyección HTML?** La interfaz usa `textContent`, no introduce datos del visitante con `innerHTML`. Se guardan textos; si mañana se crea un panel, también tendrá que tratarlos como texto. La CSP añade una barrera para recursos y scripts no autorizados.

**¿Cómo evitan duplicados?** El navegador genera un UUID y el servidor inserta con conflicto ignorado sobre ese ID. Los reintentos sin cambios conservan el ID. Si se editan datos, se inicia otra solicitud; recargar la página o usar otra pestaña también genera un ID nuevo. No deduplicamos personas por teléfono.

**¿Qué pasa si se cae internet?** Se informa el problema, se mantienen los campos en memoria y se puede reintentar. No existe sincronización offline. Recargar o cerrar la página pierde esos campos; no guardamos teléfonos en almacenamiento local.

**¿Qué tan protegido está contra spam?** Tiene validación, límite de tamaño y un señuelo básico. No incluye CAPTCHA ni límite distribuido de solicitudes. Un robot puede saltar el señuelo y llamar la API. Para difusión masiva conviene configurar reglas en Vercel o añadir un mecanismo de verificación. No afirmar protección antiabuso completa.

**¿Por qué no usar una variable global para limitar peticiones?** Las funciones pueden ejecutarse en instancias diferentes o reiniciarse. Un contador en memoria no es un límite fiable en un entorno serverless.

**¿Es MVC?** No implementamos un framework MVC. Separar vista, interacción, validación y repositorio es separación de responsabilidades; no necesitamos llamar MVC a toda organización por archivos.

**¿Por qué no React?** La interfaz tiene pocas interacciones. HTML, CSS y módulos JavaScript cubren el alcance y facilitan que todos expliquen el flujo. React sería una opción si la complejidad lo justificara.

**¿Qué aporta SQL si usamos REST?** SQL define la tabla, tipos, restricciones, clave primaria y permisos. REST es el transporte; PostgreSQL sigue almacenando y verificando los datos.

**¿Qué probamos realmente?** Validación y respuestas de la API con un repositorio simulado. Eso no comprueba credenciales, RLS real, despliegue, diseño en dispositivos ni que Supabase esté disponible: esas verificaciones se hacen con el proyecto configurado.

## Cómo desarrollarlo en clase

1. **Estructura:** cada pareja construye una sección semántica en HTML y explica para qué sirve.
2. **Diseño:** aplicar colores, tipografía y diseño adaptable. Verificar logo y lectura en el televisor y en un celular.
3. **Galería:** crear el objeto de sectores y la clase que cambia textos e imagen. Probar teclado.
4. **Formulario:** implementar `FormData`, estados y servicio HTTP. Primero usar respuestas simuladas claramente identificadas como pruebas.
5. **Servidor y SQL:** crear tabla, restricciones, validador y repositorio. Integrar con variables de entorno.
6. **Pruebas y entrega:** comprobar errores, reintentos y acceso a datos, documentar el despliegue y ensayar la explicación.

Programación puede liderar requisitos, interfaz, clases y datos. Sistemas Teleinformáticos puede liderar conectividad del stand, preparación de equipos, pruebas de navegadores, documentación y apoyo al despliegue. Todos deben recorrer el flujo completo y explicar qué hace su parte.

## Guion breve para la feria

“Somos aprendices del SENA, de Articulación con la media, de Técnico en Programación de Software y Técnico en Sistemas Teleinformáticos. Creamos esta página para que los negocios del Guaviare conozcan posibilidades de desarrollo web. Los ejemplos se cambian con una clase de JavaScript. El formulario se valida y se envía a una función en Vercel, que guarda en Supabase usando una clave que el visitante no recibe. El equipo revisa las solicitudes antes de acordar alcance y tiempos.”

La mejor sustentación es mostrar un envío ficticio, encontrar su fila en Supabase sin exponer secretos, y explicar el recorrido con los archivos abiertos.
