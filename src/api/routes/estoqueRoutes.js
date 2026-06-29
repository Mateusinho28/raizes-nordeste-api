// ============================================================
//  Rotas /estoque
// ============================================================
const { Router } = require("express");
const estoqueService = require("../../application/estoqueService");
const { autenticar, autorizar } = require("../middlewares/auth");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { movimentarEstoqueSchema } = require("../validators");
const { Perfil } = require("../../domain/enums");

const router = Router();

// POST /estoque/movimentacoes  -> entrada/saida (GERENTE/ADMIN)
router.post(
  "/movimentacoes",
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validar(movimentarEstoqueSchema),
  asyncHandler(async (req, res) => {
    const resultado = await estoqueService.movimentar(req.body, {
      usuarioId: req.usuario.id,
      ip: req.ip,
    });
    res.status(201).json(resultado);
  })
);

// GET /estoque/unidades/:unidadeId  -> saldo por unidade (logado)
router.get(
  "/unidades/:unidadeId",
  autenticar,
  asyncHandler(async (req, res) => {
    res.json(await estoqueService.consultarPorUnidade(Number(req.params.unidadeId)));
  })
);

module.exports = router;
