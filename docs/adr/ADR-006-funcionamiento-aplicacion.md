# ADR-006: Estrategia de estado, navegación, validaciones, errores y pruebas

**Estado:** Propuesto.

**Fecha:** 2026-11-21.

**Autores y equipo:** Todos los integrantes del equipo.

**Requisitos relacionados:** R3, R4, R5, R6 y R9. R10 se considera una funcionalidad opcional.

## 1. Contexto

La aplicación tendrá diferentes pantallas y funcionalidades que deberán compartir información y responder a las acciones del usuario.

Será necesario gestionar:

- La sesión del usuario.
- Los datos de los formularios.
- Los resultados electorales.
- La información de recintos y mesas.
- Los estados de carga.
- Los mensajes de éxito y error.
- Las validaciones de los registros.

También se necesita definir cómo se realizará la navegación entre páginas, cómo se validarán los datos y qué estrategia se utilizará para probar la aplicación.

El requisito R9 solicita mostrar estados explícitos de carga, éxito, error y validación.

## 2. Alternativas consideradas

### A. Manejo de estado

#### Alternativa A1: Servicios de Angular

Consiste en utilizar servicios de Angular para compartir información y administrar el estado de la aplicación.

**Ventajas:**

- Es una solución integrada con Angular.
- Permite compartir información entre diferentes componentes.
- Facilita centralizar operaciones y datos.
- Es relativamente sencilla para un proyecto de tamaño pequeño o mediano.
- Puede utilizar RxJS o Signals para gestionar cambios de estado.

**Desventajas:**

- Si no se organiza correctamente, los servicios pueden acumular demasiadas responsabilidades.
- Puede resultar difícil rastrear cambios cuando existen muchos estados compartidos.
- Se deben definir convenciones para evitar dependencias innecesarias.

#### Alternativa A2: NgRx

Consiste en utilizar una biblioteca de administración de estado basada en un flujo estructurado de acciones, reductores y selectores.

**Ventajas:**

- Proporciona una estructura clara para manejar estados complejos.
- Facilita rastrear las modificaciones del estado.
- Permite mantener un flujo de datos predecible.
- Es útil cuando existen muchas funcionalidades que comparten información.

**Desventajas:**

- Tiene una curva de aprendizaje mayor.
- Requiere escribir más código y mantener estructuras adicionales.
- Puede ser excesivo para una aplicación pequeña o mediana.

### B. Navegación

#### Alternativa B1: Angular Router integrado con Ionic

Utilizar Angular Router para definir las rutas y la navegación de la aplicación, junto con los componentes de Ionic para representar las pantallas.

**Ventajas:**

- Permite definir rutas para cada página.
- Facilita proteger rutas mediante guards.
- Se integra con la estructura de Angular.
- Permite utilizar componentes de navegación de Ionic.

**Desventajas:**

- Es necesario comprender la configuración de rutas.
- Una configuración incorrecta puede permitir el acceso a pantallas que deberían estar protegidas.

#### Alternativa B2: Navegación manual mediante eventos y condiciones

Controlar las pantallas mediante variables y condiciones dentro de los componentes.

**Ventajas:**

- Puede ser sencilla para interfaces muy pequeñas.
- Permite controlar directamente qué contenido se muestra.

**Desventajas:**

- Puede complicarse cuando existen muchas pantallas.
- Dificulta mantener una navegación organizada.
- No proporciona por sí sola una estructura clara para proteger rutas.

### C. Validaciones

#### Alternativa C1: Validaciones en formularios y servicios

Validar los datos desde los formularios y volver a comprobar las reglas importantes dentro de los servicios antes de enviar la información al backend.

**Ventajas:**

- Permite mostrar errores cerca de los campos.
- Evita enviar información incorrecta.
- Centraliza reglas de negocio importantes.
- Facilita reutilizar validaciones.

**Desventajas:**

- Se deben mantener coherentes las validaciones de formularios y servicios.
- Es necesario evitar duplicar reglas innecesariamente.

#### Alternativa C2: Validaciones únicamente en los formularios

Realizar las comprobaciones solamente en los componentes de entrada de datos.

**Ventajas:**

- Es sencillo de implementar inicialmente.
- Permite mostrar errores de forma inmediata.

**Desventajas:**

- Las reglas pueden quedar dispersas.
- Otros componentes podrían enviar información sin aplicar las mismas validaciones.
- No garantiza que las reglas de negocio se cumplan en todas las operaciones.

### D. Pruebas

#### Alternativa D1: Pruebas manuales

Comprobar las funcionalidades mediante la interacción directa con la aplicación.

**Ventajas:**

- Son fáciles de realizar inicialmente.
- Permiten comprobar el comportamiento visual.
- No requieren configurar herramientas adicionales para comenzar.

**Desventajas:**

- Requieren tiempo.
- Pueden omitirse escenarios.
- No garantizan que una funcionalidad siga funcionando después de cambios.

#### Alternativa D2: Pruebas automatizadas

Utilizar herramientas para ejecutar pruebas de manera automática.

**Ventajas:**

- Permiten repetir comprobaciones.
- Facilitan detectar errores después de cambios.
- Son útiles para verificar reglas de negocio y funcionalidades críticas.

