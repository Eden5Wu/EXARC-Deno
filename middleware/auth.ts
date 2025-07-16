// middleware/auth.ts
import { verify } from "../deps.ts";
import type { RouterContext } from "../deps.ts";

// 從 .env 檔案載入環境變數
await import("https://deno.land/std@0.224.0/dotenv/load.ts");
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "default-secret";

/**
 * Oak 中介軟體，用於嚴格驗證 JWT Token。
 * @param ctx - Oak 的路由上下文。
 * @param next - 呼叫下一個中介軟體的函式。
 */
export const authenticateToken = async (
  ctx: RouterContext<any>,
  next: () => Promise<unknown>,
) => {
  const authHeader = ctx.request.headers.get("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    ctx.response.status = 401;
    ctx.response.body = { message: "存取被拒絕：需要認證 Token。" };
    return;
  }

  try {
    const payload = await verify(token, JWT_SECRET);
    // 將解碼後的使用者資訊附加到 ctx.state，方便後續的路由處理器使用
    ctx.state.user = payload;
    await next(); // Token 驗證成功，繼續處理請求
  } catch (err) {
    console.warn("Token 驗證失敗:", err.message);
    ctx.response.status = 403;
    ctx.response.body = { message: "存取被拒絕：Token 無效或已過期。" };
  }
};
