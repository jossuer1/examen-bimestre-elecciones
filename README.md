# Control Electoral

Aplicación móvil para el seguimiento electoral en Quito, Pichincha. El coordinador provincial administra recintos y consulta avance, resultados y ubicaciones. El coordinador de recinto asigna veedores y corrige actas con historial. El veedor registra actas de alcalde y prefecto para sus mesas asignadas.

## Instalación y ejecución

Desde la carpeta `control-electoral`, con Node.js 24 LTS y npm:

```sh
npm ci
npm install -g @ionic/cli
npm start
```

Abre http://localhost:4200. Para probar con datos reales de demostración, prepara primero el proyecto Supabase como se indica abajo. La app necesita conexión para autenticarse y operar.

## Configuración pública de la app

Copia los valores de [la plantilla](src/environments/environment.example.ts) al archivo `src/environments/supabase.config.ts` y reemplázalos:

| Campo | Valor |
| --- | --- |
| `supabaseUrl` | URL del proyecto Supabase |
| `supabaseAnonKey` | Clave **publishable** del proyecto, con prefijo `sb_publishable_`. El nombre del campo se conserva por compatibilidad interna. |

`environment.ts` y `environment.prod.ts` importan esa configuración. Angular sustituye el primero por el segundo al compilar en producción. Todo valor de estos archivos queda visible en el paquete compilado. Las claves administrativas de Supabase y las credenciales de Cloudinary pertenecen a las Edge Functions.

## Preparar Supabase

En una base nueva, ejecuta estos archivos **en orden** desde el editor SQL:

| Orden | Archivo | Función |
| --- | --- | --- |
| 01 | [01_esquema.sql](supabase/01_esquema.sql) | Tablas, restricciones, RLS y generación automática de mesas. |
| 02 | [02_datos.sql](supabase/02_datos.sql) | Catálogos de Quito, candidaturas y recintos de ejemplo. |
| 03 | [03_seguridad.sql](supabase/03_seguridad.sql) | Políticas iniciales y búsqueda de correo por cédula. |
| 04 | [04_provincial.sql](supabase/04_provincial.sql) | Archivo vacío. Crea el perfil provincial manualmente como se indica abajo. |
| 05 | [05_mesas_veedor.sql](supabase/05_mesas_veedor.sql) | Limita al veedor a las mesas asignadas. |
| 06 | [06_registrar_actas.sql](supabase/06_registrar_actas.sql) | Registro transaccional de actas y votos. |
| 07 | [07_clave_cambiada.sql](supabase/07_clave_cambiada.sql) | Confirma el cambio de contraseña con un trigger en Auth. |
| 08 | [08_dashboard.sql](supabase/08_dashboard.sql) | Consultas provinciales de avance, resultados y GPS. |
| 09 | [09_corregir_acta.sql](supabase/09_corregir_acta.sql) | Corrección y auditoría transaccional, con autorización de fotos nuevas. |

En un proyecto existente, aplica solo los scripts pendientes en ese mismo orden. Deshabilita el registro público de usuarios, conserva la confirmación por correo y configura la entrega de correo para las cuentas de prueba. En **Authentication → Email Templates → Reset password**, usa el asunto `Código para recuperar tu contraseña de Control Electoral` y este cuerpo:

```html
<h2>Recupera tu contraseña de Control Electoral</h2>
<p>Introduce este código en la aplicación para elegir una nueva contraseña:</p>
<p><strong>{{ .Token }}</strong></p>
<p>Si no solicitaste el cambio, puedes ignorar este correo.</p>
```

### Edge Functions

En una sesión autorizada de Supabase CLI y desde la carpeta del proyecto:

```sh
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy crear-usuario
supabase functions deploy registrar-acta
supabase functions deploy corregir-acta
supabase functions deploy foto-url
```

