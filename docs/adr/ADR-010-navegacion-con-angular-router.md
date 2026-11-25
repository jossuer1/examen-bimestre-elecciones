# ADR-010. Navegación con Angular Router

- **Estado** — Propuesto. Implementado en la aplicación y pendiente de consenso.
- **Fecha** — 2026-11-24.
- **Requisitos** — R2, R3, R4, R5, R6 y R9.

## Contexto

El acuerdo final del ADR-006 eligió navegación manual por eventos y condiciones. La aplicación actual define rutas para el acceso, el cambio de contraseña pendiente y las pantallas de los tres roles. Se necesita resolver el perfil antes de abrir una pantalla y aplicar las mismas reglas al entrar por URL o al navegar desde la app.

## Alternativas

- **Navegación manual** por estado en el componente raíz. Tiene pocas piezas para un flujo lineal. Requiere gestionar el historial, el botón Atrás, el acceso directo a pantallas y los errores de carga del perfil.
- **Angular Router con Ionic**. Centraliza las rutas y la redirección por rol. Permite cargar las páginas bajo demanda y proporciona guards para decisiones síncronas y resolvers para obtener datos antes de activar la pantalla. Agrega la coordinación entre navegación, sesión y carga asíncrona.

## Decisión

Reemplazar la navegación manual del ADR-006 por Angular Router con `IonRouterOutlet`. Las rutas actuales usan `comprobarAcceso`, un resolver que consulta el perfil, decide si la ruta corresponde al rol y devuelve un `RedirectCommand` cuando corresponde. También da prioridad al cambio de contraseña pendiente. Hoy el resolver reúne esa comprobación y la carga del perfil. Si se separan más adelante, un guard podrá decidir si se activa la ruta y el resolver podrá preparar sus datos. RLS y las Edge Functions siguen aplicando la autorización en el servidor.

## Consecuencias

La aplicación aplica la misma resolución al pulsar un enlace o recargar una URL. Un fallo o demora al cargar el perfil puede retrasar la activación de la ruta. Separar guards y resolvers sin compartir el resultado también podría duplicar la consulta del perfil.

## Verificación

- Abrir una URL protegida sin sesión y comprobar la redirección a acceso.
- Entrar con una cuenta pendiente de cambio y comprobar que se abre el formulario correspondiente.
- Entrar con cada rol, abrir una URL de otro rol y comprobar que se vuelve a la pantalla propia.
- Simular un fallo de carga del perfil y comprobar el reintento desde acceso.

## Uso de IA

Codex ayudó a comprobar el enrutamiento local y redactar el ADR.

## Trazabilidad

`docs/adr/ADR-006-funcionamiento-aplicacion.md`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/core/routing/acceso.resolver.ts` y `e2e/app.spec.ts`.

## Consenso del equipo

Desviación individual, pendiente de documentar
