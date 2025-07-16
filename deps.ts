// deps.ts
// 將所有依賴項集中管理，方便版本控制。

export {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v16.0.0/mod.ts";
export type { RouterContext } from "https://deno.land/x/oak@v16.0.0/mod.ts";
export { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
export {
  create,
  verify,
  decode,
} from "https://deno.land/x/djwt@v3.0.2/mod.ts";
export type { Header, Payload } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
export { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
