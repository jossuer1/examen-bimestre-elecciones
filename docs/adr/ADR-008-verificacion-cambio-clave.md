# ADR-008. Verificación del cambio de clave en Supabase

- **Estado** — Propuesto. Implementación local pendiente de aplicar y verificar en Supabase.
- **Fecha** — 2026-11-24.
- **Requisitos** — R2 y R8.

## Contexto

El ADR-007 exige cambiar la clave inicial al primer acceso. El mecanismo de `03_seguridad.sql` permitía que una sesión autenticada marcara el cambio sin acreditar una actualización de contraseña.

## Alternativas

- Mantener un RPC solicitado por la app después de llamar a Auth. Deja al cliente como origen de la confirmación.
- Usar un trigger sobre la actualización efectiva de la contraseña en Supabase Auth. Confirma el cambio en la misma transacción.

## Decisión

Reemplazar la confirmación por RPC con un trigger sobre `auth.users` que se ejecuta cuando cambia `encrypted_password`. Actualiza el perfil correspondiente y se revoca el permiso de ejecutar el RPC anterior. La app vuelve a leer el perfil tras actualizar la clave mediante Auth.

## Consecuencias

La marca se actualiza junto con la contraseña. El trigger también cubre cambios hechos desde otros flujos de Auth. Un riesgo es que la solución depende de la columna interna `encrypted_password`. Además, un fallo del trigger puede impedir el cambio de contraseña.

## Verificación

1. Comprobar que los roles `anon` y `authenticated` carecen de permiso de ejecución sobre el RPC anterior.
2. Con una cuenta de prueba pendiente, actualizar datos ajenos a la contraseña y comprobar que la bandera sigue activa.
3. Cambiar la clave con Auth y comprobar que la bandera pasa a falso y la app abre la pantalla del rol.

## Uso de IA

Codex ayudó a redactar el ADR y a implementar y revisar el cambio local.

## Trazabilidad

`docs/adr/ADR-007-alcance-y-restricciones.md`, `supabase/03_seguridad.sql`, `supabase/07_clave_cambiada.sql` y `src/app/core/services/auth.service.ts`.

## Consenso del equipo

Desviación individual, pendiente de documentar
