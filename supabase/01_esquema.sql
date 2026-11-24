-- ADR-004: modelo de datos

-- Datos geográficos
create table provincias (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table cantones (
  id bigint generated always as identity primary key,
  provincia_id bigint not null references provincias(id),
  nombre text not null,
  unique (provincia_id, nombre)
);

create table parroquias (
  id bigint generated always as identity primary key,
  canton_id bigint not null references cantones(id),
  nombre text not null,
  unique (canton_id, nombre)
);

-- Organizaciones y candidaturas
create table organizaciones (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table candidaturas (
  id bigint generated always as identity primary key,
  organizacion_id bigint not null references organizaciones(id),
  cargo text not null check (cargo in ('alcalde', 'prefecto')),
  candidato text not null,
  unique (organizacion_id, cargo)
);

-- Perfiles: el id es el MISMO id del usuario en Supabase Auth
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cedula text not null unique check (cedula ~ '^[0-9]{10}$'),
  nombres text not null,
  apellidos text not null,
  telefono text not null,
  correo text not null,
  rol text not null check (rol in ('provincial', 'recinto', 'veedor')),
  recinto_id bigint,
  debe_cambiar_clave boolean not null default true
);

-- Operación electoral
create table recintos (
  id bigint generated always as identity primary key,
  parroquia_id bigint not null references parroquias(id),
  nombre text not null,
  cantidad_jrv int not null check (cantidad_jrv between 1 and 30),
  coordinador_id uuid unique references perfiles(id) on delete set null
);

-- perfiles y recintos se refieren entre sí, por eso esta FK va después
alter table perfiles
  add constraint perfiles_recinto_fk
  foreign key (recinto_id) references recintos(id);

create table mesas (
  id bigint generated always as identity primary key,
  recinto_id bigint not null references recintos(id) on delete cascade,
  numero int not null check (numero > 0),
  veedor_id uuid references perfiles(id) on delete set null,
  unique (recinto_id, numero)
);

create table actas (
  id bigint generated always as identity primary key,
  mesa_id bigint not null references mesas(id) on delete cascade,
  cargo text not null check (cargo in ('alcalde', 'prefecto')),
  nulos int not null check (nulos >= 0),
  blancos int not null check (blancos >= 0),
  sufragantes int not null check (sufragantes >= 0),
  foto_url text not null,
  gps_lat double precision check (gps_lat between -90 and 90),
  gps_lng double precision check (gps_lng between -180 and 180),
  creada_por uuid not null references perfiles(id),
  creada_en timestamptz not null default now(),
  unique (mesa_id, cargo)   -- una acta por mesa y por elección
);

create table acta_votos (
  acta_id bigint not null references actas(id) on delete cascade,
  candidatura_id bigint not null references candidaturas(id),
  votos int not null check (votos >= 0),
  primary key (acta_id, candidatura_id)
);

create table acta_ediciones (
  id bigint generated always as identity primary key,
  acta_id bigint not null references actas(id) on delete cascade,
  editada_por uuid not null references perfiles(id),
  editada_en timestamptz not null default now(),
  cambios jsonb not null
);

-- Al crear un recinto se generan sus mesas 1..N automáticamente
create or replace function generar_mesas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into mesas (recinto_id, numero)
  select new.id, n from generate_series(1, new.cantidad_jrv) as n;
  return new;
end;
$$;

create trigger trg_generar_mesas
after insert on recintos
for each row execute function generar_mesas();

-- Seguridad: activar RLS en TODAS las tablas.
-- Sin políticas, nadie puede leer ni escribir desde la app (más seguro por defecto).
alter table provincias enable row level security;
alter table cantones enable row level security;
alter table parroquias enable row level security;
alter table organizaciones enable row level security;
alter table candidaturas enable row level security;
alter table perfiles enable row level security;
alter table recintos enable row level security;
alter table mesas enable row level security;
alter table actas enable row level security;
alter table acta_votos enable row level security;
alter table acta_ediciones enable row level security;