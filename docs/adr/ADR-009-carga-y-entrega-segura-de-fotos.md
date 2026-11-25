# ADR-009. Carga y entrega segura de fotografías de actas

- **Estado** — Propuesto. Implementado localmente y pendiente de verificación en Supabase y Cloudinary.
- **Fecha** — 2026-11-24.
- **Requisitos** — R5, R6, R7 y R8.

## Contexto

El ADR-004 eligió Cloudinary y exige proteger las fotografías. La modalidad acordada inicialmente usaba un preset sin firma. Los registros actuales usan imágenes de tipo `authenticated`. El acceso a la fila en Supabase no concede acceso directo a la imagen en Cloudinary.

## Alternativas

- Cargar desde el cliente mediante un preset sin firma. Simplifica la carga y deja el preset accesible al cliente.
- Cargar desde una Edge Function con credenciales de servidor. Permite comprobar la sesión y el ámbito del usuario antes de subir, y emitir enlaces temporales después de consultar el acta con RLS.

## Decisión

Reemplazar la modalidad de carga del ADR-004 por la subida desde `registrar-acta` y `corregir-acta`, con credenciales de servidor y `type=authenticated`. `actas.foto_url` conserva la referencia de Cloudinary sin firma.

`foto-url` consulta el acta con el JWT de quien llama y las políticas RLS vigentes. Si la fila es visible, devuelve un enlace firmado que caduca a los cinco minutos. La app solicita el enlace cada vez que abre la foto y lo conserva solo mientras la muestra.

## Consecuencias

Las credenciales privadas permanecen en servidor y la autorización de lectura reutiliza RLS. Una persona que obtenga el enlace temporal puede usarlo durante su vigencia. La consulta de la foto depende de la disponibilidad de Supabase y Cloudinary.

## Verificación

- Comprobar que la referencia sin firma de un acta nueva no descarga su imagen.
- Abrir la foto con un usuario autorizado y comprobar que se solicita otro enlace al ocultarla y volver a mostrarla.
- Pedir la misma foto con un usuario sin acceso al acta y comprobar que no se devuelve un enlace.
- Solicitar el enlace vencido desde una nueva pestaña sin caché y comprobar que Cloudinary lo rechaza.

## Uso de IA

Codex ayudó a revisar la documentación de Cloudinary e implementar y verificar localmente el flujo.

## Trazabilidad

`docs/adr/ADR-004-modelo-datos-y-almacenamiento.md`, `supabase/03_seguridad.sql`, `supabase/05_mesas_veedor.sql`, `supabase/functions/_shared/fotos-actas.ts` y `supabase/functions/foto-url/index.ts`.

## Consenso del equipo

Desviación individual, pendiente de documentar
