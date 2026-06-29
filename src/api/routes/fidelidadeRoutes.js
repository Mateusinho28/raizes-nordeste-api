// ============================================================
//  Rotas /fidelidade  (pontos, saldo, historico, resgate)
// ============================================================
const { Router } = require("express");
const fidelidadeService = require("../../application/fidelidadeService");
const { autenticar } = require("../middlewares/auth");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { resgatarSchema } = require("../validators");

const router = Router();

// GET /fidelidade/saldo  -> saldo de pontos do cliente logado
router.get(
  "/saldo",
  autenticar,
  asyncHandler(async (req, res) => {
    res.json(await fidelidadeService.saldo(req.usuario.id));
  })
);

// GET /fidelidade/historico  -> historico de pontos do cliente logado
router.get(
  "/historico",
  autenticar,
  asyncHandler(async (req, res) => {
    res.json(await fidelidadeService.historico(req.usuario.id));
  })
);

// POST /fidelidade/resgates  -> resgata pontos
router.post(
  "/resgates",
  autenticar,
  validar(resgatarSchema),
  asyncHandler(async (req, res) => {
    const resultado = await fidelidadeService.resgatar(req.usuario.id, req.body.pontos, {
      descricao: req.body.descricao,
    });
    res.status(201).json(resultado);
  })
);

module.exports = router;
