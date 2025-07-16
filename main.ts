// main.ts
import { Application } from "./deps.ts";
import { oakCors } from "./deps.ts";
import { apiRouter } from "./api/mod.ts"; // 直接從 api/mod.ts 匯入配置好的路由
import { generateApiProxyFile } from "./utils/generateApiProxy.ts";

const app = new Application();

// 從 .env 檔案載入環境變數
await import("https://deno.land/std@0.224.0/dotenv/load.ts");
const port = Number(Deno.env.get("PORT")) || 8893;

// --- 中介軟體 ---
app.use(oakCors());

// --- API 路由 ---
// 使用從 api/mod.ts 匯出的單一路由模組
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// --- 靜態檔案伺服 ---
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// --- API Proxy 生成 ---
if (Deno.env.get("DENO_ENV") !== "production") {
  console.log("[API Proxy Generator] Generating proxy file...");
  await generateApiProxyFile(apiRouter);
}

// --- 伺服器啟動 ---
app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `伺服器已啟動，監聽於 ${secure ? "https" : "http"}://${
      hostname ?? "localhost"
    }:${port}`,
  );
});

await app.listen({ port });
