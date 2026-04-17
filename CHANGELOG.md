# CHANGELOG - Proyecto CN Education

Registro cronológico e histórico de modificaciones en el monorepo.

## [2026-04-14] Implementación Auth con OTP (Nodemailer)
**Carpeta: `cn_zona_a` (Backend API)**
- **Migraciones:** Creada tabla temporal `verification_codes` para expirar códigos.
- **Servicios:** Creación del servicio `src/lib/email.ts` integrando `nodemailer` usando SMTP (Gmail).
- **Rutas y Controladores:** Creado endpoint `/send-verification-code`. Modificado `/register` validando el código temporal contra SQL Server.

**Carpeta: `cd_gateway` (Gateway API)**
- Autorizada nueva ruta pública `POST /auth/send-verification-code` en el enrutamiento y proxy.

**Carpeta: `cn-frontend` (Frontend Next.js)**
- Modificado el formulario de Login/Registro (`login/page.tsx`) a dos pasos, integrando los estados y componentes controlados requeridos para el código de seguridad.

## [2026-04-15] Migración a Google reCAPTCHA y Bloqueo Escalonado
**Carpeta: `cn_zona_a` (Backend API)**
- **Verificación reCAPTCHA:** Eliminada la lógica simulada. Ahora se llama al API de Google `siteverify` mediante un `fetch` hacia el backend de Google para validar los tokens de reCAPTCHA recibidos.
- **Escalating Lockout:** Actualizada la lógica dinámica de bloqueos en `auth.controller.ts` para aplicar tiempos escalonados fijos (10, 15, 30 y 60 minutos) basándose en la persistencia del campo absoluto `failed_attempts` del usuario.
- **Timezone Fix SQL:** Refactorización en `security.service.ts` para que todas las inserciones del castigo utilicen `DATEADD(MINUTE)` dictado estrictamente por `GETUTCDATE()` dentro de SQL Server, anulando así discrepancias por la zona horaria del servidor (que anulaba los bloqueos).

**Carpeta: `cn-frontend` (Frontend Next.js)**
- **Integración del Token:** Modificado `login/page.tsx` para almacenar y utilizar de forma controlada el String del token (`captchaToken`) expedido por el componente `<CaptchaGate />`, adjuntándose dentro de los headers de inicio de sesión (`x-recaptcha-token`).
- **Rediseño UI (Dashboard SaaS):** Reestructuración total de `layout.tsx` y `dashboard/page.tsx`. Transición a modo oscuro para el Sidebar, barra superior (Top Bar) con notificaciones, migración de SVGs planos a `lucide-react`, y rediseño de las vistas usando *Grid* para mostrar tarjetas estilizadas con Tailwind CSS puro.
- **Rollout de UI (Fixes & Login):** Restaurados los enlaces `<Link>` perdidos y expansión de los estilos base de alta fidelidad hacia los controladores externos como `login/page.tsx`.

## [2026-04-16] Algoritmo de Recomendación y Rutas Automáticas
**Carpeta: `cn_zona_b` (Backend API)**
- **Modelos:** Agregado modelo interactivo `UserInterest` para el enrutamiento de perfil, se modificaron los campos de base de datos de contenido (`tags`, `difficulty_level`).
- **Endpoint Inteligente:** Se implementó `paths.controller.ts` > `generateSystemPath`, generando rutas (`is_system_generated: true`) ordenadas explícitamente desde la dificultad más elemental hacia la más avanzada y empacadas en auto-enroll.

**Carpeta: `cn-frontend` (Frontend Next.js)**
- **Perfil de Usuario:** Extensibilidad en `/perfil` integrando pills en el catálogo de las etiquetas generadas en Mongo y el binding para asignación de nuevos intereses por usuario.
- **Formulario de Carga:** Nueva selector de dificultad y categorización con Array de etiquetas conectadas de forma Reactiva desde la API (`/subir`).
- **Discovery Engine:** Refactorización visual en `/rutas`, la arquitectura del menú fue mejorada hacia una landing page donde se aloja el trigger manual de auto-sugerencias (`handleGenerate`) y renderizado "Premium" en tarjetas generadas por el sistema.
