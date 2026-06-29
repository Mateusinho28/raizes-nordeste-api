// ============================================================
//  authService - regras de cadastro e autenticacao
//
//  - Senha NUNCA e salva em texto puro: usamos hash bcrypt.
//  - Login devolve um token JWT assinado.
//  - Nunca retornamos o campo senhaHash nas respostas (LGPD).
// ============================================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../infrastructure/prisma");
const env = require("../config/env");
const { Erros } = require("../domain/errors");
const { Perfil } = require("../domain/enums");

// Remove campos sensiveis antes de devolver o usuario na resposta.
function sanitizar(usuario) {
  if (!usuario) return usuario;
  const { senhaHash, ...seguro } = usuario;
  return seguro;
}

/**
 * Cadastra um novo usuario.
 * Clientes podem registrar consentimento LGPD; ao consentir,
 * criamos automaticamente a carteira de fidelidade.
 */
async function registrar({ nome, email, senha, perfil, consentimentoLGPD }) {
  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      perfil: perfil || Perfil.CLIENTE,
      consentimentoLGPD: Boolean(consentimentoLGPD),
      consentimentoEm: consentimentoLGPD ? new Date() : null,
    },
  });

  // Se cliente consentiu, cria a carteira de fidelidade (base legal: consentimento).
  if (usuario.perfil === Perfil.CLIENTE && usuario.consentimentoLGPD) {
    await prisma.fidelidade.create({ data: { clienteId: usuario.id } });
  }

  return sanitizar(usuario);
}

/**
 * Autentica o usuario e devolve o token JWT.
 */
async function login({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mesma mensagem para email inexistente e senha errada (nao revela qual falhou).
  if (!usuario || !usuario.ativo) {
    throw Erros.credenciaisInvalidas();
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {
    throw Erros.credenciaisInvalidas();
  }

  const accessToken = jwt.sign(
    { sub: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    accessToken,
    tokenType: "Bearer",
    user: sanitizar(usuario),
  };
}

module.exports = { registrar, login, sanitizar };
