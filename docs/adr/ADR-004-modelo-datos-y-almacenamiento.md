# ADR-004: Selección del modelo de datos y almacenamiento de información e imágenes

- **Estado:** Propuesto.
- **Fecha:** 2026-11-22
- **Autores:** Todos los integrantes del equipo.
- **Requisitos relacionados:** R3, R4, R5, R6, R7 y R8.

## 1. Contexto

La aplicación de control electoral necesita almacenar información relacionada con los usuarios, las organizaciones políticas, las candidaturas, las provincias, los cantones, las parroquias, los recintos electorales, las mesas y las actas de resultados.

Además, debe permitir almacenar las fotografías de las actas y conservar información complementaria, como las coordenadas GPS, los usuarios responsables del registro y el historial de modificaciones.

Para satisfacer estas necesidades se requiere seleccionar un servicio de base de datos y otro para el almacenamiento de imágenes.

El modelo de datos debe mantener relaciones entre sus entidades, facilitar las consultas de información y permitir controlar el acceso según el rol y las responsabilidades de cada usuario.

## 2. Alternativas consideradas

### Alternativa A: Firebase y Firebase Storage

Utilizar Firebase Firestore para almacenar la información y Firebase Storage para guardar las fotografías.

**Ventajas:**

- Integración entre los servicios de Firebase.
- Sincronización de datos en tiempo real.
- Reglas de seguridad configurables.
- Soporte para aplicaciones móviles.

**Desventajas:**

- Firestore utiliza un modelo NoSQL, por lo que las relaciones entre entidades requieren una estructura diferente.
- Las consultas que involucran varias entidades pueden necesitar lógica adicional.
- El equipo tendría que adaptar el modelo de datos relacional propuesto.

### Alternativa B: Supabase y Supabase Storage

Utilizar PostgreSQL mediante Supabase para almacenar la información y Supabase Storage para guardar las fotografías.

**Ventajas:**

- Base de datos relacional PostgreSQL.
- Permite establecer claves primarias y foráneas.
- Facilita las consultas relacionadas con varias tablas.
- Incluye autenticación y políticas de seguridad mediante Row Level Security (RLS).

**Desventajas:**

- Requiere configurar correctamente las relaciones y políticas de acceso.
- El almacenamiento de imágenes se administra dentro del mismo servicio.
- Es necesario controlar los permisos para evitar accesos no autorizados.

### Alternativa C: Supabase y Cloudinary

Utilizar Supabase con PostgreSQL para almacenar la información estructurada y Cloudinary para almacenar las fotografías de las actas.

**Ventajas:**

- PostgreSQL permite mantener un modelo de datos relacional.
- Supabase facilita la administración de usuarios, datos y permisos.
- Cloudinary está especializado en almacenamiento, gestión y entrega de imágenes.
- Se separa el almacenamiento de información estructurada del almacenamiento de archivos multimedia.
- En la base de datos se puede guardar la dirección de cada fotografía mediante el campo `foto_url`.

**Desventajas:**

- Es necesario configurar y administrar dos servicios externos.
- Se deben gestionar las credenciales y permisos de ambos servicios.
- La aplicación necesita gestionar posibles errores al subir imágenes a Cloudinary.
- Se debe evitar que queden registros sin fotografía o imágenes almacenadas que ya no estén asociadas a un acta.

## 3. Decisión propuesta

Se propone utilizar la **Alternativa C: Supabase y Cloudinary**.

La distribución de responsabilidades será la siguiente:

- **Supabase Database:** almacenar la información estructurada mediante PostgreSQL.
- **Supabase Auth:** gestionar la autenticación de los usuarios.
- **Supabase RLS:** controlar el acceso a los registros según los permisos establecidos.
- **Cloudinary:** almacenar y gestionar las fotografías de las actas electorales.

Las fotografías se subirán a Cloudinary y la dirección correspondiente se guardará en el campo `foto_url` de la tabla `actas`.

La decisión definitiva deberá ser aprobada por todos los integrantes del equipo durante la reunión.

## 4. Modelo de datos propuesto

