// ============================================================
//  Carrega e centraliza as variaveis de ambiente.
//  Qualquer parte do codigo importa daqui em vez de ler
//  process.env espalhado.
// ============================================================
require("dotenv").config();

const env = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "segredo-inseguro-de-desenvolvimento",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
};

// Aviso util em desenvolvimento se o segredo nao foi configurado.
if (!process.env.JWT_SECRET) {
  console.warn(
    "[AVISO] JWT_SECRET nao definido no .env - usando valor padrao inseguro."
  );
}

module.exports = env;
