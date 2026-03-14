import { pool, poolConnect } from "./db";

export async function runMigrations() {
  await poolConnect;

  await pool.request().query(`
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users')
BEGIN
CREATE TABLE users(
 id INT IDENTITY(1,1) PRIMARY KEY,
 identity_provider_sub NVARCHAR(255) NULL,
 username NVARCHAR(100) UNIQUE NOT NULL,
 email NVARCHAR(255) UNIQUE NOT NULL,
 password_hash NVARCHAR(255) NULL,
 role NVARCHAR(20) DEFAULT 'student',
 created_at DATETIME2 DEFAULT GETDATE()
)
END
`);

  await pool.request().query(`
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles')
BEGIN
CREATE TABLE user_profiles(
 id INT IDENTITY(1,1) PRIMARY KEY,
 user_id INT UNIQUE,
 avatar_url NVARCHAR(500),
 bio NVARCHAR(MAX),
 country NVARCHAR(100),
 timezone NVARCHAR(100),
 language NVARCHAR(10) DEFAULT 'es',
 CONSTRAINT FK_user FOREIGN KEY (user_id)
 REFERENCES users(id) ON DELETE CASCADE
)
END
`);
}