El modelo de datos estará compuesto por las siguientes tablas:

### 4.1. Datos geográficos

#### Tabla: `provincias`

Almacena las provincias disponibles en el sistema.

| Campo  | Tipo   | Descripción                    |
| ------ | ------ | ------------------------------ |
| id     | PK     | Identificador de la provincia. |
| nombre | String | Nombre de la provincia.        |

#### Tabla: `cantones`

Almacena los cantones asociados a cada provincia.

| Campo        | Tipo   | Descripción                   |
| ------------ | ------ | ----------------------------- |
| id           | PK     | Identificador del cantón.     |
| provincia_id | FK     | Provincia a la que pertenece. |
| nombre       | String | Nombre del cantón.            |

#### Tabla: `parroquias`

Almacena las parroquias asociadas a cada cantón.

| Campo     | Tipo   | Descripción                    |
| --------- | ------ | ------------------------------ |
| id        | PK     | Identificador de la parroquia. |
| canton_id | FK     | Cantón al que pertenece.       |
| nombre    | String | Nombre de la parroquia.        |

### 4.2. Usuarios y organizaciones

#### Tabla: `perfiles`

Almacena la información personal y el rol de los usuarios de la aplicación.

| Campo              | Tipo    | Descripción                                      |
| ------------------ | ------- | ------------------------------------------------ |
| id                 | PK      | Identificador del perfil.                        |
| cedula             | String  | Número de cédula del usuario.                    |
| nombres            | String  | Nombres del usuario.                             |
| apellidos          | String  | Apellidos del usuario.                           |
| telefono           | String  | Número telefónico.                               |
| correo             | String  | Correo electrónico.                              |
| rol                | String  | Rol asignado al usuario.                         |
| recinto_id         | FK      | Recinto asociado al usuario, cuando corresponda. |
| debe_cambiar_clave | Boolean | Indica si debe cambiar su contraseña.            |

#### Tabla: `organizaciones`

Almacena las organizaciones políticas participantes.

| Campo  | Tipo   | Descripción                       |
| ------ | ------ | --------------------------------- |
| id     | PK     | Identificador de la organización. |
| nombre | String | Nombre de la organización.        |

#### Tabla: `candidaturas`

Almacena las candidaturas asociadas a las organizaciones políticas.

| Campo           | Tipo   | Descripción                              |
| --------------- | ------ | ---------------------------------------- |
| id              | PK     | Identificador de la candidatura.         |
| organizacion_id | FK     | Organización política correspondiente.   |
| cargo           | String | Cargo al que corresponde la candidatura. |
| candidato       | String | Nombre del candidato.                    |

### 4.3. Operación electoral

#### Tabla: `recintos`

Almacena los recintos electorales registrados en el sistema.

| Campo          | Tipo   | Descripción                              |
| -------------- | ------ | ---------------------------------------- |
| id             | PK     | Identificador del recinto.               |
| parroquia_id   | FK     | Parroquia donde se encuentra.            |
| nombre         | String | Nombre del recinto.                      |
| cantidad_jrv   | Number | Cantidad de juntas receptoras del voto.  |
| coordinador_id | FK     | Usuario coordinador asignado al recinto. |

#### Tabla: `mesas`

Almacena las mesas o juntas receptoras del voto correspondientes a cada recinto.

| Campo      | Tipo   | Descripción                        |
| ---------- | ------ | ---------------------------------- |
| id         | PK     | Identificador de la mesa.          |
| recinto_id | FK     | Recinto al que pertenece.          |
| numero     | Number | Número de la mesa.                 |
| veedor_id  | FK     | Usuario veedor asignado a la mesa. |

#### Tabla: `actas`

Almacena los resultados electorales registrados para cada mesa y cargo.

