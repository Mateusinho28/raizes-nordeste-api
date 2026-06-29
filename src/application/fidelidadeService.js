// ============================================================
//  fidelidadeService - pontos e resgate (com consentimento LGPD)
//
//  A carteira de fidelidade so existe para clientes que deram
//  consentimento (criada no cadastro). Pontos sao creditados no
//  pagamento aprovado (ver pagamentoService) e podem ser resgatados.
// ============================================================
const prisma = require("../infrastructure/prisma");
const { Erros } = require("../domain/errors");
const { TipoMovimentacaoFidelidade } = require("../domain/enums");

async function obterCarteira(clienteId) {
  const fidelidade = await prisma.fidelidade.findUnique({
    where: { clienteId },
    include: { movimentacoes: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!fidelidade) {
    throw Erros.naoEncontrado(
      "Cliente nao possui carteira de fidelidade (consentimento LGPD necessario)."
    );
  }
  return fidelidade;
}

async function saldo(clienteId) {
  const f = await obterCarteira(clienteId);
  return { clienteId, saldoPontos: f.saldoPontos };
}

async function historico(clienteId) {
  const f = await obterCarteira(clienteId);
  return f.movimentacoes;
}

/**
 * Resgata pontos do cliente (saldo nao pode ficar negativo).
 */
async function resgatar(clienteId, pontos, ctx = {}) {
  const f = await obterCarteira(clienteId);
  if (f.saldoPontos < pontos) {
    throw Erros.conflito("SALDO_INSUFICIENTE", "Pontos insuficientes para resgate.", [
      { field: "pontos", issue: `Saldo disponivel: ${f.saldoPontos}` },
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.fidelidade.update({
      where: { id: f.id },
      data: { saldoPontos: { decrement: pontos } },
    });
    await tx.movimentacaoFidelidade.create({
      data: {
        fidelidadeId: f.id,
        tipo: TipoMovimentacaoFidelidade.RESGATE,
        pontos,
        descricao: ctx.descricao || "Resgate de pontos",
      },
    });
    return { clienteId, saldoPontos: atualizada.saldoPontos, pontosResgatados: pontos };
  });
}

module.exports = { obterCarteira, saldo, historico, resgatar };
