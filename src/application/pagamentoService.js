// ============================================================
//  pagamentoService - integracao (mock) e efeitos no pedido
//
//  Fluxo:
//   1. valida que o pedido existe e esta AGUARDANDO_PAGAMENTO
//   2. chama o gateway externo (mock)
//   3. registra o Pagamento (status + payload retornado)
//   4. APROVADO -> pedido vira PAGO + credita pontos de fidelidade
//      RECUSADO -> pedido continua aguardando, registra a recusa
//   5. audita a operacao
// ============================================================
const prisma = require("../infrastructure/prisma");
const { Erros } = require("../domain/errors");
const { StatusPedido, StatusPagamento, TipoMovimentacaoFidelidade } = require("../domain/enums");
const gateway = require("../infrastructure/gatewayPagamento");
const auditoria = require("../infrastructure/auditoria");

// 1 ponto de fidelidade a cada R$ 1,00 gasto (regra simples documentada).
function calcularPontos(valor) {
  return Math.floor(valor);
}

async function processar(pedidoId, { metodo = "MOCK", forcarStatus }, ctx = {}) {
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) throw Erros.naoEncontrado(`Pedido ${pedidoId} nao encontrado.`);

  if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
    throw Erros.conflito(
      "PEDIDO_NAO_PAGAVEL",
      `Pedido ${pedidoId} nao esta aguardando pagamento (status atual: ${pedido.status}).`
    );
  }

  // 2) chamada ao gateway externo (mock)
  const resultado = await gateway.solicitarPagamento({
    valor: pedido.total,
    metodo,
    forcarStatus,
  });

  // 3) registra/atualiza o pagamento (relacao 1:1 com o pedido)
  const aprovado = resultado.status === StatusPagamento.APROVADO;

  const resposta = await prisma.$transaction(async (tx) => {
    const pagamento = await tx.pagamento.upsert({
      where: { pedidoId },
      create: {
        pedidoId,
        status: resultado.status,
        metodo,
        valor: pedido.total,
        transacaoId: resultado.transacaoId,
        gatewayPayload: JSON.stringify(resultado.payload),
      },
      update: {
        status: resultado.status,
        metodo,
        transacaoId: resultado.transacaoId,
        gatewayPayload: JSON.stringify(resultado.payload),
      },
    });

    let pedidoAtualizado = pedido;

    if (aprovado) {
      // 4a) pedido aprovado -> PAGO
      pedidoAtualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: StatusPedido.PAGO },
      });

      // credita pontos de fidelidade SE o cliente tem carteira (consentiu LGPD)
      const fidelidade = await tx.fidelidade.findUnique({
        where: { clienteId: pedido.clienteId },
      });
      if (fidelidade) {
        const pontos = calcularPontos(pedido.total);
        if (pontos > 0) {
          await tx.fidelidade.update({
            where: { id: fidelidade.id },
            data: { saldoPontos: { increment: pontos } },
          });
          await tx.movimentacaoFidelidade.create({
            data: {
              fidelidadeId: fidelidade.id,
              tipo: TipoMovimentacaoFidelidade.ACUMULO,
              pontos,
              descricao: `Pagamento do pedido #${pedidoId}`,
              pedidoId,
            },
          });
        }
      }
    }

    return { pagamento, pedido: pedidoAtualizado };
  });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: "PROCESSAR_PAGAMENTO",
    entidade: "Pagamento",
    entidadeId: resposta.pagamento.id,
    detalhe: `Pedido #${pedidoId} - ${resultado.status}`,
    ip: ctx.ip,
  });

  return {
    pagamento: {
      ...resposta.pagamento,
      gatewayPayload: JSON.parse(resposta.pagamento.gatewayPayload),
    },
    pedido: resposta.pedido,
    aprovado,
  };
}

module.exports = { processar, calcularPontos };