| Campo       | Tipo      | Descripción                                          |
| ----------- | --------- | ---------------------------------------------------- |
| id          | PK        | Identificador del acta.                              |
| mesa_id     | FK        | Mesa a la que pertenece el acta.                     |
| cargo       | String    | Cargo electoral correspondiente.                     |
| nulos       | Number    | Cantidad de votos nulos.                             |
| blancos     | Number    | Cantidad de votos blancos.                           |
| sufragantes | Number    | Cantidad de personas que sufragaron.                 |
| foto_url    | String    | Dirección de la fotografía almacenada en Cloudinary. |
| gps_lat     | Number    | Latitud de la ubicación del registro.                |
| gps_lng     | Number    | Longitud de la ubicación del registro.               |
| creada_por  | FK        | Usuario que registró el acta.                        |
| creada_en   | Date/Time | Fecha y hora de creación.                            |

#### Tabla: `acta_votos`

Almacena los votos obtenidos por cada candidatura dentro de un acta.

| Campo          | Tipo   | Descripción                         |
| -------------- | ------ | ----------------------------------- |
| acta_id        | FK     | Acta a la que pertenecen los votos. |
| candidatura_id | FK     | Candidatura que recibió los votos.  |
| votos          | Number | Cantidad de votos obtenidos.        |

#### Tabla: `acta_ediciones`

Almacena el historial de modificaciones realizadas a las actas.

| Campo       | Tipo      | Descripción                            |
| ----------- | --------- | -------------------------------------- |
| id          | PK        | Identificador de la edición.           |
| acta_id     | FK        | Acta que fue modificada.               |
| editada_por | FK        | Usuario que realizó la modificación.   |
| editada_en  | Date/Time | Fecha y hora de la modificación.       |
| cambios     | Text/JSON | Descripción de los cambios realizados. |

## 5. Relaciones entre las tablas

Las relaciones establecidas en el modelo permiten organizar la información de la siguiente manera:

- Una provincia puede contener varios cantones.
- Un cantón pertenece a una provincia y puede contener varias parroquias.
- Una parroquia pertenece a un cantón y puede contener varios recintos.
- Un recinto pertenece a una parroquia y puede contener varias mesas.
- Un recinto puede tener un coordinador asignado.
- Una mesa puede tener un veedor asignado.
- Una mesa puede tener diferentes actas correspondientes a distintos cargos.
- Una organización puede tener varias candidaturas.
- Una candidatura puede aparecer en diferentes registros de votos.
- Un acta puede contener varios registros en `acta_votos`.
- Un acta puede tener varias ediciones registradas en `acta_ediciones`.
- Un usuario puede registrar actas y realizar modificaciones, según sus permisos.

## 6. Almacenamiento de imágenes con Cloudinary

Se utilizará Cloudinary para almacenar las fotografías de las actas electorales.

El procedimiento propuesto será:

1. El usuario toma una fotografía del acta mediante la cámara del dispositivo.
2. La aplicación muestra una vista previa para comprobar que la imagen sea legible.
3. Si la fotografía no es clara, el usuario puede repetir la captura.
4. Si la fotografía es aceptada, se envía a Cloudinary.
5. Cloudinary devuelve la dirección de la imagen.
6. La aplicación guarda esa dirección en el campo `foto_url` de la tabla `actas`, junto con los demás datos del registro.

De esta manera, Supabase conservará la referencia de la fotografía, mientras que Cloudinary almacenará el archivo original.

Las credenciales privadas de Cloudinary no deberán incluirse directamente en el código de la aplicación. Se deberá utilizar un mecanismo seguro para gestionar la carga de imágenes.

## 7. Seguridad y control de acceso

Se deberán implementar mecanismos para proteger la información y restringir las operaciones según el rol del usuario.

Las principales consideraciones son:

- Aplicar políticas RLS en las tablas de Supabase.
- Restringir a cada usuario el acceso a los recintos y mesas que tiene asignados.
- Permitir que los veedores consulten y registren información únicamente de sus mesas asignadas.
- Permitir que los coordinadores administren la información correspondiente a sus recintos.
- Restringir las operaciones administrativas al coordinador provincial.
- Verificar los permisos en el backend, sin depender únicamente de las restricciones visuales de la aplicación.
- Proteger las fotografías almacenadas en Cloudinary mediante una configuración de acceso adecuada.
- No almacenar contraseñas directamente en la tabla `perfiles`; la autenticación y gestión de credenciales corresponderá a Supabase Auth.

