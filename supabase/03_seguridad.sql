-- ADR-002 / ADR-004: seguridad por rol y pertenencia

-- Funciones auxiliares. "security definer" les permite leer perfiles
-- sin chocar con las políticas (evita recursión infinita).
create or replace function rol_actual()
returns text language sql stable security definer set search_path = public
as $$ select rol from perfiles where id = auth.uid() $$;

create or replace function recinto_actual()
returns bigint language sql stable security definer set search_path = public
as $$ select recinto_id from perfiles where id = auth.uid() $$;

-- Login con cédula: traduce la cédula al correo que usa Supabase Auth.
-- Es la única función que puede llamar alguien sin sesión.
create or replace function email_por_cedula(p_cedula text)
returns text language sql stable security definer set search_path = public
as $$ select correo from perfiles where cedula = p_cedula limit 1 $$;

grant execute on function email_por_cedula(text) to anon, authenticated;

-- Marca que el usuario ya cambió su clave (no damos UPDATE directo
-- sobre perfiles, para que nadie pueda cambiarse su propio rol).
create or replace function marcar_clave_cambiada()
returns void language sql security definer set search_path = public
as $$ update perfiles set debe_cambiar_clave = false where id = auth.uid() $$;

grant execute on function marcar_clave_cambiada() to authenticated;

-- Endurecer permisos: sin sesión no se toca ninguna tabla
revoke all on all tables in schema public from anon;

-- Tablas de consulta: cualquier usuario con sesión puede leerlas
create policy "leer provincias"     on provincias     for select to authenticated using (true);
create policy "leer cantones"       on cantones       for select to authenticated using (true);
create policy "leer parroquias"     on parroquias     for select to authenticated using (true);
create policy "leer organizaciones" on organizaciones for select to authenticated using (true);
create policy "leer candidaturas"   on candidaturas   for select to authenticated using (true);

-- PERFILES: cada uno ve el suyo; provincial ve todos;
-- el coordinador de recinto ve a los de su recinto.
-- Las altas las hará una función del servidor (paso 7), no la app.
create policy "ver perfiles" on perfiles for select to authenticated
using (
  id = auth.uid()
  or rol_actual() = 'provincial'
  or (rol_actual() = 'recinto' and recinto_id = recinto_actual())
);

-- RECINTOS
create policy "ver recintos" on recintos for select to authenticated
using (
  rol_actual() = 'provincial'
  or id = recinto_actual()
  or exists (select 1 from mesas m
             where m.recinto_id = recintos.id and m.veedor_id = auth.uid())
);

create policy "crear recintos" on recintos for insert to authenticated
with check (rol_actual() = 'provincial');

create policy "asignar coordinador" on recintos for update to authenticated
using (rol_actual() = 'provincial')
with check (rol_actual() = 'provincial');

-- MESAS
create policy "ver mesas" on mesas for select to authenticated
using (
  rol_actual() = 'provincial'
  or recinto_id = recinto_actual()
  or veedor_id = auth.uid()
);

-- El coordinador asigna/reasigna veedores, solo de su recinto
create policy "asignar veedor" on mesas for update to authenticated
using (rol_actual() = 'recinto' and recinto_id = recinto_actual())
with check (
  rol_actual() = 'recinto'
  and recinto_id = recinto_actual()
  and (veedor_id is null or exists (
        select 1 from perfiles p
        where p.id = veedor_id and p.rol = 'veedor'
          and p.recinto_id = recinto_actual()))
);

-- ACTAS: una acta es visible si su mesa es visible (las políticas de
-- mesas ya filtran por rol y pertenencia)
create policy "ver actas" on actas for select to authenticated
using (exists (select 1 from mesas m where m.id = actas.mesa_id));

create policy "registrar acta" on actas for insert to authenticated
with check (
  rol_actual() = 'veedor'
  and creada_por = auth.uid()
  and exists (select 1 from mesas m
              where m.id = mesa_id and m.veedor_id = auth.uid())
);

create policy "corregir acta" on actas for update to authenticated
using (rol_actual() = 'recinto'
       and exists (select 1 from mesas m where m.id = actas.mesa_id))
with check (rol_actual() = 'recinto'
       and exists (select 1 from mesas m where m.id = actas.mesa_id));

-- ACTA_VOTOS
create policy "ver votos" on acta_votos for select to authenticated
using (exists (select 1 from actas a where a.id = acta_votos.acta_id));

create policy "registrar votos" on acta_votos for insert to authenticated
with check (
  rol_actual() = 'veedor'
  and exists (select 1 from actas a
              where a.id = acta_id and a.creada_por = auth.uid())
);

create policy "corregir votos" on acta_votos for update to authenticated
using (rol_actual() = 'recinto'
       and exists (select 1 from actas a where a.id = acta_votos.acta_id))
with check (rol_actual() = 'recinto'
       and exists (select 1 from actas a where a.id = acta_votos.acta_id));

-- ACTA_EDICIONES (historial)
create policy "ver ediciones" on acta_ediciones for select to authenticated
using (exists (select 1 from actas a where a.id = acta_ediciones.acta_id));

create policy "registrar edicion" on acta_ediciones for insert to authenticated
with check (
  rol_actual() = 'recinto'
  and editada_por = auth.uid()
  and exists (select 1 from actas a where a.id = acta_id)
);

-- Limitar QUÉ COLUMNAS se pueden modificar (defensa extra)
revoke update on recintos from authenticated;
grant  update (coordinador_id) on recintos to authenticated;

revoke update on mesas from authenticated;
grant  update (veedor_id) on mesas to authenticated;

revoke update on actas from authenticated;
grant  update (nulos, blancos, sufragantes, foto_url) on actas to authenticated;

revoke update on acta_votos from authenticated;
grant  update (votos) on acta_votos to authenticated;