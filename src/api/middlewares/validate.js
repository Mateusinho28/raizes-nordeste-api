// ============================================================
//  Middleware de validacao com Zod
//
//  Recebe um schema Zod e valida req.body (ou query/params).
//  Se invalido, lanca o ZodError que o errorHandler converte
//  em resposta 422 padronizada.
// ============================================================

/**
 * validar(schema, origem) -> middleware
 * @param {import("zod").ZodSchema} schema
 * @param {"body"|"query"|"params"} origem
 */
function validar(schema, origem = "body") {
  return (req, _res, next) => {
    try {
      // parse lanca ZodError se invalido; senao devolve dados "limpos".
      const dados = schema.parse(req[origem]);
      req[origem] = dados;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validar };