La relación entre `perfiles.id` y el identificador del usuario de Supabase Auth deberá definirse durante la implementación para mantener la correspondencia entre las cuentas y sus perfiles.

## 8. Consecuencias de la decisión

### Consecuencias positivas

- Se dispone de una base de datos relacional organizada.
- Las claves primarias y foráneas permiten mantener relaciones entre las entidades.
- Se separa el almacenamiento de datos del almacenamiento de imágenes.
- Cloudinary facilita la administración de las fotografías de las actas.
- Supabase permite implementar autenticación y políticas de acceso.
- El modelo facilita la generación de reportes y consultas de resultados electorales.

### Consecuencias negativas

- Se deben configurar y mantener dos servicios externos.
- La aplicación depende de la disponibilidad de Supabase y Cloudinary.
- Se necesita gestionar correctamente la carga de imágenes y el almacenamiento de sus direcciones.
- La configuración de permisos y relaciones requiere pruebas para evitar accesos indebidos.

## 9. Riesgos y medidas de mitigación

| Riesgo                                            | Medida de mitigación                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Acceso no autorizado a información electoral.     | Implementar políticas RLS y verificar permisos en el backend.                 |
| Pérdida o eliminación de fotografías.             | Gestionar correctamente las operaciones de carga y eliminación en Cloudinary. |
| Registro de un acta sin fotografía válida.        | Validar la carga de la imagen antes de completar el registro.                 |
| Dirección de imagen incorrecta o inexistente.     | Verificar la respuesta de Cloudinary antes de guardar `foto_url`.             |
| Inconsistencia entre los votos y los sufragantes. | Implementar validaciones de consistencia antes de guardar el acta.            |
| Modificaciones sin trazabilidad.                  | Registrar las modificaciones en `acta_ediciones`.                             |
| Exposición de credenciales privadas.              | Mantener las claves secretas fuera del código cliente y del repositorio.      |

## 10. Verificación de la decisión

Para comprobar que la implementación cumple con lo establecido se realizarán las siguientes pruebas:

- Verificar la creación y consulta de registros en las tablas.
- Comprobar que las claves foráneas relacionen correctamente las entidades.
- Registrar un recinto, sus mesas y los usuarios asignados.
- Registrar un acta y comprobar que se almacene su información.
- Subir una fotografía a Cloudinary y comprobar que su dirección se guarde en `actas.foto_url`.
- Comprobar que la fotografía pueda visualizarse desde la aplicación.
- Verificar que un veedor no pueda acceder a mesas que no tiene asignadas.
- Verificar que un coordinador no pueda administrar recintos ajenos a sus permisos.
- Comprobar que las modificaciones de las actas queden registradas en `acta_ediciones`.
- Validar que los votos registrados mantengan consistencia con los demás datos del acta.

## 11. Consideraciones pendientes

Los siguientes aspectos deberán definirse o verificarse durante el desarrollo:

- Tipos de datos definitivos de cada columna en PostgreSQL.
- Restricciones `NOT NULL`, `UNIQUE` y valores permitidos para los campos.
- Relación exacta entre `perfiles.id` y `auth.users.id`.
- Políticas RLS para cada tabla.
- Configuración de carga segura de imágenes en Cloudinary.
- Política de eliminación de fotografías cuando se elimine o reemplace un acta.
- Validaciones para evitar registros duplicados o inconsistentes.
- Definición de los valores permitidos para `rol` y `cargo`.
- Definición de una clave primaria para la tabla `acta_votos`, si corresponde.

## 12. Uso de inteligencia artificial

- Claude
- DeepSeek

## 13. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-004-modelo-datos-y-almacenamiento.md`
- **Commit de documentación:** ADR-004-modelo-datos-y-almacenamiento

## 14. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Objeciones o desacuerdos:** De acuerdo.

**Acuerdo final:** Alternativa C: Supabase y Cloudinary.

**Minuto del video:** `28:18`.
