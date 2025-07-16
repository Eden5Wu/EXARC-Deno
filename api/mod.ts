// api/mod.ts
// 這裡現在是所有 API 路由的唯一真實來源 (Single Source of Truth)。
// 定義、中介軟體和處理邏輯都集中在此。

import { Router } from "../deps.ts";
import type { RouterContext } from "../deps.ts";
import { create } from "../deps.ts";
import { authenticateToken } from "../middleware/auth.ts";
import * as todosDB from "./todos.ts";

// --- 環境變數 ---
await import("https://deno.land/std@0.224.0/dotenv/load.ts");
const useAuth = Deno.env.get("USE_AUTH") === "true";
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "default-secret";

// --- 路由實例 ---
export const apiRouter = new Router();

// --- 路由定義與實作 ---

/**
 * 處理使用者登入。
 * @param {object} data - 包含使用者憑證的物件。
 * @param {string} data.username - 使用者名稱。
 * @param {string} data.password - 密碼。
 */
apiRouter.post("/api/login", async (ctx: RouterContext<"/api/login">) => {
  const body = await ctx.request.body.json();
  const { username, password } = body;

  if (username === "testuser" && password === "password123") {
    const payload = {
      id: 1,
      name: username,
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    };
    const token = await create({ alg: "HS512", typ: "JWT" }, payload, JWT_SECRET);
    ctx.response.body = { message: "登入成功", token };
  } else {
    ctx.response.status = 401;
    ctx.response.body = { message: "無效的使用者名稱或密碼" };
  }
});

/**
 * 回傳收到的訊息。
 * @param {string} msg - 要回傳的訊息 (來自 URL 路徑)。
 */
apiRouter.get(
  "/api/echomsg/:msg",
  ...(useAuth ? [authenticateToken] : []), // 如果 useAuth 為 true，則插入中介軟體
  (ctx: RouterContext) => {
    const msg = ctx.params.msg || "No message provided";
    ctx.response.body = {
      received: msg,
      echoed: msg,
      user: ctx.state.user, // 如果認證成功，這裡會有使用者資訊
    };
  },
);

/**
 * 接收一個包含訊息的 JSON 物件，並回傳反轉後的訊息。
 * @param {object} data - 請求主體。
 * @param {string} data.message - 要被反轉的訊息。
 */
apiRouter.post(
  "/api/reversemsg",
  ...(useAuth ? [authenticateToken] : []),
  async (ctx: RouterContext<"/api/reversemsg">) => {
    const body = await ctx.request.body.json();
    const message = body.message || "";
    const reversed = message.split("").reverse().join("");
    ctx.response.body = {
      original: message,
      reversed: reversed,
      user: ctx.state.user,
    };
  },
);

// --- Todos CRUD API ---

/**
 * 取得所有待辦事項。
 */
apiRouter.get("/api/todos/fetch", (ctx) => {
  ctx.response.body = todosDB.getAll();
});

/**
 * 建立一個新的待辦事項。
 * @param {object} data - 請求主體。
 * @param {string} data.text - 新待辦事項的內容。
 */
apiRouter.post("/api/todos/create", async (ctx) => {
  const { text } = await ctx.request.body.json();
  if (typeof text !== "string" || !text.trim()) {
    ctx.response.status = 400;
    ctx.response.body = { message: "文字內容是必要的" };
    return;
  }
  ctx.response.status = 201;
  ctx.response.body = todosDB.create(text);
});

/**
 * 更新一個現有的待辦事項。
 * @param {object} data - 請求主體。
 * @param {number} data.id - 要更新的待辦事項 ID。
 * @param {string} [data.text] - (選填) 新的文字內容。
 * @param {boolean} [data.completed] - (選填) 新的完成狀態。
 */
apiRouter.post("/api/todos/update", async (ctx) => {
  const { id, text, completed } = await ctx.request.body.json();
  const updatedTodo = todosDB.update(id, { text, completed });
  if (updatedTodo) {
    ctx.response.body = updatedTodo;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { message: "找不到待辦事項" };
  }
});

/**
 * 刪除一個待辦事項。
 * @param {object} data - 請求主體。
 * @param {number} data.id - 要刪除的待辦事項 ID。
 */
apiRouter.post("/api/todos/delete", async (ctx) => {
  const { id } = await ctx.request.body.json();
  const success = todosDB.remove(id);
  if (success) {
    ctx.response.status = 204; // No Content
  } else {
    ctx.response.status = 404;
    ctx.response.body = { message: "找不到待辦事項" };
  }
});
