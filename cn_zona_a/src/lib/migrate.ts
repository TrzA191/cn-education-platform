import { pool, poolConnect } from "./db";

export async function runMigrations() {
  await poolConnect;

  // ── users ────────────────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      id                    INT            IDENTITY(1,1) PRIMARY KEY,
      identity_provider_sub NVARCHAR(255)  NULL,
      username              NVARCHAR(100)  NOT NULL UNIQUE,
      email                 NVARCHAR(255)  NOT NULL UNIQUE,
      password_hash         NVARCHAR(255)  NULL,
      role                  NVARCHAR(20)   NOT NULL DEFAULT 'student',
      is_blocked            BIT            NOT NULL DEFAULT 0,
      failed_attempts       INT            NOT NULL DEFAULT 0,
      last_login_at         DATETIME2      NULL,
      password_changed_at   DATETIME2      NULL,
      created_at            DATETIME2      NOT NULL DEFAULT GETDATE()
    )
  `);

  // ── user_profiles ────────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
    CREATE TABLE user_profiles (
      id         INT           IDENTITY(1,1) PRIMARY KEY,
      user_id    INT           NOT NULL UNIQUE,
      avatar_url NVARCHAR(500),
      bio        NVARCHAR(MAX),
      country    NVARCHAR(100),
      timezone   NVARCHAR(100),
      language   NVARCHAR(10)  DEFAULT 'es',
      CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── failed_login_attempts ────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='failed_login_attempts' AND xtype='U')
    BEGIN
      CREATE TABLE failed_login_attempts (
        id           INT           IDENTITY(1,1) PRIMARY KEY,
        email        NVARCHAR(255) NOT NULL,
        ip_address   NVARCHAR(50)  NOT NULL,
        user_agent   NVARCHAR(500),
        attempted_at DATETIME2     NOT NULL DEFAULT GETDATE()
      )
      CREATE INDEX idx_failed_login_email
        ON failed_login_attempts(email, attempted_at)
    END
  `);

  // ── blocked_accounts ─────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='blocked_accounts' AND xtype='U')
    CREATE TABLE blocked_accounts (
      id            INT          IDENTITY(1,1) PRIMARY KEY,
      user_id       INT          NOT NULL,
      reason        NVARCHAR(50) NOT NULL
                      CONSTRAINT chk_blocked_reason
                      CHECK (reason IN ('intentos_fallidos','sospechoso','manual')),
      blocked_at    DATETIME2    NOT NULL DEFAULT GETDATE(),
      blocked_until DATETIME2,
      is_active     BIT          NOT NULL DEFAULT 1,
      CONSTRAINT fk_blocked_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── active_sessions ──────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='active_sessions' AND xtype='U')
    BEGIN
      CREATE TABLE active_sessions (
        id         INT           IDENTITY(1,1) PRIMARY KEY,
        user_id    INT           NOT NULL,
        token_hash NVARCHAR(500) NOT NULL UNIQUE,
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        created_at DATETIME2     NOT NULL DEFAULT GETDATE(),
        expires_at DATETIME2     NOT NULL,
        is_revoked BIT           NOT NULL DEFAULT 0,
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE
      )
      CREATE INDEX idx_sessions_token
        ON active_sessions(token_hash)
    END
  `);

  // ── security_logs ────────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='security_logs' AND xtype='U')
    BEGIN
      CREATE TABLE security_logs (
        id          INT           IDENTITY(1,1) PRIMARY KEY,
        user_id     INT,
        event_type  NVARCHAR(50)  NOT NULL
                      CONSTRAINT chk_event_type CHECK (event_type IN (
                        'login_failed','login_success','xss_attempt',
                        'idor_attempt','sqli_attempt','unauthorized_access',
                        'account_blocked','session_revoked',
                        'password_changed','suspicious_access'
                      )),
        description NVARCHAR(MAX) NOT NULL,
        ip_address  NVARCHAR(50),
        user_agent  NVARCHAR(500),
        severity    NVARCHAR(10)  NOT NULL
                      CONSTRAINT chk_severity
                      CHECK (severity IN ('bajo','medio','alto','critico')),
        status      NVARCHAR(20)  NOT NULL DEFAULT 'abierto'
                      CONSTRAINT chk_log_status
                      CHECK (status IN ('abierto','en_proceso','resuelto','cerrado')),
        created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_logs_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE SET NULL
      )
      CREATE INDEX idx_security_logs_severity
        ON security_logs(severity, created_at)
      CREATE INDEX idx_security_logs_event
        ON security_logs(event_type, created_at)
    END
  `);

  // ── audit_trail ──────────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_trail' AND xtype='U')
    BEGIN
      CREATE TABLE audit_trail (
        id         INT           IDENTITY(1,1) PRIMARY KEY,
        user_id    INT,
        table_name NVARCHAR(100) NOT NULL,
        record_id  INT           NOT NULL,
        action     NVARCHAR(10)  NOT NULL
                     CONSTRAINT chk_audit_action
                     CHECK (action IN ('INSERT','UPDATE','DELETE')),
        old_values NVARCHAR(MAX),
        new_values NVARCHAR(MAX),
        ip_address NVARCHAR(50),
        created_at DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE SET NULL
      )
      CREATE INDEX idx_audit_table_record
        ON audit_trail(table_name, record_id)
    END
  `);

  // ── verification_codes ───────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='verification_codes' AND xtype='U')
    BEGIN
      CREATE TABLE verification_codes (
        id         INT           IDENTITY(1,1) PRIMARY KEY,
        email      NVARCHAR(255) NOT NULL,
        code       NVARCHAR(10)  NOT NULL,
        expires_at DATETIME2     NOT NULL,
        created_at DATETIME2     NOT NULL DEFAULT GETDATE()
      )
      CREATE INDEX idx_verification_codes_email
        ON verification_codes(email)
    END
  `);

  console.log('✅ Migraciones ejecutadas correctamente');
}