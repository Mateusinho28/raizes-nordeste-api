// ============================================================
//  Seed - popula o banco com dados iniciais para teste
//
//  Usuarios (senha de todos: Senha@123):
//    admin@raizes.com    -> ADMIN
//    gerente@raizes.com  -> GERENTE (Recife)
//    cozinha@raizes.com  -> COZINHA (Recife)
//    cliente@raizes.com  -> CLIENTE (com consentimento + fidelidade)
// ============================================================
const bcrypt = require("bcryptjs");
const prisma = require("../src/infrastructure/prisma");
const { Perfil } = require("../src/domain/enums");

async function main() {
  console.log("Iniciando seed...");

  const senhaHash = await bcrypt.hash("Senha@123", 10);

  // --- Unidades ---
  const recife = await prisma.unidade.create({
    data: { nome: "Raizes Recife Centro", cidade: "Recife", estado: "PE", tipoCozinha: "COMPLETA" },
  });
  const fortaleza = await prisma.unidade.create({
    data: { nome: "Raizes Fortaleza Beira-Mar", cidade: "Fortaleza", estado: "CE", tipoCozinha: "REDUZIDA" },
  });

  // --- Usuarios ---
  const admin = await prisma.usuario.create({
    data: { nome: "Administrador", email: "admin@raizes.com", senhaHash, perfil: Perfil.ADMIN },
  });
  await prisma.usuario.create({
    data: { nome: "Gerente Recife", email: "gerente@raizes.com", senhaHash, perfil: Perfil.GERENTE, unidadeId: recife.id },
  });
  await prisma.usuario.create({
    data: { nome: "Cozinha Recife", email: "cozinha@raizes.com", senhaHash, perfil: Perfil.COZINHA, unidadeId: recife.id },
  });
  const cliente = await prisma.usuario.create({
    data: {
      nome: "Maria Cliente",
      email: "cliente@raizes.com",
      senhaHash,
      perfil: Perfil.CLIENTE,
      consentimentoLGPD: true,
      consentimentoEm: new Date(),
    },
  });
  // carteira de fidelidade do cliente (consentiu)
  await prisma.fidelidade.create({ data: { clienteId: cliente.id } });

  // --- Produtos ---
  // Criados em sequencia (nao Promise.all) para garantir IDs deterministicos:
  // 1=Cuscuz, 2=Tapioca, 3=Bolo, 4=Cafe, 5=Suco, 6=Canjica.
  const dadosProdutos = [
    { nome: "Cuscuz com ovo", categoria: "CAFE", preco: 12.5 },
    { nome: "Tapioca de queijo coalho", categoria: "CAFE", preco: 14.0 },
    { nome: "Bolo de macaxeira", categoria: "DOCE", preco: 9.9 },
    { nome: "Cafe passado na hora", categoria: "BEBIDA", preco: 6.0 },
    { nome: "Suco de caja", categoria: "BEBIDA", preco: 8.5 },
    { nome: "Canjica junina", categoria: "DOCE", preco: 11.0, sazonal: true },
  ];
  const produtos = [];
  for (const d of dadosProdutos) {
    produtos.push(await prisma.produto.create({ data: d }));
  }

  // --- Estoque inicial na unidade de Recife ---
  for (const p of produtos) {
    await prisma.estoque.create({
      data: { unidadeId: recife.id, produtoId: p.id, quantidade: 100, disponivel: true },
    });
  }
  // Fortaleza (cozinha reduzida): so bebidas, estoque menor
  await prisma.estoque.create({ data: { unidadeId: fortaleza.id, produtoId: produtos[3].id, quantidade: 30 } });
  await prisma.estoque.create({ data: { unidadeId: fortaleza.id, produtoId: produtos[4].id, quantidade: 20 } });

  // --- Promocao de exemplo ---
  await prisma.promocao.create({
    data: { nome: "Sao Joao 2026", descricao: "10% em itens juninos", percentualDesconto: 10 },
  });

  console.log("Seed concluido com sucesso!");
  console.log(`Unidades: ${recife.nome} (id ${recife.id}), ${fortaleza.nome} (id ${fortaleza.id})`);
  console.log(`Login admin: admin@raizes.com / Senha@123`);
  console.log(`Login cliente: cliente@raizes.com / Senha@123`);
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
