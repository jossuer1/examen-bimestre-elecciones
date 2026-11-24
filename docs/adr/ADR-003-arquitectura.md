# ADR-003: Organización de la arquitectura y estructura del proyecto

**Estado:** Propuesto.

**Fecha:** 2026-11-21.

**Autores y equipo:** Todos los integrantes del equipo.

**Requisitos relacionados:** R2, R4, R5, R6 y R9.

## 1. Contexto

La aplicación tendrá diferentes funcionalidades relacionadas con la autenticación, administración de usuarios, gestión de recintos, asignación de veedores, registro de actas y consulta de resultados.

Es necesario establecer una arquitectura que permita organizar el código, separar responsabilidades y facilitar el mantenimiento.

El requisito R9 solicita separar tres responsabilidades principales:

- Presentación.
- Lógica de negocio.
- Acceso a datos.

La arquitectura deberá ser suficientemente clara para que todos los integrantes puedan implementarla de manera individual manteniendo una estructura común.

## 2. Alternativas consideradas

### Alternativa A: Arquitectura por capas

Consiste en organizar el proyecto según las responsabilidades de cada parte.

Las capas principales serían:

- Presentación: páginas y componentes visuales.
- Lógica de negocio: servicios que contienen las reglas y operaciones.
- Acceso a datos: servicios encargados de comunicarse con el backend.

**Ventajas:**

- Es sencilla de comprender.
- Permite separar las responsabilidades.
- Facilita localizar los componentes según su función.
- Es adecuada para proyectos pequeños y medianos.

**Desventajas:**

- Las funcionalidades pueden quedar distribuidas en muchas carpetas.
- Los cambios de una funcionalidad pueden afectar diferentes partes del proyecto.
- Si no se establecen convenciones, algunos servicios pueden acumular demasiadas responsabilidades.

### Alternativa B: Arquitectura modular por funcionalidades

Consiste en organizar el proyecto según las funcionalidades principales del sistema.

Por ejemplo:

- Autenticación.
- Usuarios.
- Recintos.
- Mesas.
- Actas.
- Resultados.

Cada módulo contiene los componentes, páginas y servicios relacionados con su funcionalidad.

**Ventajas:**

- Facilita localizar todo lo relacionado con una funcionalidad.
- Permite mantener el código organizado.
- Favorece la reutilización de componentes.
- Facilita ampliar o modificar funcionalidades.

**Desventajas:**

- Es necesario definir correctamente los límites de cada módulo.
- Puede existir duplicación de código si no se reutilizan adecuadamente los elementos comunes.
- Requiere establecer convenciones compartidas.

### Alternativa C: Arquitectura combinada por funcionalidades y capas

Consiste en organizar primero el proyecto por funcionalidades y, dentro de cada una, separar las responsabilidades por capas.

Por ejemplo, el módulo de actas podría contener:

- Páginas y componentes para mostrar y registrar actas.
- Servicios con las reglas de validación.
- Servicios de acceso a datos para comunicarse con el backend.
- Modelos e interfaces para representar la información.

**Ventajas:**

- Combina la organización por funcionalidades con la separación de responsabilidades.
- Facilita el mantenimiento.
- Permite identificar claramente dónde se encuentra cada parte del código.
- Se adapta a las necesidades del proyecto.

**Desventajas:**

- Requiere establecer una estructura inicial.
- Puede generar carpetas adicionales.
- Si se aplica de manera excesiva, puede aumentar la complejidad innecesariamente.

## 3. Decisión propuesta

Se propone utilizar una **arquitectura combinada por funcionalidades y capas**.

La estructura inicial sugerida sería:

```text
src/
└── app/
    ├── core/
    │   ├── guards/
    │   ├── interceptors/
    │   └── services/
    │
    ├── shared/
    │   ├── components/
    │   ├── models/
    │   └── pipes/
    │
    ├── features/
    │   ├── auth/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   └── services/
    │   │
    │   ├── usuarios/
    │   ├── recintos/
    │   ├── mesas/
    │   ├── actas/
    │   └── resultados/
    │
    ├── app.routes.ts
    └── app.config.ts
```

**Descripción de las carpetas:**

- `core`: elementos centrales de la aplicación, como autenticación, protección de rutas y servicios globales.
- `shared`: componentes, modelos y elementos reutilizables.
- `features`: funcionalidades principales del sistema.
- `pages`: pantallas que utiliza el usuario.
- `components`: elementos visuales reutilizables dentro de una funcionalidad.
- `services`: operaciones y reglas relacionadas con cada funcionalidad.

La estructura es una propuesta inicial y podrá ajustarse según las necesidades reales del proyecto.

**Decisión definitiva del equipo:** [Completar después de la reunión].

## 4. Consecuencias

**Consecuencias positivas:**

- Se mantendrá una separación clara de responsabilidades.
- Será más sencillo encontrar y modificar funcionalidades.
- Se facilitará la reutilización de componentes y servicios.
- Los integrantes podrán mantener una estructura similar en sus repositorios.

**Consecuencias negativas o riesgos:**

- Una separación excesiva puede generar demasiados archivos.
- Los servicios podrían acumular responsabilidades si no se organizan correctamente.
- Los módulos podrían depender demasiado unos de otros.

**Medidas para reducir los riesgos:**

- Mantener una estructura común.
- Evitar duplicar lógica de negocio.
- Utilizar modelos e interfaces para representar los datos.
- Mantener los componentes visuales enfocados en la presentación.
- Colocar las operaciones de comunicación con el backend en servicios específicos.

## 5. Verificación

La arquitectura se verificará comprobando que:

1. Las páginas no contienen directamente toda la lógica de negocio.
2. Los servicios se encargan de las operaciones correspondientes.
3. El acceso al backend se encuentra separado de los componentes visuales.
4. Los modelos representan las entidades principales.
5. Los componentes compartidos pueden reutilizarse.
6. Las funcionalidades se encuentran organizadas en carpetas identificables.

**Evidencias:** estructura de carpetas, componentes, servicios, modelos y rutas del proyecto.

## 6. Uso de IA

- Claude
- DeepSeek

## 7. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-003-arquitectura.md`
- **Commit de documentación:** ADR-003-arquitectura

## 8. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Objeciones o desacuerdos:** Desacuerdo entre funcionalidades con capas y capas.

**Acuerdo final:** Capas.

**Minuto del video:** `22:18`.