Despliega desde el repositorio para incluir `supabase/functions/_shared/`. Configura en **Edge Functions → Secrets** los valores `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. Las funciones usan también `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` del entorno de servidor. Comprueba que ese entorno los proporcione. Las fotos se suben con `type=authenticated`. Para verlas, `foto-url` aplica RLS con el JWT del usuario y emite un enlace de cinco minutos.

### Cuentas de demostración

El repositorio incluye datos electorales de ejemplo. Las cuentas de Auth se crean en tu instancia:

1. En **Authentication → Users**, crea y confirma una cuenta provincial de prueba con un correo que controles y una contraseña que elijas. Copia el UUID que le asigna Auth.
2. En `public.perfiles`, inserta una fila con ese UUID en `id`, el mismo correo, cédula, nombres, apellidos y teléfono de prueba, `rol = 'provincial'`, `recinto_id = null` y `debe_cambiar_clave = true`.
3. Entra como provincial y crea un coordinador de recinto. Confirma su correo, inicia sesión como ese coordinador y crea un veedor. Confirma también su correo y asígnalo a una mesa. Las altas hechas en la app usan la contraseña inicial de demostración `Ecuador2026`, que se cambia al entrar.

La prueba automatizada de acceso usa `1712345675`, `coord@example.test` y `clave-de-prueba` con respuestas simuladas. Esos valores por sí solos no permiten iniciar sesión contra Supabase.

## Arquitectura y modelo de datos

- **Presentación** — Pantallas y componentes standalone de Ionic Angular, formularios reactivos y signals. Angular Router y el resolver de acceso gestionan las transiciones por rol.
- **Servicios y validadores** — Reglas de autenticación, cuadre de votos y lógica de las funcionalidades.
- **Acceso a datos** — Los repositorios llaman a Supabase Auth, Postgres y Edge Functions. Las Edge Functions gestionan Cloudinary y las operaciones administrativas.
- **Modelos** — Tipos de dominio y contratos de lectura y escritura.

La geografía sigue `provincias → cantones → parroquias → recintos → mesas`. Los perfiles se vinculan con `auth.users` y contienen el rol y el recinto. Hay hasta dos actas por mesa, una por cargo. `acta_votos` vincula cada acta con sus candidaturas, que pertenecen a organizaciones. `acta_ediciones` conserva el historial. `actas` guarda además el GPS y la referencia a la fotografía.

## Pruebas

```sh
npx tsc --noEmit -p tsconfig.app.json
npx ngc --noEmit -p tsconfig.app.json
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

`npm test` ejecuta unitarias y E2E en serie. Playwright puede iniciar el servidor de desarrollo y simula llamadas al backend en los flujos cubiertos. Prueba aparte los tres roles, RLS, el envío de correo, la cámara, el GPS y Cloudinary contra el proyecto de demostración.

## APK debug para Android

Instala JDK 21 y el SDK de Android Platform 36. Usa un SDK configurado en Android Studio o disponible mediante `ANDROID_HOME`. Desde la raíz del proyecto en PowerShell:

```powershell
ionic build --prod
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug
```

La salida esperada es `android/app/build/outputs/apk/debug/app-debug.apk`, relativa a la raíz del proyecto. El APK debug se instala para pruebas.

Para compilar desde Android Studio 2025.2.1 o posterior, ejecuta primero los dos comandos de Ionic y Capacitor desde la raíz. Abre la carpeta `android` como proyecto. En **Tools → SDK Manager**, instala **Android API 36** y **Android SDK Build-Tools**. En **Settings → Build, Execution, Deployment → Build Tools → Gradle**, selecciona JDK 21. Sincroniza Gradle, selecciona la variante `debug` del módulo `app` y usa **Build → Generate Bundle(s) / APK(s) → Generate APK(s)**. También puedes ejecutar `:app:assembleDebug` desde la ventana de Gradle. [Requisitos de Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup) · [Menú de compilación de Android Studio](https://developer.android.com/build/build-for-release)


## Credenciales de Prueba

```PROVINCIAL
1710034065
Ecuador2026*
```
```RECINTO
1729212405
Ecuador2026*
```
```VEEDOR
0215634874
Ecuador2026*
```
