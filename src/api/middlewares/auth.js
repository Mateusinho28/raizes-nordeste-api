// ============================================================
//  Middlewares de Autenticacao (JWT) e Autorizacao (perfis)
// ============================================================
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { Erros } = require("../../domain/errors");

/**
 * autenticar: exige um token JWT valido no header Authorization.
 * Formato esperado:  Authorization: Bearer <token>
 * Em sucesso, popula req.usuario com { id, nome, perfil }.
 */
function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return next(Erros.naoAutenticado("Envie o token no header: Authorization: Bearer <token>."));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.usuario = {
      id: payload.sub,
      nome: payload.nome,
      perfil: payload.perfil,
    };
    return next();
  } catch (err) {
    return next(Erros.naoAutenticado("Token invalido ou expirado."));
  }
}

/**
 * autorizar(...perfis): so deixa passar se o usuario logado
 * tiver um dos perfis informados.
 * Uso: router.post("/", autenticar, autorizar("ADMIN", "GERENTE"), handler)
 */
function autorizar(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(Erros.naoAutenticado());
    }
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return next(
        Erros.semPermissao(
          `Acao restrita aos perfis: ${perfisPermitidos.join(", ")}.`
        )
      );
    }
    return next();
  };
}

module.exports = { autenticar, autorizar };
