# Pathly - Plataforma Educativa (Proyecto CN Education)

Bienvenido al repositorio principal de **Pathly** (CN Education), una plataforma educativa dinámica e interactiva diseñada para revolucionar la manera en que los estudiantes descubren, organizan y consumen el contenido de aprendizaje.

## 📖 Sobre el Proyecto

Pathly es un sistema educativo donde **profesores seleccionados** pueden subir y organizar contenido orientado a sus materias. Por el otro lado, los **alumnos** ingresan a la plataforma para construir y cursar **rutas de aprendizaje completamente personalizadas**. 

El sistema guía al estudiante mediante taxonomías estructuradas, reglas lógicas de secuenciación de contenidos, calificaciones interactivas y, finalmente, evaluaciones de validación de conocimientos.

--- 

## 🏗️ Arquitectura del Sistema

La solución está implementada bajo un enfoque de **Microservicios Desacoplados y Orientada a Eventos (EDA)**. 

### Persistencia de Datos Distribuida (Dos Zonas)
El modelo de datos se divide en dos zonas independientes para optimizar transacciones, disponibilidad y el tipo de carga:

* **Zona A (Identidad y Seguridad):** Gestiona el registro, autenticación, perfiles de usuario y políticas de seguridad (bloqueos, logs y control de intentos fallidos). Emplea una **Base de Datos Relacional (SQL)** para garantizar profunda consistencia transaccional e integridad de las identidades.
* **Zona B (Contenido y Aprendizaje):** (En desarrollo). Gestionará el contenido de los profesores, algoritmos de rutas personalizadas basadas en *Tags*, foros, calificaciones e historial de progresos. Operará nativamente sobre una base de datos **NoSQL** , ideal para almacenar estructuras de documentos enriquecidos, con escalabilidad horizontal masiva para alta concurrencia de estudiantes.

### Infraestructura Cloud Target (Microsoft Azure)
Toda la plataforma y sus respectivos microservicios están diseñados para ser desplegados en la infraestructura cloud de **Microsoft Azure**, aprovechando de manera estratégica el programa y los créditos de *Azure for Students* (créditos de 100 USD) para realizar pruebas de concepto y desarrollos reales en la nube:

* **Ingesta de Contenidos y Media:** Carga directa a *Azure Blob Storage* mediante URL de firmas de acceso compartido (SAS), detonando flujos asíncronos en *Azure Functions* y *Azure Event Grid* para indexación automática sin golpear las bases de datos transaccionales.
* **Distribución Global:** Entrega de recursos estáticos e imágenes a velocidad máxima usando *Azure CDN*.
* **Identidad / Lógica Avanzada:** Integración futura y servicios base de identidad. Protección en endpoints con validaciones ReCAPTCHA y lógicas dinámicas administradas en código.

---

## 📂 Estructura del Monorepo

```plaintext
Proyecto-CN_Edcucation/
├── cn-frontend/          # Web Application UI
│   # Construido con Next.js, React, Zustand. Contiene todo el flujo 
│   # de los estudiantes, consumo de cursos, evaluaciones y panel docente.
│
├── cd_gateway/           # API Gateway (Orquestador / BFF)
│   # Aplicación Node.js/Express. Único punto de entrada público que
│   # recibe el tráfico de internet y lo enruta hacia la Zona A o Zona B.
│
├── cn_zona_a/            # Microservicio - Identidad y Acceso
│   # Backend Node.js conectado a SQL Server. Emite JWT, maneja
│   # registros mediante OTP (correos reales por Nodemailer), logs
│   # de seguridad, y un sofisticado esquema Escalating Lockout.
│
└── CHANGELOG.md          # Bitácora histórica y detallada de features.
```

---

## 🔐 Seguridad y Autenticación
La plataforma toma muy en serio la seguridad de los alumnos y profesores mediante el microservicio de la Zona A:

1. **Flujo de Registro (OTP):** Los correos son validados enviando códigos aleatorios obligatorios generados vía *Nodemailer* a las cuentas de correo antes de completar un registro.
2. **Control de Ataques y ReCAPTCHA:** Algoritmo dinámico que pide Google reCAPTCHA al detectar anomalías en los inicios de sesión.
3. **Escalating Lockout (Castigo Jerárquico):** Un sofisticado sistema en base de datos que bloquea atacantes, aumentando la penalización en periodos de tiempo estrictos (10min, 15min, 30min, 1 hora) dependiendo de su persistencia criminal.

---

## 🚀 Instalación y Desarrollo (Local)

1. **Requisitos:** Node.js, `pnpm` y una instancia de SQL Server (para Zona A).
2. **Entorno:** Crea los archivos `.env` basándote en los templates en cada carpeta. 
3. **Migraciones:** Zona A utiliza migraciones en crudo para asegurar que las tablas SQL existan al arrancar.

Para levantar el ecosistema completo en desarrollo, debes abrir múltiples terminales e inicializar todo respectivamente:

```bash
# Terminal 1: Zona A (Backend Identidad) Puerto 3000
cd cn_zona_a
pnpm install
pnpm dev

# Terminal 2: API Gateway Puerto 3002
cd cd_gateway
pnpm install
pnpm dev

# Terminal 3: Frontend (Next.js) Puerto 3001
cd cn-frontend
pnpm install
pnpm dev
```
*(Asegúrate de revisar el `CHANGELOG.md` para entender los flujos implementados de las últimas versiones).*
