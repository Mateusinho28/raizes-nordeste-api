// ============================================================
//  server.js - ponto de entrada da aplicacao
// ============================================================
const app = require("./src/app");
const env = require("./src/config/env");

app.listen(env.port, () => {
  console.log("============================================");
  console.log(`  API Raizes do Nordeste rodando`);
  console.log(`  -> http://localhost:${env.port}`);
  console.log(`  -> Swagger: http://localhost:${env.port}/docs`);
  console.log("============================================");
});
