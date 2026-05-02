# Pathly - Plataforma Educativa Cloud Native 🚀
*(Proyecto CN Education)*
Bienvenido al repositorio principal de **Pathly**, una plataforma educativa moderna, dinámica y segura diseñada bajo filosofía Cloud Native. Pathly revoluciona la manera en que los estudiantes descubren, organizan y consumen el contenido de aprendizaje, ofreciendo rutas estructuradas que evolucionan según la dificultad y las etiquetas del contenido.
## 📖 Sobre el Proyecto
Pathly conecta a profesores y alumnos en un entorno altamente seguro. Los educadores pueden subir y estructurar material multimedia, mientras que los alumnos construyen y cursan trayectorias personalizadas.
El sistema guía al estudiante mediante taxonomías estructuradas, un algoritmo de **Secuenciación Lógica** de contenidos y un seguimiento porcentual en tiempo real del progreso.
---
## 🏗️ Arquitectura del Sistema
La solución está implementada bajo un enfoque de **Microservicios Desacoplados** y **Persistencia Políglota**, operando detrás de un API Gateway centralizado.
### Persistencia de Datos Distribuida (Dos Zonas)
El modelo de datos se divide estratégicamente para optimizar la carga, garantizar la integridad y separar responsabilidades:
*   **🛡️ Zona A (Identidad y Seguridad):** Gestiona el registro, autenticación, perfiles y políticas de seguridad. Emplea una Base de Datos Relacional **(Azure SQL)** para garantizar una consistencia transaccional absoluta y mantener la **Bitácora de Auditoría Forense** (Caja Negra).
*   **🎓 Zona B (Contenido y Aprendizaje):** Gestiona las rutas de aprendizaje, contenidos multimedia, sistema de papelera de reciclaje y progreso. Opera sobre una base de datos NoSQL **(Azure Cosmos DB / API MongoDB)**, ideal para la flexibilidad de metadatos y escalabilidad masiva.
### ☁️ Infraestructura Cloud Target (Microsoft Azure)
Toda la plataforma está diseñada para el ecosistema de Microsoft Azure:
*   **Ingesta de Contenidos:** Carga de archivos multimedia masivos directamente hacia **Azure Blob Storage** manejada a través del backend mediante procesos optimizados (Multer), aislando la carga de archivos del tráfico de las bases de datos.
*   **Gestión NoOps:** Escalabilidad garantizada por servicios administrados (PaaS) de Azure, sin necesidad de administrar servidores físicos.
---
## 🔐 Seguridad: "Defensa en Profundidad"
La plataforma toma la seguridad como prioridad número uno, implementando un blindaje multicapa en la Zona A:
1.  **Protección Anti-Secuestro de Sesión (IP Hijacking):** Middleware dinámico que revoca instantáneamente las sesiones activas si detecta un cambio no autorizado de IP.
2.  **Auditoría Forense (Caja Negra):** Registro inmutable en base de datos que captura el estado exacto (JSON anterior y posterior) de todas las transacciones críticas administrativas.
3.  **Validación Estricta de Esquemas (Zod):** "Frontera de seguridad" que sanitiza y valida el 100% de los datos entrantes (cargas de archivos, registros, perfiles) antes de tocar la lógica de negocio.
4.  **Escalating Lockout y Logs:** Sistema de castigo jerárquico que bloquea atacantes de fuerza bruta progresivamente (10min, 30min, etc.), respaldado por un panel de monitoreo de seguridad multinivel para el administrador.
5.  **Google reCAPTCHA v2:** Prevención nativa contra bots en los flujos de identidad.
---
## 🛠️ Stack Tecnológico
*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Zustand, Lucide React.
*   **API Gateway (BFF):** Node.js, Express, http-proxy-middleware.
*   **Microservicios Backend:** Node.js, Express, TypeScript, Zod, JWT.
*   **Bases de Datos:** Azure SQL Server (MSSQL), Azure Cosmos DB (MongoDB).
*   **Almacenamiento Cloud:** Azure Blob Storage.
---
## 📂 Estructura del Monorepo
```text
Proyecto-CN_Edcucation/
├── cn-frontend/          # Web Application UI (Next.js)
│   # Contiene los dashboards de estudiantes, admin de seguridad,
│   # consumo de rutas de aprendizaje y carga de contenido docente.
│
├── cd_gateway/           # API Gateway (Orquestador)
│   # Único punto de entrada público que recibe tráfico y lo 
│   # enruta de forma segura hacia la Zona A o Zona B.
│
├── cn_zona_a/            # Microservicio - Identidad y Seguridad
│   # Backend (SQL). Emite JWT, maneja seguridad forense, validación
│   # anti-hijacking y administración de usuarios.
│
├── cn_zona_b/            # Microservicio - Contenido y Rutas
│   # Backend (NoSQL). Lógica de secuenciación, CRUD de recursos,
│   # progreso de alumnos e integración con Azure Blob Storage.
│
└── CHANGELOG.md          # Bitácora histórica detallada de milestones.
🚀 Instalación y Desarrollo (Local)
Requisitos previos: Node.js, pnpm, e instancias locales/nube de SQL Server y MongoDB.

Crea los archivos .env en cada servicio basándote en los archivos .env.example o .env.template.
Asegúrate de ejecutar las migraciones necesarias en Zona A (migrate.ts).
Para levantar el ecosistema completo en desarrollo, necesitas ejecutar 3 terminales simultáneamente:

Terminal 1: Microservicio Zona A (Puerto 3000)

bash
cd cn_zona_a
pnpm install
pnpm dev
Terminal 2: API Gateway (Puerto 3002)

bash
cd cd_gateway
pnpm install
pnpm dev
Terminal 3: Frontend (Puerto 3001)

bash
cd cn-frontend
pnpm install
pnpm dev
