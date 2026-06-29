// ============================================================
//  Rotas /unidades
// ============================================================
const { Router } = require("express");
const unidadeService = require("../../application/unidadeService");
const { autenticar, autorizar } = require("../middlewares/auth");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { criarUnidadeSchema } = require("../validators");
const { Perfil } = require("../../domain/enums");

const router = Router();

// GET /unidades  -> lista unidades (publico)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await unidadeService.listar());
  })
);

// GET /unidades/:id  -> detalhe da unidade (publico)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await unidadeService.buscarPorId(Number(req.params.id)));
  })
);

// GET /unidades/:id/cardapio  -> cardapio daquela unidade (publico)
router.get(
  "/:id/cardapio",
  asyncHandler(async (req, res) => {
    res.json(await unidadeService.cardapio(Number(req.params.id)));
  })
);

// POST /unidades  -> cria unidade (ADMIN)
router.post(
  "/",
  autenticar,
  autorizar(Perfil.ADMIN),
  validar(criarUnidadeSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await unidadeService.criar(req.body));
  })
);

module.exports = router;
