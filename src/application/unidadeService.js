// ============================================================
//  unidadeService - unidades da rede + cardapio por unidade
// ============================================================
const prisma = require("../infrastructure/prisma");
const { Erros } = require("../domain/errors");

async function criar(dados) {
  return prisma.unidade.create({ data: dados });
}

async function listar() {
  return prisma.unidade.findMany({ orderBy: { nome: "asc" } });
}

async function buscarPorId(id) {
  const unidade = await prisma.unidade.findUnique({ where: { id } });
  if (!unidade) throw Erros.naoEncontrado(`Unidade ${id} nao encontrada.`);
  return unidade;
}

/**
 * Cardapio da unidade: produtos com estoque disponivel naquele local.
 * Atende ao requisito "consulta de cardapio por unidade".
 */
async function cardapio(unidadeId) {
  await buscarPorId(unidadeId); // garante 404 se unidade nao existe

  const estoques = await prisma.estoque.findMany({
    where: { unidadeId, disponivel: true, produto: { ativo: true } },
    include: { produto: true },
    orderBy: { produto: { nome: "asc" } },
  });

  // Monta a resposta focada no cardapio (produto + disponibilidade).
  return estoques.map((e) => ({
    produtoId: e.produto.id,
    nome: e.produto.nome,
    descricao: e.produto.descricao,
    categoria: e.produto.categoria,
    preco: e.produto.preco,
    sazonal: e.produto.sazonal,
    quantidadeDisponivel: e.quantidade,
  }));
}

module.exports = { criar, listar, buscarPorId, cardapio };
