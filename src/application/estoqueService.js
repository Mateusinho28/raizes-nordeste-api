// ============================================================
//  estoqueService - controle de estoque por unidade
//
//  - movimentar: registra ENTRADA ou SAIDA e atualiza o saldo
//  - consultarPorUnidade: saldo de todos os produtos da unidade
//  Cada movimentacao gera um registro no historico (rastreabilidade).
// ============================================================
const prisma = require("../infrastructure/prisma");
const { Erros } = require("../domain/errors");
const { TipoMovimentacaoEstoque } = require("../domain/enums");
const auditoria = require("../infrastructure/auditoria");

/**
 * Movimenta o estoque de um produto numa unidade.
 * Cria o registro de estoque se ainda nao existir (na primeira ENTRADA).
 */
async function movimentar({ unidadeId, produtoId, tipo, quantidade, motivo }, ctx = {}) {
  // valida existencia de unidade e produto
  const [unidade, produto] = await Promise.all([
    prisma.unidade.findUnique({ where: { id: unidadeId } }),
    prisma.produto.findUnique({ where: { id: produtoId } }),
  ]);
  if (!unidade) throw Erros.naoEncontrado(`Unidade ${unidadeId} nao encontrada.`);
  if (!produto) throw Erros.naoEncontrado(`Produto ${produtoId} nao encontrado.`);

  const estoque = await prisma.estoque.findUnique({
    where: { unidadeId_produtoId: { unidadeId, produtoId } },
  });

  // Numa SAIDA o saldo nao pode ficar negativo.
  if (tipo === TipoMovimentacaoEstoque.SAIDA) {
    const saldoAtual = estoque?.quantidade || 0;
    if (saldoAtual < quantidade) {
      throw Erros.conflito(
        "ESTOQUE_INSUFICIENTE",
        "Saida maior que o saldo disponivel.",
        [{ field: "quantidade", issue: `Disponivel: ${saldoAtual}` }]
      );
    }
  }

  const delta = tipo === TipoMovimentacaoEstoque.ENTRADA ? quantidade : -quantidade;

  const resultado = await prisma.$transaction(async (tx) => {
    // upsert: cria o estoque na primeira entrada, senao atualiza o saldo
    const estoqueAtualizado = await tx.estoque.upsert({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
      create: { unidadeId, produtoId, quantidade: delta > 0 ? delta : 0 },
      update: { quantidade: { increment: delta } },
    });

    const movimentacao = await tx.movimentacaoEstoque.create({
      data: { unidadeId, produtoId, tipo, quantidade, motivo },
    });

    return { estoque: estoqueAtualizado, movimentacao };
  });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: "MOVIMENTAR_ESTOQUE",
    entidade: "Estoque",
    entidadeId: resultado.estoque.id,
    detalhe: `${tipo} ${quantidade} un. produto ${produtoId} na unidade ${unidadeId}`,
    ip: ctx.ip,
  });

  return resultado;
}

async function consultarPorUnidade(unidadeId) {
  const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
  if (!unidade) throw Erros.naoEncontrado(`Unidade ${unidadeId} nao encontrada.`);

  return prisma.estoque.findMany({
    where: { unidadeId },
    include: { produto: { select: { id: true, nome: true, categoria: true } } },
    orderBy: { produto: { nome: "asc" } },
  });
}

module.exports = { movimentar, consultarPorUnidade };
