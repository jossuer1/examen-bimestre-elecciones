# ADR-002: Selección del servicio backend y autenticación

- **Estado:** Propuesto.
- **Fecha:** 2026-11-21.
- **Autores y equipo:** Todos los integrantes del equipo.
- **Requisitos relacionados:** R2, R3, R4, R5, R6 y R8.

## 1. Contexto

La aplicación necesita un servicio backend que permita almacenar y consultar información electoral, administrar usuarios y autenticar a los integrantes del sistema.

Se contemplan tres roles principales:

- Coordinador provincial.
- Coordinador de recinto.
- Veedor de mesa.

Cada usuario deberá acceder únicamente a las funcionalidades y datos que correspondan a su rol y ámbito de responsabilidad.

El sistema también necesita almacenar fotografías de las actas y permitir la consulta de información desde diferentes dispositivos.

El requisito R8 establece que se debe elegir y justificar entre Firebase, Supabase y Appwrite, considerando autenticación, autorización, almacenamiento y seguridad.

## 2. Alternativas consideradas

### Alternativa A: Supabase

Supabase es una plataforma backend que proporciona una base de datos PostgreSQL, autenticación, almacenamiento de archivos y servicios para acceder a los datos.

**Ventajas:**

- Utiliza PostgreSQL como sistema de base de datos relacional.
- Permite establecer relaciones entre usuarios, recintos, mesas y actas.
- Incluye Supabase Auth para gestionar la autenticación.
- Permite implementar políticas de seguridad mediante Row Level Security (RLS).
- Incluye Supabase Storage para almacenar fotografías.
- Facilita realizar consultas y relaciones entre tablas.

**Desventajas:**

- Es necesario diseñar correctamente las políticas RLS.
- Requiere comprender el funcionamiento de PostgreSQL y las relaciones entre tablas.
- Algunas configuraciones de seguridad pueden ser complejas al principio.
- Los límites y costos dependen del plan contratado.

### Alternativa B: Firebase

Firebase es una plataforma de Google que proporciona servicios backend, autenticación y almacenamiento.

**Ventajas:**

- Cuenta con Firebase Authentication para gestionar usuarios.
- Proporciona Cloud Firestore para almacenar información.
- Incluye Firebase Storage para almacenar imágenes.
- Cuenta con reglas de seguridad para controlar el acceso a los datos.
- Tiene integración con aplicaciones móviles.

**Desventajas:**

- Firestore utiliza un modelo NoSQL, por lo que requiere diseñar documentos y colecciones.
- Las consultas y relaciones entre datos se manejan de manera diferente a una base de datos relacional.
- Es necesario diseñar cuidadosamente las reglas de seguridad.
- El consumo de recursos y los costos dependen del uso y del plan.

### Alternativa C: Appwrite

Appwrite es una plataforma backend que proporciona autenticación, bases de datos, almacenamiento y servicios para aplicaciones.

**Ventajas:**

- Proporciona servicios de autenticación.
- Incluye almacenamiento de archivos.
- Permite gestionar permisos de acceso.
- Cuenta con SDK para integrarse con aplicaciones.
- Puede utilizarse mediante servicios administrados o mediante una instalación propia.

**Desventajas:**

- Es necesario familiarizarse con su modelo de bases de datos y permisos.
- La configuración y administración pueden requerir trabajo adicional dependiendo de la modalidad elegida.
- El equipo deberá evaluar la documentación y compatibilidad de los SDK con el proyecto.

## 3. Decisión propuesta

Se propone utilizar _Supabase_ como backend del proyecto.

La propuesta considera los siguientes servicios:

- **Supabase Auth:** autenticación de usuarios.
- **PostgreSQL:** almacenamiento de los datos.
- **Supabase Storage:** almacenamiento de fotografías de las actas.
- **Row Level Security:** control de acceso a los registros.
- **Políticas de autorización:** restricciones según el rol y la pertenencia del usuario a un recinto o mesa.

La elección se propone porque el modelo relacional facilita representar las relaciones entre provincias, recintos, mesas, usuarios y actas.

También se considera la experiencia previa de uno de los integrantes con Supabase. Esta experiencia es un criterio de familiaridad del equipo, no una demostración de que Supabase sea necesariamente más rápido que las otras plataformas.

**Decisión definitiva del equipo:** [Completar después de la reunión].

## 4. Consecuencias

### Consecuencias positivas

- Se contará con una base de datos relacional.
- Será posible representar relaciones entre usuarios, recintos, mesas y actas.
- Se podrán implementar restricciones de acceso mediante RLS.
- La autenticación y el almacenamiento de imágenes estarán integrados en la misma plataforma.

### Consecuencias negativas o riesgos

- Una política RLS incorrecta podría permitir el acceso no autorizado a información.
- Una configuración incorrecta de permisos podría exponer fotografías o resultados.
- El proyecto dependerá de la disponibilidad del servicio backend y de la conexión a Internet.
- Se deberán revisar los límites del plan utilizado.

### Medidas para reducir los riesgos

- Crear políticas RLS para cada tabla que contenga información protegida.
- No incluir claves administrativas o claves secretas en el código de la aplicación.
- Utilizar únicamente credenciales públicas apropiadas para el cliente.
- Restringir el acceso a fotografías mediante políticas y rutas protegidas.
- Probar los permisos con usuarios de cada rol.

## 5. Verificación

La decisión se verificará mediante las siguientes pruebas:

- [ ] Crear usuarios para los tres roles.
- [ ] Comprobar que un usuario puede iniciar sesión.
- [ ] Comprobar que un usuario no autenticado no puede consultar información protegida.
- [ ] Comprobar que el coordinador provincial puede consultar la información de su ámbito.
- [ ] Comprobar que el coordinador de recinto solo puede administrar información de su recinto.
- [ ] Comprobar que un veedor solo puede consultar y registrar información en las mesas que tiene asignadas.
- [ ] Intentar acceder a una mesa ajena modificando el identificador de la solicitud.
- [ ] Comprobar que las fotografías se almacenan y consultan respetando los permisos.

**Criterio de aceptación:** un veedor no debe poder consultar ni modificar información de mesas que no tenga asignadas, incluso si intenta acceder directamente mediante una solicitud o identificador diferente.

## 6. Uso de IA

- Claude
- DeepSeek

## 7. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-002-backend.md`
- **Commit de documentación:** ADR-002-backend

## 8. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Objeciones o desacuerdos:** Desacuerdo entre Firebase y Supabase.

**Acuerdo final:** Supabase.

**Minuto del video:** `12:30`.
