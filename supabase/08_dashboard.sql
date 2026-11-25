begin;

create function public.avance_recintos()
returns table (
  id bigint,
  nombre text,
  parroquia text,
  total_mesas bigint,
  actas_registradas bigint,
  actas_esperadas bigint,
  porcentaje numeric
)
language sql stable security invoker
set search_path = ''
as $$
  select r.id, r.nombre, p.nombre,
         count(distinct m.id), count(a.id), count(distinct m.id) * 2,
         coalesce(round(100.0 * count(a.id) / nullif(count(distinct m.id) * 2, 0), 2), 0)
  from public.recintos r
  join public.parroquias p on p.id = r.parroquia_id
  left join public.mesas m on m.recinto_id = r.id
  left join public.actas a on a.mesa_id = m.id
  where public.rol_actual() = 'provincial'
  group by r.id, r.nombre, p.nombre
  order by r.nombre, r.id;
$$;

create function public.resultados_votos(p_cargo text, p_recinto_id bigint default null)
returns table (candidatura_id bigint, organizacion text, candidato text, votos bigint)
language sql stable security invoker
set search_path = ''
as $$
  with totales as (
    select v.candidatura_id, sum(v.votos) as votos
    from public.acta_votos v
    join public.actas a on a.id = v.acta_id
    join public.mesas m on m.id = a.mesa_id
    where a.cargo = p_cargo
      and (p_recinto_id is null or m.recinto_id = p_recinto_id)
    group by v.candidatura_id
  )
  select c.id, o.nombre, c.candidato, coalesce(t.votos, 0)
  from public.candidaturas c
  join public.organizaciones o on o.id = c.organizacion_id
  left join totales t on t.candidatura_id = c.id
  where c.cargo = p_cargo and public.rol_actual() = 'provincial'
  order by coalesce(t.votos, 0) desc, c.id;
$$;

create function public.actas_gps()
returns table (
  acta_id bigint,
  recinto text,
  mesa integer,
  cargo text,
  gps_lat double precision,
  gps_lng double precision,
  creada_en timestamptz,
  veedor text
)
language sql stable security invoker
set search_path = ''
as $$
  select a.id, r.nombre, m.numero, a.cargo, a.gps_lat, a.gps_lng, a.creada_en,
         concat_ws(' ', p.nombres, p.apellidos)
  from public.actas a
  join public.mesas m on m.id = a.mesa_id
  join public.recintos r on r.id = m.recinto_id
  join public.perfiles p on p.id = a.creada_por
  where public.rol_actual() = 'provincial'
  order by a.creada_en desc, a.id desc;
$$;

revoke execute on function public.avance_recintos() from public, anon, service_role;
revoke execute on function public.resultados_votos(text, bigint) from public, anon, service_role;
revoke execute on function public.actas_gps() from public, anon, service_role;
grant execute on function public.avance_recintos() to authenticated;
grant execute on function public.resultados_votos(text, bigint) to authenticated;
grant execute on function public.actas_gps() to authenticated;

commit;
