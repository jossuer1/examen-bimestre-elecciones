# ADR-007: Alcance y restricciones del proyecto

**Estado:** Propuesto.

**Fecha:** 2026-11-21.

**Autores y equipo:** Todos los integrantes del equipo.

**Requisitos relacionados:** R1, R2, R3, R4, R5, R6, R7, R8, R9 y R10 (opcional).

## 1. Contexto

El proyecto consiste en desarrollar una aplicación móvil para el control y seguimiento de información electoral de una organización política en Ecuador.

La aplicación permitirá administrar usuarios con diferentes roles, gestionar recintos y mesas electorales, registrar información de las actas y consultar los resultados obtenidos.

Debido al tiempo disponible para el desarrollo y a los requisitos establecidos en el examen, es necesario definir claramente el alcance del proyecto, las funcionalidades que serán implementadas y las restricciones que deberán respetarse.

También se requiere establecer límites que permitan mantener una línea base común entre los integrantes del equipo, considerando que cada estudiante desarrollará su propia aplicación en un repositorio individual.

## 2. Alternativas consideradas

### Alternativa A: Implementar únicamente las funcionalidades obligatorias

Desarrollar exclusivamente las funcionalidades correspondientes a los requisitos obligatorios R1–R9.

**Ventajas:**

- Permite concentrar el tiempo en cumplir los requisitos principales.
- Reduce la complejidad del desarrollo.
- Facilita organizar las tareas y establecer prioridades.
- Disminuye el riesgo de dejar funcionalidades obligatorias incompletas.

**Desventajas:**

- No incorpora funcionalidades adicionales como el funcionamiento offline.
- La aplicación dependerá de la conexión a Internet para comunicarse con el backend.

### Alternativa B: Implementar las funcionalidades obligatorias y adicionales

Desarrollar los requisitos R1–R9 e incorporar también el requisito opcional R10, relacionado con persistencia local y sincronización automática.

**Ventajas:**

- Permite ofrecer una aplicación con mayores capacidades.
- Facilita registrar información cuando no existe conexión a Internet.
- Incorpora una funcionalidad adicional que puede mejorar la experiencia de los usuarios.

**Desventajas:**

- Requiere más tiempo de desarrollo.
- Aumenta la complejidad de almacenamiento y sincronización.
- Introduce riesgos relacionados con duplicación y conflictos de datos.
- Podría afectar el tiempo disponible para completar las funcionalidades obligatorias.

### Alternativa C: Implementación progresiva según prioridades

Desarrollar primero todos los requisitos obligatorios R1–R9 y, una vez completados y verificados, evaluar la incorporación del requisito opcional R10.

**Ventajas:**

- Permite priorizar el cumplimiento de los requisitos obligatorios.
- Reduce el riesgo de dejar funcionalidades principales incompletas.
- Permite incorporar mejoras adicionales si existe tiempo disponible.
- Facilita comprobar progresivamente el funcionamiento de la aplicación.

**Desventajas:**

- El requisito opcional podría no llegar a implementarse.
- Requiere organizar adecuadamente el tiempo y las prioridades.
- Puede ser necesario realizar ajustes adicionales si se decide incorporar R10.

## 3. Decisión propuesta

Se propone adoptar la **alternativa A: Implementar únicamente las funcionalidades obligatorias**.

El alcance inicial de la aplicación estará conformado por los requisitos obligatorios R1–R9.

El requisito R10 será considerado una funcionalidad opcional y únicamente se implementará cuando los requisitos obligatorios estén desarrollados y verificados.

### 3.1. Alcance funcional

La aplicación contemplará las siguientes funcionalidades:

**Gestión de usuarios y autenticación**

- Inicio de sesión de los usuarios.
- Identificación de usuarios mediante cédula.
- Gestión de contraseñas.
- Cambio obligatorio de contraseña en el primer acceso.
- Recuperación de contraseña mediante correo electrónico.
- Acceso según el rol asignado.

**Administración provincial**

- Consulta y creación de recintos.
- Creación y asignación de coordinadores de recinto.
- Consulta del avance del registro de actas.
- Consulta de coordenadas GPS.
- Visualización de resultados por candidato, recinto y de manera consolidada.

**Administración de recintos**

- Consulta de mesas pertenecientes al recinto.
- Consulta del estado de las mesas.
- Creación de veedores.
- Asignación y reasignación de veedores a las Juntas Receptoras del Voto (JRV).
- Corrección de información y fotografías de actas.

**Registro de información electoral**

- Consulta de las mesas asignadas al veedor.
- Registro de actas para las dignidades de alcalde y prefecto.
- Registro de votos correspondientes a las cinco organizaciones políticas.
- Registro de votos nulos y blancos.
- Registro del total de sufragantes.
- Validación de la consistencia de los resultados.
- Corrección de información cuando corresponda.

**Captura de fotografías y ubicación**

- Captura de fotografías de las actas desde la aplicación.
- Vista previa para comprobar la calidad de las fotografías.
- Posibilidad de repetir la captura.
- Obtención de coordenadas GPS.
- Asociación de las coordenadas con el registro del acta.

**Seguridad y arquitectura**

- Control de acceso según los roles.
- Restricción de información según la pertenencia a un recinto o mesa.
- Separación entre presentación, lógica de negocio y acceso a datos.
- Gestión de estados de carga, éxito, error y validación.

### 3.2. Alcance tecnológico

Se propone utilizar las siguientes tecnologías, sujetas a la aprobación del equipo:

