// ============================================================
//  Agrega todas as rotas da API sob /api
// ============================================================
const { Router } = require("express");

const authRoutes = require("./authRoutes");
const usuarioRoutes = require("./usuarioRoutes");
const unidadeRoutes = require("./unidadeRoutes");
const produtoRoutes = require("./produtoRoutes");
const estoqueRoutes = require("./estoqueRoutes");
const pedidoRoutes = require("./pedidoRoutes");
const pagamentoRoutes = require("./pagamentoRoutes");
const fidelidadeRoutes = require("./fidelidadeRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/unidades", unidadeRoutes);
router.use("/produtos", produtoRoutes);
router.use("/estoque", estoqueRoutes);
router.use("/pedidos", pedidoRoutes);
router.use("/pagamentos", pagamentoRoutes);
router.use("/fidelidade", fidelidadeRoutes);

module.exports = router;
