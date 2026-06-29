// ============================================================
//  Cliente Prisma (singleton)
//
//  Centraliza a unica instancia do PrismaClient usada por toda
//  a aplicacao. Importar daqui evita abrir varias conexoes.
// ============================================================
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
