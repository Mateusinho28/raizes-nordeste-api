// ============================================================
//  Gateway de Pagamento (MOCK)
//
//  Simula um provedor externo de pagamento. NAO processa
//  pagamento real - apenas representa o fluxo:
//    1. recebe a solicitacao (valor, metodo)
//    2. "processa" e devolve APROVADO ou RECUSADO
//    3. retorna um payload no formato que um gateway real usaria
//
//  Regra de simulacao (deterministica, para os testes):
//    - metodo "MOCK_RECUSADO" -> sempre RECUSADO
//    - valor <= 0              -> RECUSADO (valor invalido)
//    - demais casos            -> APROVADO
//  Tambem aceita "forcarStatus" para os cenarios de teste.
// ============================================================
const crypto = require("crypto");
const { StatusPagamento } = require("../domain/enums");

/**
 * Simula a chamada ao provedor externo de pagamento.
 * @param {object} req
 * @param {number} req.valor
 * @param {string} req.metodo          PIX | CARTAO | MOCK | MOCK_RECUSADO
 * @param {string} [req.forcarStatus]  APROVADO | RECUSADO (forca o resultado nos testes)
 * @returns {Promise<{status:string, transacaoId:string, payload:object}>}
 */
async function solicitarPagamento({ valor, metodo, forcarStatus }) {
  // Simula latencia de rede de um provedor externo.
  await new Promise((r) => setTimeout(r, 150));

  let status;
  if (forcarStatus === StatusPagamento.APROVADO || forcarStatus === StatusPagamento.RECUSADO) {
    status = forcarStatus;
  } else if (metodo === "MOCK_RECUSADO") {
    status = StatusPagamento.RECUSADO;
  } else if (!valor || valor <= 0) {
    status = StatusPagamento.RECUSADO;
  } else {
    status = StatusPagamento.APROVADO;
  }

  const transacaoId = "txn_" + crypto.randomUUID();

  // Payload no estilo do retorno de um gateway real.
  const payload = {
    transacaoId,
    status,
    valor,
    metodo,
    autorizadoEm: status === StatusPagamento.APROVADO ? new Date().toISOString() : null,
    motivoRecusa:
      status === StatusPagamento.RECUSADO ? "Pagamento recusado pelo provedor (mock)." : null,
    gateway: "MockPay v1",
  };

  return { status, transacaoId, payload };
}

module.exports = { solicitarPagamento };
