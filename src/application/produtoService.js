// ============================================================
//  produtoService - catalogo de produtos (CRUD + consulta)
// ============================================================
const prisma = require("../infrastructure/prisma");
const { Erros } = require("../domain/errors");

async function criar(dados) {
  return prisma.produto.create({ data: dados });
}

/**
 * Lista produtos com paginacao e filtro opcional por categoria.
 */
async function listar({ categoria, page = 1, limit = 10 }) {
  const where = {};
  if (categoria) where.categoria = categoria;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.produto.findMany({ where, orderBy: { nome: "asc" }, skip, take: limit }),
    prisma.produto.count({ where }),
  ]);

  return { data, page, limit, total, totalPaginas: Math.ceil(total / limit) };
}

async function buscarPorId(id) {
  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) throw Erros.naoEncontrado(`Produto ${id} nao encontrado.`);
  return produto;
}

async function atualizar(id, dados) {
  await buscarPorId(id);
  return prisma.produto.update({ where: { id }, data: dados });
}

async function remover(id) {
  await buscarPorId(id);
  // "remocao logica": apenas inativa, preserva historico de pedidos.
  return prisma.produto.update({ where: { id }, data: { ativo: false } });
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };
