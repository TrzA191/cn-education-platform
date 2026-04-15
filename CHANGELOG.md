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
