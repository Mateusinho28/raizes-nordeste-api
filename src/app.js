// ============================================================
//  app.js - configuracao do Express (camada API)
// ============================================================
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const rotas = require("./api/routes");
const openapi = require("./api/docs/openapi");
const { errorHandler, notFound } = require("./api/middlewares/errorHandler");

const app = express();

// --- middlewares globais ---
app.use(cors()); // libera acesso para os canais (App/Web/Totem)
app.use(express.json()); // parseia body JSON
app.set("trust proxy", true); // captura IP real para auditoria

// --- healthcheck simples ---
app.get("/", (req, res) => {
  res.json({
    api: "Raizes do Nordeste",
    status: "online",
    docs: "/docs",
  });
});

// --- documentacao Swagger ---
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// --- rotas da API (todas sob /api) ---
app.use("/api", rotas);

// --- 404 e tratamento central de erros (sempre por ultimo) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