- Framework: Ionic Angular con arquitectura standalone.
- Aplicación móvil: Capacitor.
- Backend: Supabase.
- Autenticación: Supabase Auth.
- Base de datos: PostgreSQL.
- Almacenamiento de imágenes: Supabase Storage.
- Cámara: Capacitor Camera.
- Geolocalización: Capacitor Geolocation.
- Navegación: Angular Router integrado con Ionic.
- Manejo del estado: Servicios de Angular.

### 3.3. Restricciones del proyecto

Se establecen las siguientes restricciones:

**Restricciones tecnológicas**

- La aplicación debe desarrollarse utilizando Ionic Angular o Ionic React con Capacitor, según la decisión grupal.
- Todos los integrantes deberán utilizar la misma línea base tecnológica acordada.
- Cada estudiante deberá mantener su propio repositorio de GitHub.
- Se deberá evitar exponer claves administrativas o credenciales sensibles en el código fuente.

**Restricciones de acceso y seguridad**

- Cada usuario tendrá acceso únicamente a las funcionalidades correspondientes a su rol.
- Un coordinador de recinto no deberá administrar información de otros recintos.
- Un veedor no deberá consultar ni modificar mesas que no tenga asignadas.
- Las restricciones deberán aplicarse también en el backend, no solamente en la interfaz.

**Restricciones funcionales**

- Los datos de las actas deberán cumplir las reglas de validación establecidas.
- Las fotografías deberán revisarse antes de aceptarse.
- Las coordenadas GPS deberán asociarse al registro correspondiente.
- Las operaciones deberán informar claramente cuando se produzca un error.

**Restricciones de desarrollo y entrega**

- Cada integrante desarrollará su propia aplicación.
- Todos deberán utilizar la estructura tecnológica acordada.
- La documentación ADR deberá mantenerse dentro de la carpeta `docs/adr`.
- Se deberá conservar el historial de commits.
- La aplicación deberá contar con un APK Android instalable.
- La entrega deberá cumplir con la fecha y hora establecidas por el docente.

### 3.4. Funcionalidades fuera del alcance inicial

Se propone dejar fuera del alcance inicial:

- Funcionamiento offline y sincronización automática (R10), hasta completar los requisitos obligatorios.
- Funcionalidades que no estén contempladas en los requisitos del examen.
- Integraciones externas adicionales que no sean necesarias para cumplir el proyecto.
- Automatizaciones que no formen parte de los procesos solicitados.

**Decisión definitiva del equipo:** [Completar después de la reunión].

## 4. Consecuencias

### Consecuencias positivas

- Se contará con límites claros para el desarrollo.
- Todos los integrantes conocerán las funcionalidades que deben implementar.
- Se podrán priorizar los requisitos obligatorios.
- Se reducirá el riesgo de invertir tiempo en funcionalidades secundarias.
- Se mantendrá una línea base común entre los repositorios individuales.
- Se facilitará comprobar el cumplimiento de los requisitos.

### Consecuencias negativas y riesgos

- Algunas funcionalidades adicionales podrían no implementarse.
- Los cambios en los requisitos podrían requerir modificar el alcance.
- La diferencia de experiencia entre los integrantes podría afectar el ritmo de desarrollo.
- Una interpretación diferente de los requisitos podría producir implementaciones distintas.
- El tiempo disponible podría dificultar completar todas las funcionalidades.

### Medidas para reducir los riesgos

- Mantener una lista de requisitos y su estado de implementación.
- Priorizar los requisitos obligatorios R1–R9.
- Documentar los cambios importantes mediante ADR.
- Establecer una estructura común para los proyectos.
- Realizar pruebas de las funcionalidades principales.
- Registrar los acuerdos y desacuerdos durante la reunión grupal.
- Evaluar R10 únicamente cuando las funcionalidades obligatorias estén completas.

## 5. Verificación

El alcance y las restricciones se verificarán mediante los siguientes criterios:

1. Comprobar que la aplicación contempla las funcionalidades obligatorias R1–R9.
2. Verificar que existen los tres roles principales del sistema.
3. Comprobar que cada rol tiene acceso únicamente a sus funcionalidades autorizadas.
4. Verificar que los coordinadores administran la información correspondiente a su ámbito.
5. Comprobar que los veedores solo acceden a las mesas asignadas.
6. Verificar que se pueden registrar y consultar las actas.
7. Comprobar que las fotografías y coordenadas se asocian correctamente a los registros.
8. Verificar que se aplican las validaciones establecidas.
9. Comprobar que la aplicación muestra estados de carga, éxito, error y validación.
10. Verificar que cada integrante mantiene su propio repositorio y documentación.
11. Comprobar que la aplicación puede generar un APK Android instalable.
12. Registrar si el requisito opcional R10 fue implementado o quedó fuera del alcance.

**Criterio de aceptación:** el proyecto deberá cumplir los requisitos obligatorios establecidos y respetar las restricciones tecnológicas, funcionales y de seguridad aprobadas por el equipo.

**Evidencias:** matriz de requisitos, repositorios individuales, documentación ADR, pruebas realizadas, aplicación funcional y APK Android.

## 6. Uso de IA

- Claude
- DeepSeek

## 7. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-007-alcance-y-restricciones.md`
- **Commit de documentación:** ADR-007-alcance-y-restricciones

## 8. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Objeciones o desacuerdos:** De acuerdo.

**Acuerdo final:** Usaremos la alternativa A (R1-R9)Y el requisito 10 quedaria como lección.

**Minuto del video:** `51:05`.
