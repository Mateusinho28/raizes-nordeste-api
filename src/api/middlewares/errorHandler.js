// ============================================================
//  Tratamento central de erros
//
//  Qualquer erro (lancado com next(err) ou em rota async)
//  cai aqui e e convertido para o JSON padronizado da API.
//  Isso garante que TODA falha tenha o mesmo formato.
// ============================================================
const { ZodError } = require("zod");
const { AppError } = require("../../domain/errors");

// Monta o corpo padrao de erro.
function corpoErro(error, message, details, req) {
  return {
    error,
    message,
    details: details || [],
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
}

function errorHandler(err, req, res, _next) {
  // 1) Erro de validacao do Zod -> 422 com a lista de campos.
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      issue: e.message,
    }));
    return res
      .status(422)
      .json(corpoErro("VALIDACAO", "Dados invalidos.", details, req));
  }

  // 2) Erro de aplicacao conhecido (regras de negocio).
  if (err instanceof AppError || err.isAppError) {
    return res
      .status(err.statusCode)
      .json(corpoErro(err.error, err.message, err.details, req));
  }

  // 3) Violacao de unique do Prisma (ex.: email ja cadastrado) -> 409.
  if (err.code === "P2002") {
    const campo = err.meta?.target?.[0] || "campo";
    return res
      .status(409)
      .json(
        corpoErro(
          "CONFLITO",
          `Ja existe um registro com este ${campo}.`,
          [{ field: campo, issue: "valor duplicado" }],
          req
        )
      );
  }

  // 4) Qualquer outro erro inesperado -> 500 (sem vazar detalhes internos).
  console.error("[ERRO INTERNO]", err);
  return res
    .status(500)
    .json(corpoErro("ERRO_INTERNO", "Ocorreu um erro inesperado.", [], req));
}

// Rota nao encontrada (404) padronizada.
function notFound(req, res) {
  res
    .status(404)
    .json(corpoErro("ROTA_NAO_ENCONTRADA", "Rota nao encontrada.", [], req));
}

module.exports = { errorHandler, notFound };
