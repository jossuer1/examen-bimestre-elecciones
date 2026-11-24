# ADR-005: Selección de tecnologías para cámara, geolocalización y permisos del dispositivo

**Estado:** Propuesto.

**Fecha:** 2026-11-21.

**Autores y equipo:** Todos los integrantes del equipo.

**Requisitos relacionados:** R7.

## 1. Contexto

La aplicación debe permitir que los veedores registren fotografías de las actas electorales directamente desde el dispositivo móvil.

Además, debe obtener la ubicación geográfica del dispositivo y asociarla al registro del acta.

Para cumplir estos requerimientos, la aplicación debe acceder a la cámara y al GPS del dispositivo, gestionar los permisos correspondientes y mostrar mensajes cuando exista algún problema.

También se debe comprobar que la fotografía tenga una calidad suficiente antes de aceptar el registro.

## 2. Alternativas consideradas

### Alternativa A: Capacitor Camera y Capacitor Geolocation

Utilizar los plugins oficiales de Capacitor para acceder a la cámara y a la ubicación del dispositivo.

**Ventajas:**

- Permiten acceder a funcionalidades nativas desde la aplicación Ionic.
- Proporcionan una API que puede utilizarse desde el código de la aplicación.
- Facilitan la integración con Android.
- Permiten gestionar permisos del dispositivo.
- Se integran con el ecosistema Capacitor.

**Desventajas:**

- Requieren configurar correctamente los permisos.
- El comportamiento puede variar entre dispositivos.
- Es necesario gestionar errores cuando el usuario deniega los permisos.
- La precisión del GPS depende del dispositivo y de las condiciones ambientales.

### Alternativa B: Implementación mediante APIs web del navegador

Utilizar funcionalidades web como MediaDevices y Geolocation API.

**Ventajas:**

- Permiten acceder a cámara y ubicación desde navegadores compatibles.
- Pueden ser útiles para funcionalidades que se ejecutan directamente en la web.
- No requieren utilizar necesariamente un plugin nativo específico.

**Desventajas:**

- La disponibilidad depende del navegador y del entorno de ejecución.
- El comportamiento puede variar entre plataformas.
- El control de algunas funcionalidades nativas puede ser más limitado.
- Se debe verificar la compatibilidad con la aplicación empaquetada para Android.

### Alternativa C: Integración con plugins o bibliotecas externas

Utilizar bibliotecas de terceros para gestionar la cámara o la geolocalización.

**Ventajas:**

- Pueden ofrecer funcionalidades específicas adicionales.
- Algunas bibliotecas permiten personalizar el comportamiento.
- Pueden resolver necesidades que no cubran las APIs básicas.

**Desventajas:**

- Se debe comprobar su compatibilidad con las versiones utilizadas.
- Pueden introducir dependencias adicionales.
- Es necesario revisar su mantenimiento y documentación.
- Pueden aumentar la complejidad de configuración.

## 3. Decisión propuesta

Se propone utilizar:

- **Capacitor Camera** para capturar fotografías de las actas.
- **Capacitor Geolocation** para obtener la ubicación del dispositivo.

### Funcionamiento propuesto

**Captura de fotografías:**

1. El usuario selecciona la opción para registrar un acta.
2. La aplicación solicita el permiso de cámara cuando sea necesario.
3. Se abre la cámara del dispositivo.
4. El usuario captura la fotografía.
5. La aplicación muestra una vista previa.
6. Se permite revisar la imagen y repetir la captura si no tiene suficiente nitidez.
7. Una vez aceptada, la fotografía se prepara para su almacenamiento.

**Obtención de ubicación:**

1. La aplicación solicita el permiso de ubicación.
2. Se obtiene la latitud y longitud del dispositivo.
3. Se asocian las coordenadas al registro del acta.
4. Si no se puede obtener la ubicación, se informa al usuario y se gestiona el error.

**Decisión definitiva del equipo:** [Completar después de la reunión].

## 4. Consecuencias

**Consecuencias positivas:**

- Se podrán capturar fotografías directamente desde la aplicación.
- Se podrá registrar la ubicación geográfica de las actas.
- Se utilizarán herramientas integradas con Capacitor.
- Se podrá mantener una experiencia similar entre dispositivos compatibles.

**Consecuencias negativas o riesgos:**

- El usuario puede denegar los permisos.
- La cámara puede no estar disponible.
- La ubicación puede ser imprecisa o no estar disponible.
- Las fotografías pueden ocupar mucho espacio.
- La calidad de las imágenes puede variar según el dispositivo.

**Medidas para reducir los riesgos:**

- Mostrar mensajes claros cuando falten permisos.
- Permitir volver a solicitar permisos cuando corresponda.
- Mostrar una vista previa de la fotografía.
- Permitir repetir la captura.
- Gestionar errores de cámara y GPS.
- Validar que las coordenadas sean válidas antes de guardar el registro.

## 5. Verificación

Se realizarán las siguientes pruebas en un dispositivo Android:

1. Abrir la cámara desde la aplicación.
2. Capturar una fotografía.
3. Mostrar la vista previa.
4. Repetir la captura.
5. Comprobar que la fotografía se puede almacenar.
6. Obtener la latitud y longitud.
7. Comprobar que las coordenadas se guardan junto al acta.
8. Denegar el permiso de cámara y comprobar el mensaje mostrado.
9. Denegar el permiso de ubicación y comprobar el comportamiento.
10. Probar el funcionamiento cuando el GPS está desactivado.

**Criterio de aceptación:** cada acta registrada debe conservar su fotografía y, cuando el permiso y el dispositivo lo permitan, las coordenadas obtenidas. La aplicación debe informar claramente cuando no pueda acceder a estos recursos.

## 6. Uso de IA

- Claude
- DeepSeek

## 7. Trazabilidad

- **Archivo ADR:** `docs/adr/ADR-005-camara-y-geolocalizacion.md`
- **Commit de documentación:** ADR-005-camara-y-geolocalizacion

## 8. Consenso del equipo

- **Integrante 1:** Jossue Chulde.
- **Integrante 2:** Josue Patiño.
- **Integrante 3:** Mario Endara.

**Objeciones o desacuerdos:** Desacuerdo pero mencionando puntos clave de almacenamiento y permisos.

**Acuerdo final:** Capacitor Camera y Capacitor Geolocation.

**Minuto del video:** `35:48`.
