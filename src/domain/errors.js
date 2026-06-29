// ============================================================
//  Erros de dominio + padrao de resposta de erro
//
//  Todas as falhas da API seguem o MESMO formato JSON,
//  conforme exigido pelo roteiro:
//  {
//    "error": "NOME_DO_ERRO",
//    "message": "Mensagem legivel",
//    "details": [ { "field": "...", "issue": "..." } ],
//    "timestamp": "ISO-8601",
//    "path": "/rota"
//  }
// ============================================================

// Erro de aplicacao com status HTTP associado.
// Lancamos isso nas regras de negocio e o errorHandler converte
// para a resposta JSON padronizada.
class AppError extends Error {
  constructor(statusCode, error, message, details = []) {
    super(message);
    this.statusCode = statusCode; // ex.: 404
    this.error = error; // ex.: "NAO_ENCONTRADO"
    this.details = details; // lista de { field, issue }
    this.isAppError = true;
  }
}

// Atalhos para os erros mais comuns (deixam o codigo mais limpo)
const Erros = {
  naoAutenticado: (msg = "Token ausente ou invalido.") =>
    new AppError(401, "NAO_AUTENTICADO", msg),

  semPermissao: (msg = "Voce nao tem permissao para esta acao.") =>
    new AppError(403, "SEM_PERMISSAO", msg),

  naoEncontrado: (msg = "Recurso nao encontrado.") =>
    new AppError(404, "NAO_ENCONTRADO", msg),

  conflito: (error, msg, details = []) =>
    new AppError(409, error, msg, details),

  validacao: (msg = "Dados invalidos.", details = []) =>
    new AppError(422, "VALIDACAO", msg, details),

  credenciaisInvalidas: () =>
    new AppError(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha invalidos."),

  regraNegocio: (error, msg, status = 409, details = []) =>
    new AppError(status, error, msg, details),
};

module.exports = { AppError, Erros };
