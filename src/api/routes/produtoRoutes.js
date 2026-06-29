// ============================================================
//  Rotas /produtos
// ============================================================
const { Router } = require("express");
const produtoService = require("../../application/produtoService");
const { autenticar, autorizar } = require("../middlewares/auth");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { criarProdutoSchema, atualizarProdutoSchema } = require("../validators");
const { Perfil } = require("../../domain/enums");

const router = Router();

// GET /produtos?categoria=&page=&limit=  (publico)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { categoria } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    res.json(await produtoService.listar({ categoria, page, limit }));
  })
);

// GET /produtos/:id  (publico)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await produtoService.buscarPorId(Number(req.params.id)));
  })
);

// POST /produtos  (ADMIN/GERENTE)
router.post(
  "/",
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validar(criarProdutoSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await produtoService.criar(req.body));
  })
);

// PUT /produtos/:id  (ADMIN/GERENTE)
router.put(
  "/:id",
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validar(atualizarProdutoSchema),
  asyncHandler(async (req, res) => {
    res.json(await produtoService.atualizar(Number(req.params.id), req.body));
  })
);

// DELETE /produtos/:id  -> remocao logica (ADMIN)
router.delete(
  "/:id",
  autenticar,
  autorizar(Perfil.ADMIN),
  asyncHandler(async (req, res) => {
    await produtoService.remover(Number(req.params.id));
    res.status(204).send();
  })
);

module.exports = router;
