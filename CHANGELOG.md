# CHANGELOG - Proyecto CN Education

Registro cronológico e histórico de modificaciones en el monorepo.

pnpm add -D @types/nodemailer
## [2026-04-14] Implementación Auth con OTP (Nodemailer)
**Carpeta: `cn_zona_a` (Backend API)**
- **Migraciones:** Creada tabla temporal `verification_codes` para expirar códigos.
- **Servicios:** Creación del servicio `src/lib/email.ts` integrando `nodemailer` usando SMTP (Gmail).
- **Rutas y Controladores:** Creado endpoint `/send-verification-code`. Modificado `/register` validando el código temporal contra SQL Server.

**Carpeta: `cd_gateway` (Gateway API)**
- Autorizada nueva ruta pública `POST /auth/send-verification-code` en el enrutamiento y proxy.

**Carpeta: `cn-frontend` (Frontend Next.js)**
- Modificado el formulario de Login/Registro (`login/page.tsx`) a dos pasos, integrando los estados y componentes controlados requeridos para el código de seguridad.
