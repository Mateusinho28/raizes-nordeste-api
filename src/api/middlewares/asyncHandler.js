// ============================================================
//  asyncHandler
//
//  O Express 4 nao captura automaticamente erros lancados
//  dentro de funcoes async (Promises rejeitadas). Este wrapper
//  envolve o handler e encaminha qualquer erro para o
//  errorHandler via next(err). Evita try/catch repetido.
// ============================================================
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
