begin;

-- Acredita que la Edge Function subió la foto para esta acta y este coordinador.
create table public.fotos_correccion_acta (
  foto_url text primary key,
  acta_id bigint not null references public.actas(id) on delete cascade,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  vence_en timestamptz not null default (now() + interval '10 minutes')
);
alter table public.fotos_correccion_acta enable row level security;
revoke all on public.fotos_correccion_acta from public, anon, authenticated, service_role;
grant select, insert, delete on public.fotos_correccion_acta to service_role;

create function public.corregir_acta(
  p_acta_id bigint, p_nulos integer, p_blancos integer, p_sufragantes integer,
  p_votos jsonb, p_foto_url text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_acta public.actas%rowtype;
  v_cantidad bigint;
  v_distintas bigint;
  v_validas bigint;
  v_total bigint;
  v_cambios jsonb;
  v_cambios_votos jsonb;
begin
  select a.* into v_acta
  from public.actas a
  join public.mesas m on m.id = a.mesa_id
  join public.perfiles p on p.id = v_actor and p.rol = 'recinto' and p.recinto_id = m.recinto_id
  where a.id = p_acta_id
  for update of a;
  if not found then
    raise insufficient_privilege using message = 'Solo puedes corregir actas de tu recinto.';
  end if;

  if p_nulos is null or p_blancos is null or p_sufragantes is null
     or least(p_nulos, p_blancos, p_sufragantes) < 0
     or jsonb_typeof(p_votos) is distinct from 'array' then
    raise check_violation using message = 'Ingresa cantidades enteras y no negativas para las cinco candidaturas.';
  end if;
  if jsonb_array_length(p_votos) <> 5 then
    raise check_violation using message = 'Registra exactamente las cinco candidaturas del cargo, sin repetirlas.';
  end if;

  begin
    select count(*), count(distinct v.candidatura_id), count(c.id), sum(v.votos)
      into v_cantidad, v_distintas, v_validas, v_total
    from jsonb_to_recordset(p_votos) as v(candidatura_id bigint, votos integer)
    left join public.candidaturas c on c.id = v.candidatura_id and c.cargo = v_acta.cargo and v.votos >= 0;
  exception when data_exception then
    raise check_violation using message = 'Revisa los votos de las cinco candidaturas.';
  end;

  if v_cantidad <> 5 or v_distintas <> 5 or v_validas <> 5
     or (select count(*) from public.candidaturas where cargo = v_acta.cargo) <> 5 then
    raise check_violation using message = 'Registra exactamente las cinco candidaturas del cargo, sin repetirlas.';
  end if;
  if v_total + p_nulos + p_blancos <> p_sufragantes then
    raise check_violation using message = 'Los votos por candidatura, blancos y nulos deben sumar los sufragantes.';
  end if;
  if p_foto_url is not null and p_foto_url !~
     ('^https://res[.]cloudinary[.]com/[A-Za-z0-9_-]+/image/authenticated/(s--[A-Za-z0-9_-]+--/)?(v[0-9]+/)?actas/'
      || p_acta_id::text || '/[0-9a-f-]{36}[.](jpg|jpeg|png|webp)$') then
    raise check_violation using message = 'La fotografía debe subirse desde el formulario de esta acta.';
  end if;
  if p_foto_url is not null and p_foto_url is distinct from v_acta.foto_url then
    delete from public.fotos_correccion_acta
    where foto_url = p_foto_url and acta_id = p_acta_id and usuario_id = v_actor and vence_en > now();
    if not found then
      raise check_violation using message = 'La fotografía debe subirse desde el formulario de esta acta.';
    end if;
  end if;

  select coalesce(jsonb_object_agg(campo, jsonb_build_object('antes', antes, 'despues', despues)), '{}'::jsonb)
    into v_cambios
  from (values
    ('nulos', to_jsonb(v_acta.nulos), to_jsonb(p_nulos)),
    ('blancos', to_jsonb(v_acta.blancos), to_jsonb(p_blancos)),
    ('sufragantes', to_jsonb(v_acta.sufragantes), to_jsonb(p_sufragantes)),
    ('foto_url', to_jsonb(v_acta.foto_url), to_jsonb(coalesce(p_foto_url, v_acta.foto_url)))
  ) as campos(campo, antes, despues)
  where antes is distinct from despues;

  with anteriores as (
    select candidatura_id, votos from public.acta_votos where acta_id = p_acta_id
  ), nuevos as (
    select * from jsonb_to_recordset(p_votos) as v(candidatura_id bigint, votos integer)
  )
  select jsonb_object_agg(candidatura_id::text, jsonb_build_object('antes', a.votos, 'despues', n.votos))
    into v_cambios_votos
  from anteriores a full join nuevos n using (candidatura_id)
  where a.votos is distinct from n.votos;

  if v_cambios_votos is not null then
    v_cambios := v_cambios || jsonb_build_object('votos', v_cambios_votos);
  end if;
  if v_cambios = '{}'::jsonb then return; end if;

  update public.actas
  set nulos = p_nulos, blancos = p_blancos, sufragantes = p_sufragantes,
      foto_url = coalesce(p_foto_url, v_acta.foto_url)
  where id = p_acta_id;

  delete from public.acta_votos v
  where v.acta_id = p_acta_id and not exists (
    select 1 from jsonb_to_recordset(p_votos) as n(candidatura_id bigint)
    where n.candidatura_id = v.candidatura_id
  );
  insert into public.acta_votos as existente (acta_id, candidatura_id, votos)
  select p_acta_id, v.candidatura_id, v.votos
  from jsonb_to_recordset(p_votos) as v(candidatura_id bigint, votos integer)
  on conflict (acta_id, candidatura_id) do update set votos = excluded.votos
    where existente.votos is distinct from excluded.votos;

  insert into public.acta_ediciones (acta_id, editada_por, editada_en, cambios)
  values (p_acta_id, v_actor, now(), v_cambios);
end;
$$;

revoke all on function public.corregir_acta(bigint, integer, integer, integer, jsonb, text)
  from public, anon, service_role;
grant execute on function public.corregir_acta(bigint, integer, integer, integer, jsonb, text) to authenticated;

revoke update on public.actas, public.acta_votos from authenticated;
revoke update (nulos, blancos, sufragantes, foto_url) on public.actas from authenticated;
revoke update (votos) on public.acta_votos from authenticated;
drop policy if exists "corregir acta" on public.actas;
drop policy if exists "corregir votos" on public.acta_votos;
revoke insert on public.acta_ediciones from authenticated;
drop policy if exists "registrar edicion" on public.acta_ediciones;

commit;
