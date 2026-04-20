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

## [2026-04-17] Rediseño UI/UX de Rutas de Aprendizaje
**Carpeta: `cn-frontend` (Frontend Next.js)**
- **Perfil de Usuario:** Se eliminó la configuración de "Mis Intereses", delegando este paso hacia la experiencia de creación misma para un flujo más natural.
- **Rutas Pincipales (`/rutas`):** Modernización del botón principal eliminando alusiones y estética "IA". Se integró un modal de configuración que aparece antes de la creación que fuerza al usuario a escoger tags para mejorar sus recomendaciones.
- **Dashboard de Ruta Individual (`/rutas/[id]`):** Rediseño total usando layout de dos columnas, reemplazando la lista básica de recursos por un Timeline Vertical con el progreso por módulo y un panel estático con métricas (tiempo y avance).

## [2026-04-20] Gestión de Usuarios, Reestructuración Admin y Privacidad
**Carpeta: `cn_zona_a` (Backend API)**
- **CRUD Administrativo:** Implementados métodos `createUser`, `updateUser` y `deleteUser` en `users.controller.ts` para permitir la administración manual de cuentas fuera del flujo de registro público.
- **Auditoría:** Integrado `logSecurityEvent` en las acciones administrativas para mantener una bitácora de quién (admin) modificó a quién (usuario).
- **Rutas:** Registrados nuevos endpoints bajo el middleware de protección `auth("admin")`.

**Carpeta: `cn_zona_b` (Backend API Content)**
- **Protección de Identidad:** Corregida fuga de datos en Rutas de Aprendizaje. Se protegieron los endpoints `GET /api/paths` con el middleware `authenticate` y se añadieron filtros obligatorios por `creator_id` en las consultas de MongoDB. Ahora las rutas son privadas por defecto para el usuario que las crea.

**Carpeta: `cn-frontend` (Frontend Next.js)**
- **Arquitectura de Navegación Admin:** Reestructuración masiva del Panel de Control (`admin/page.tsx`). Se implementó un sistema de categorías de alto nivel (Gestión de Cuentas vs Seguridad) para desacoplar las tareas operativas de las de auditoría.
- **Módulo de Gestión:** Nueva interfaz con tablas de acciones dinámicas (Editar/Eliminar) y formularios modales para el escalamiento de profesores y alumnos.
- **Experiencia de Usuario (Modales SaaS):** Eliminadas las alertas nativas del navegador (`confirm`, `alert`). Se implementó un componente de `ConfirmModal` personalizado con transiciones de Framer-motion style (animate-in) y estados visuales para Éxito, Error y Eliminación.
- **Look & Feel SaaS Premium:** Refinamiento visual usando `lucide-react`, gradientes en tarjetas de estadísticas y estados de carga (`Loader2`).
