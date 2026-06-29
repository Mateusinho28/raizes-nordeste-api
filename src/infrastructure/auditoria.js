// ============================================================
//  Servico de Auditoria
//
//  Registra acoes sensiveis na tabela logs_auditoria
//  (criacao/cancelamento de pedido, mudanca de status,
//  pagamento, login). Atende ao requisito de rastreabilidade
//  e auditoria citado no estudo de caso e na LGPD.
// ============================================================
const prisma = require("./prisma");

/**
 * Registra um evento de auditoria.
 * Nunca derruba a requisicao principal: se o log falhar,
 * apenas avisa no console (o negocio nao pode parar por causa do log).
 *
 * @param {object} dados
 * @param {number} [dados.usuarioId]  quem executou a acao
 * @param {string} dados.acao         ex.: "CRIAR_PEDIDO"
 * @param {string} dados.entidade     ex.: "Pedido"
 * @param {string|number} [dados.entidadeId]
 * @param {string} [dados.detalhe]
 * @param {string} [dados.ip]
 */
async function registrar({ usuarioId, acao, entidade, entidadeId, detalhe, ip }) {
  try {
    await prisma.logAuditoria.create({
      data: {
        usuarioId: usuarioId ?? null,
        acao,
        entidade,
        entidadeId: entidadeId != null ? String(entidadeId) : null,
        detalhe: detalhe ?? null,
        ip: ip ?? null,
      },
    });
  } catch (err) {
    console.error("[AUDITORIA] Falha ao registrar log:", err.message);
  }
}

module.exports = { registrar };