**Desventajas:**

- Requieren configuración y aprendizaje.
- Pueden consumir tiempo adicional al inicio.
- Se deben mantener los casos de prueba.

## 3. Decisión propuesta

Se propone adoptar las siguientes estrategias:

### Manejo de estado

Utilizar **servicios de Angular** para compartir información y administrar el estado de la aplicación.

Cuando sea necesario, se podrán utilizar RxJS o Signals para notificar cambios en los datos.

No se propone incorporar NgRx inicialmente porque podría añadir complejidad innecesaria para el alcance del proyecto.

### Navegación

Utilizar **Angular Router integrado con Ionic**.

Ionic proporciona los componentes visuales y la integración de navegación, mientras que Angular Router administra las rutas de la aplicación.

Se deberán definir rutas protegidas para evitar que usuarios no autenticados o sin permisos accedan a determinadas pantallas.

### Validaciones

Realizar validaciones en dos niveles:

1. **Formularios:** comprobar campos obligatorios, formatos y valores permitidos antes de enviar la información.
2. **Servicios y backend:** comprobar reglas de negocio y permisos antes de almacenar o modificar los datos.

Para los formularios se propone utilizar Reactive Forms de Angular.

### Gestión de errores y estados

La aplicación deberá mostrar estados explícitos:

- Cargando: cuando se está consultando o enviando información.
- Éxito: cuando una operación finaliza correctamente.
- Error: cuando ocurre un problema.
- Validación: cuando los datos ingresados no cumplen las reglas.

Los mensajes deberán ser comprensibles para el usuario y no mostrar información técnica sensible.

### Pruebas

Se propone comenzar con pruebas manuales organizadas mediante una lista de escenarios.

Se deberán priorizar las pruebas de autenticación, permisos, asignaciones, registro de actas, fotografías y resultados.

La incorporación de pruebas automatizadas podrá evaluarse según el tiempo disponible.

### Funcionalidad offline

El modo offline corresponde al requisito opcional R10.

Se propone dejarlo fuera del alcance inicial de los requisitos obligatorios y evaluarlo como una mejora independiente.

Si el equipo decide implementarlo, deberá documentar cómo se almacenarán los registros pendientes, cómo se sincronizarán y cómo se resolverán los conflictos.

**Decisión definitiva del equipo:** [Completar después de la reunión].

## 4. Consecuencias

**Consecuencias positivas:**

- Se contará con una estrategia sencilla para compartir información.
- La navegación estará organizada mediante rutas.
- Se podrán proteger las pantallas según el usuario autenticado.
- Las validaciones se realizarán antes de guardar información.
- Los usuarios recibirán mensajes claros sobre el estado de las operaciones.
- Se podrá comprobar el funcionamiento mediante escenarios de prueba.

**Consecuencias negativas o riesgos:**

- Los servicios pueden crecer demasiado si no se organizan.
- Las rutas deben protegerse correctamente.
- Las validaciones del cliente no sustituyen las validaciones del backend.
- Las pruebas manuales pueden dejar escenarios sin comprobar.
- La sincronización offline puede introducir conflictos y complejidad adicional.

**Medidas para reducir los riesgos:**

- Mantener servicios separados por funcionalidad.
- Utilizar guards y permisos en las rutas.
- Aplicar reglas de autorización en el backend.
- Mantener una lista de pruebas.
- Documentar los errores encontrados y corregidos.
- Evaluar R10 únicamente después de completar los requisitos obligatorios.

## 5. Verificación

Se comprobarán los siguientes escenarios:

**Manejo de estado:**

1. Iniciar sesión y mantener la información necesaria del usuario.
2. Compartir información entre páginas mediante servicios.
3. Comprobar que los cambios se reflejan correctamente.

**Navegación:** 4. Navegar entre las pantallas principales. 5. Intentar acceder a una ruta protegida sin iniciar sesión. 6. Intentar acceder a una pantalla que no corresponde al rol del usuario.

**Validaciones:** 7. Enviar un formulario vacío. 8. Introducir valores con formatos incorrectos. 9. Registrar resultados que no cumplan las reglas de consistencia. 10. Comprobar que los datos inválidos no se guardan.

**Gestión de errores:** 11. Simular una operación sin conexión. 12. Comprobar que se muestra un indicador de carga. 13. Comprobar que se muestra un mensaje de éxito. 14. Comprobar que se muestra un mensaje de error cuando una operación falla.

**Pruebas generales:** 15. Ejecutar los escenarios principales de cada rol. 16. Comprobar que las funcionalidades R1–R9 funcionan correctamente.

**Evidencias:** rutas, guards, servicios, formularios, mensajes de estado y registro de pruebas realizadas.

## 6. Uso de IA

- Claude
- DeepSeek

## 7. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-006-funcionamiento-aplicacion.md`
- **Commit de documentación:** ADR-006-funcionamiento-aplicacion

## 8. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Objeciones o desacuerdos:** De acuerdo.

**Acuerdo final:** Servicios de Angular, Navegación manual mediante eventos y condiciones, Validaciones en formularios y servicios; y Pruebas manuales.

**Minuto del video:** `41:32`.
