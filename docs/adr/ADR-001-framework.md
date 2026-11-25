# ADR-001: Selección del framework

- **Estado:** Propuesto.
- **Fecha:** 2026-11-21.
- **Autores y equipo:** Todos los integrantes del equipo.
- **Requisitos relacionados:** Requisitos generales del proyecto. La aplicación debe desarrollarse utilizando Ionic con Angular (standalone) o Ionic React, junto con Capacitor.

## 1. Contexto

El proyecto requiere desarrollar una aplicación móvil para gestionar información del proceso electoral. La aplicación tendrá diferentes tipos de usuarios, formularios para registrar resultados, consultas de información, captura de fotografías, geolocalización y conexión con un servicio backend.

Es necesario seleccionar un framework que permita desarrollar una aplicación organizada, mantenible y compatible con Capacitor para su ejecución en dispositivos Android.

La tecnología elegida deberá ser utilizada por todos los integrantes para mantener una línea base común de desarrollo.

## 2. Alternativas consideradas

### Alternativa A: Ionic Angular

Utilizar Ionic con Angular en su modalidad standalone.

**Ventajas:**

- Angular permite organizar la aplicación mediante componentes, servicios, rutas e inyección de dependencias.
- Facilita separar la presentación de la lógica de negocio y el acceso a datos.
- Cuenta con herramientas para formularios, validaciones y navegación.
- Permite utilizar Capacitor para acceder a funcionalidades nativas del dispositivo.
- Es adecuado para proyectos que requieren una estructura organizada.

**Desventajas:**

- Tiene una curva de aprendizaje relacionada con conceptos como servicios, inyección de dependencias y ciclo de vida.
- Requiere comprender la estructura y convenciones propias de Angular.
- Puede implicar más estructura inicial que una solución más ligera.

### Alternativa B: Ionic React

Utilizar Ionic con React para desarrollar la interfaz y la lógica de la aplicación.

**Ventajas:**

- Permite construir interfaces mediante componentes reutilizables.
- Utiliza JSX para combinar estructura y lógica de presentación.
- Cuenta con un ecosistema amplio de bibliotecas.
- Puede integrarse con Capacitor para acceder a funcionalidades nativas.
- Es flexible para organizar la aplicación según las necesidades del equipo.

**Desventajas:**

- Requiere elegir y configurar algunas herramientas adicionales para organizar el estado y la lógica.
- La estructura del proyecto depende en mayor medida de las convenciones definidas por el equipo.
- Puede requerir acuerdos adicionales para mantener una arquitectura uniforme.

## 3. Decisión propuesta

Se propone utilizar *Ionic Angular* con arquitectura standalone como framework de desarrollo.

La propuesta se fundamenta en la experiencia adquirida durante el periodo académico y en la posibilidad de organizar el proyecto mediante componentes, páginas, servicios y rutas.


**Decisión definitiva del equipo:** [Pendiente].

## 4. Consecuencias

### Consecuencias positivas

- Se contará con una estructura común para todos los repositorios.
- Se facilitará la separación entre componentes visuales y servicios.
- Se podrán reutilizar componentes y lógica de negocio.
- Se tendrá compatibilidad con Capacitor para las funciones móviles.

### Consecuencias negativas o riesgos

- Los integrantes deberán conocer las convenciones de Angular.
- Una mala organización de componentes y servicios podría generar dependencias innecesarias.
- Si algún integrante tiene mayor experiencia con React, podría necesitar tiempo adicional para adaptarse.

### Medidas para reducir los riesgos

- Definir una estructura de carpetas común.
- Establecer convenciones de nombres.
- Documentar la organización del proyecto.
- Mantener la misma versión principal de las dependencias entre los integrantes.

## 5. Verificación

La decisión se verificará mediante los siguientes criterios:

- [ ] Crear un proyecto Ionic Angular standalone.
- [ ] Comprobar que la aplicación se ejecuta correctamente en el navegador.
- [ ] Configurar Capacitor para Android.
- [ ] Comprobar que se puede generar y ejecutar una compilación Android.
- [ ] Verificar que los tres integrantes utilizan el framework acordado.

**Evidencias:** estructura del proyecto, archivo `package.json`, configuración de Capacitor y ejecución de la aplicación.

## 6. Uso de IA

- Claude
- DeepSeek

## 7. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-001-framework.md`
- **Commit de documentación:** ADR-001-framework

## 8. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Url video:**

**Objeciones o desacuerdos:** https://www.youtube.com/watch?v=yp1nX2SUQw4.

**Acuerdo final:** Ionic + Angular.

**Minuto del video:** `2:35`.
