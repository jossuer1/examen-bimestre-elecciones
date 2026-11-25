begin;

create or replace function public.registrar_acta_veedor(p_veedor uuid, p_acta jsonb, p_foto_url text)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_mesa bigint := (p_acta->>'mesa_id')::bigint;
  v_cargo text := p_acta->>'cargo';
  v_sufragantes integer := (p_acta->>'sufragantes')::integer;
  v_blancos integer := (p_acta->>'blancos')::integer;
  v_nulos integer := (p_acta->>'nulos')::integer;
  v_latitud double precision := (p_acta->>'gps_lat')::double precision;
  v_longitud double precision := (p_acta->>'gps_lng')::double precision;
  v_votos jsonb := p_acta->'votos';
  v_cantidad bigint;
  v_distintas bigint;
  v_validas bigint;
  v_total bigint;
  v_acta_id bigint;
begin
  perform 1 from public.mesas m join public.perfiles p on p.id = m.veedor_id
    where m.id = v_mesa and m.veedor_id = p_veedor and p.rol = 'veedor'
      and not p.debe_cambiar_clave
    for update of m;
  if not found then
    raise insufficient_privilege using message = 'Esta mesa no está asignada a tu cuenta.';
  end if;

  if v_cargo is null or v_cargo not in ('alcalde', 'prefecto')
     or v_sufragantes is null or v_sufragantes < 0
     or v_blancos is null or v_blancos < 0 or v_nulos is null or v_nulos < 0
     or jsonb_typeof(v_votos) is distinct from 'array'
     or p_foto_url is null or p_foto_url !~ '^https://' then
    raise check_violation using message = 'Revisa los datos del acta y su fotografía.';
  end if;

  if v_latitud is null or v_latitud not between -90 and 90
     or v_longitud is null or v_longitud not between -180 and 180 then
    raise check_violation using message = 'Obtén una ubicación válida antes de guardar el acta.';
  end if;

  select count(*), count(distinct v.candidatura_id), count(c.id), sum(v.votos)
    into v_cantidad, v_distintas, v_validas, v_total
    from jsonb_to_recordset(v_votos) as v(candidatura_id bigint, votos integer)
    left join public.candidaturas c on c.id = v.candidatura_id and c.cargo = v_cargo
      and v.votos >= 0;
  if v_cantidad = 0 or v_cantidad <> v_distintas or v_cantidad <> v_validas
     or v_cantidad <> (select count(*) from public.candidaturas where cargo = v_cargo) then
    raise check_violation using message = 'Registra los votos de todas las candidaturas del cargo.';
  end if;
  if v_total + v_blancos + v_nulos <> v_sufragantes then
    raise check_violation using message = 'Los votos, blancos y nulos deben sumar los sufragantes.';
  end if;

  insert into public.actas(mesa_id, cargo, sufragantes, blancos, nulos, foto_url, gps_lat, gps_lng, creada_por)
  values (v_mesa, v_cargo, v_sufragantes, v_blancos, v_nulos, p_foto_url,
          v_latitud, v_longitud, p_veedor)
  returning id into v_acta_id;

  insert into public.acta_votos(acta_id, candidatura_id, votos)
  select v_acta_id, candidatura_id, votos
    from jsonb_to_recordset(v_votos) as v(candidatura_id bigint, votos integer);
  return v_acta_id;
end;
$$;

revoke execute on function public.registrar_acta_veedor(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.registrar_acta_veedor(uuid, jsonb, text) to service_role;
revoke insert on public.actas, public.acta_votos from anon, authenticated;

commit;
