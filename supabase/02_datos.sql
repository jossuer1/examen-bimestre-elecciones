-- R1: datos iniciales (Pichincha, Quito)
insert into provincias (nombre) values ('Pichincha');

insert into cantones (provincia_id, nombre)
select id, 'Quito' from provincias where nombre = 'Pichincha';

-- Parroquias urbanas (lista corta precargada)
insert into parroquias (canton_id, nombre)
select c.id, p
from cantones c,
     unnest(array[
       'Belisario Quevedo', 'Carcelén', 'Centro Histórico', 'Chilibulo',
       'Chillogallo', 'Chimbacalle', 'Cochapamba', 'Comité del Pueblo',
       'Concepción', 'Cotocollao', 'El Condado', 'Guamaní', 'Iñaquito',
       'Itchimbía', 'Jipijapa', 'Kennedy', 'La Argelia', 'La Ecuatoriana',
       'La Ferroviaria', 'La Libertad', 'La Magdalena', 'Mariscal Sucre',
       'Ponceano', 'Puengasí', 'Quitumbe', 'Rumipamba', 'San Bartolo',
       'San Juan', 'Solanda', 'Turubamba'
     ]) as p
where c.nombre = 'Quito';

-- 5 organizaciones
insert into organizaciones (nombre) values
  ('Frente Quito Adelante'),
  ('Movimiento Nuevo Horizonte'),
  ('Alianza Ciudadana Unida'),
  ('Renovación Andina'),
  ('Cambio Popular');

-- Un candidato a alcalde y uno a prefecto por organización
insert into candidaturas (organizacion_id, cargo, candidato)
select o.id, v.cargo, v.candidato
from organizaciones o
join (values
  ('Frente Quito Adelante',      'alcalde',  'Andrés Villacís'),
  ('Frente Quito Adelante',      'prefecto', 'Marcela Torres'),
  ('Movimiento Nuevo Horizonte', 'alcalde',  'Patricia Recalde'),
  ('Movimiento Nuevo Horizonte', 'prefecto', 'Luis Almeida'),
  ('Alianza Ciudadana Unida',    'alcalde',  'Diego Paredes'),
  ('Alianza Ciudadana Unida',    'prefecto', 'Carolina Játiva'),
  ('Renovación Andina',          'alcalde',  'Fernando Cevallos'),
  ('Renovación Andina',          'prefecto', 'Silvia Narváez'),
  ('Cambio Popular',             'alcalde',  'Ricardo Montalvo'),
  ('Cambio Popular',             'prefecto', 'Daniela Proaño')
) as v(organizacion, cargo, candidato) on o.nombre = v.organizacion;

-- 6 recintos precargados (entre 4 y 8), con 3 a 6 JRV cada uno.
-- El trigger crea las mesas automáticamente.
insert into recintos (parroquia_id, nombre, cantidad_jrv)
select p.id, v.nombre, v.jrv
from (values
  ('Iñaquito',         'Escuela Modelo Iñaquito',        5),
  ('Cotocollao',       'Colegio Fiscal Cotocollao',      4),
  ('Quitumbe',         'Unidad Educativa Quitumbe Sur',  6),
  ('Chillogallo',      'Escuela Fiscal Chillogallo',     3),
  ('Centro Histórico', 'Colegio Central Histórico',      5),
  ('Carcelén',         'Unidad Educativa Carcelén',      4)
) as v(parroquia, nombre, jrv)
join parroquias p on p.nombre = v.parroquia;