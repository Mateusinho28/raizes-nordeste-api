// ============================================================
//  pedidoService - regras de negocio do fluxo critico
//
//  Regras implementadas:
//   - canalPedido obrigatorio e valido (multicanalidade)
//   - unidade/produto inexistente -> 404
//   - estoque insuficiente -> 409 (ESTOQUE_INSUFICIENTE)
//   - precoUnitario "congelado" no momento da compra
//   - baixa de estoque + movimentacao SAIDA na criacao do pedido
//     (reserva o item; no cancelamento o estoque e devolvido)
//   - maquina de estados: so permite transicoes validas de status
//   - auditoria das acoes sensiveis (criar, mudar status)
// ============================================================
const prisma = require("../infrastructure/prisma");
const { Erros } = require("../domain/errors");
const {
  StatusPedido,
  TransicoesStatusPedido,
  TipoMovimentacaoEstoque,
} = require("../domain/enums");
const auditoria = require("../infrastructure/auditoria");

// Inclui itens (com produto) e pagamento nas respostas de pedido.
const includePadrao = {
  itens: { include: { produto: { select: { id: true, nome: true } } } },
  pagamento: true,
  unidade: { select: { id: true, nome: true, cidade: true } },
  cliente: { select: { id: true, nome: true } },
};

/**
 * Cria um pedido validando itens, estoque e calculando o total.
 * Tudo dentro de uma transacao: se qualquer item falhar, nada e gravado.
 */
async function criar(clienteId, { unidadeId, canalPedido, itens, metodoPagamento }, ctx = {}) {
  const pedido = await prisma.$transaction(async (tx) => {
    // 1) unidade precisa existir e estar ativa
    const unidade = await tx.unidade.findUnique({ where: { id: unidadeId } });
    if (!unidade || !unidade.ativo) {
      throw Erros.naoEncontrado(`Unidade ${unidadeId} nao encontrada ou inativa.`);
    }

    // 2) valida cada item: produto existe? tem estoque na unidade?
    let total = 0;
    const itensCalculados = [];
    const baixas = [];

    for (let i = 0; i < itens.length; i++) {
      const { produtoId, quantidade } = itens[i];

      const produto = await tx.produto.findUnique({ where: { id: produtoId } });
      if (!produto || !produto.ativo) {
        throw Erros.naoEncontrado(`Produto ${produtoId} nao encontrado ou inativo.`);
      }

      const estoque = await tx.estoque.findUnique({
        where: { unidadeId_produtoId: { unidadeId, produtoId } },
      });

      if (!estoque || !estoque.disponivel) {
        throw Erros.naoEncontrado(
          `Produto ${produtoId} nao esta disponivel na unidade ${unidadeId}.`
        );
      }

      if (estoque.quantidade < quantidade) {
        throw Erros.conflito(
          "ESTOQUE_INSUFICIENTE",
          "Nao ha quantidade suficiente para um ou mais itens.",
          [{ field: `itens[${i}].quantidade`, issue: `Disponivel: ${estoque.quantidade}` }]
        );
      }

      const subtotal = produto.preco * quantidade;
      total += subtotal;
      itensCalculados.push({ produtoId, quantidade, precoUnitario: produto.preco });
      baixas.push({ estoqueId: estoque.id, produtoId, quantidade });
    }

    // 3) cria o pedido com os itens
    const novo = await tx.pedido.create({
      data: {
        clienteId,
        unidadeId,
        canalPedido,
        status: StatusPedido.AGUARDANDO_PAGAMENTO,
        total: Number(total.toFixed(2)),
        itens: { create: itensCalculados },
      },
      include: includePadrao,
    });

    // 4) baixa de estoque + registro de movimentacao (SAIDA)
    for (const baixa of baixas) {
      await tx.estoque.update({
        where: { id: baixa.estoqueId },
        data: { quantidade: { decrement: baixa.quantidade } },
      });
      await tx.movimentacaoEstoque.create({
        data: {
          unidadeId,
          produtoId: baixa.produtoId,
          tipo: TipoMovimentacaoEstoque.SAIDA,
          quantidade: baixa.quantidade,
          motivo: `Pedido #${novo.id}`,
        },
      });
    }

    return novo;
  });

  // guarda o metodo de pagamento desejado para a etapa de pagamento (opcional)
  await auditoria.registrar({
    usuarioId: clienteId,
    acao: "CRIAR_PEDIDO",
    entidade: "Pedido",
    entidadeId: pedido.id,
    detalhe: `Canal ${canalPedido}, total R$ ${pedido.total}`,
    ip: ctx.ip,
  });

  return pedido;
}

/**
 * Lista pedidos com filtros (canalPedido, status) e paginacao.
 */
async function listar({ canalPedido, status, clienteId, unidadeId, page = 1, limit = 10 }) {
  const where = {};
  if (canalPedido) where.canalPedido = canalPedido;
  if (status) where.status = status;
  if (clienteId) where.clienteId = clienteId;
  if (unidadeId) where.unidadeId = unidadeId;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: includePadrao,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pedido.count({ where }),
  ]);

  return { data, page, limit, total, totalPaginas: Math.ceil(total / limit) };
}

async function buscarPorId(id) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: includePadrao,
  });
  if (!pedido) throw Erros.naoEncontrado(`Pedido ${id} nao encontrado.`);
  return pedido;
}

/**
 * Atualiza o status do pedido respeitando a maquina de estados.
 * Ao CANCELAR, devolve os itens ao estoque.
 */
async function atualizarStatus(id, novoStatus, ctx = {}) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: true },
  });
  if (!pedido) throw Erros.naoEncontrado(`Pedido ${id} nao encontrado.`);

  const permitidos = TransicoesStatusPedido[pedido.status] || [];
  if (!permitidos.includes(novoStatus)) {
    throw Erros.conflito(
      "TRANSICAO_INVALIDA",
      `Nao e possivel mudar de ${pedido.status} para ${novoStatus}.`,
      [{ field: "status", issue: `Transicoes validas: ${permitidos.join(", ") || "nenhuma"}` }]
    );
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    // Se cancelou, devolve estoque e registra movimentacao de ENTRADA.
    if (novoStatus === StatusPedido.CANCELADO) {
      for (const item of pedido.itens) {
        await tx.estoque.updateMany({
          where: { unidadeId: pedido.unidadeId, produtoId: item.produtoId },
          data: { quantidade: { increment: item.quantidade } },
        });
        await tx.movimentacaoEstoque.create({
          data: {
            unidadeId: pedido.unidadeId,
            produtoId: item.produtoId,
            tipo: TipoMovimentacaoEstoque.ENTRADA,
            quantidade: item.quantidade,
            motivo: `Estorno do pedido #${pedido.id} (cancelado)`,
          },
        });
      }
    }

    return tx.pedido.update({
      where: { id },
      data: { status: novoStatus },
      include: includePadrao,
    });
  });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: "ATUALIZAR_STATUS_PEDIDO",
    entidade: "Pedido",
    entidadeId: id,
    detalhe: `${pedido.status} -> ${novoStatus}`,
    ip: ctx.ip,
  });

  return atualizado;
}

module.exports = { criar, listar, buscarPorId, atualizarStatus, includePadrao };
