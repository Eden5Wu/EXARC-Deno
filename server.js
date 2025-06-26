// server.js (for Deno)

import express from 'npm:express@4.18.2';
import {
    join as pathJoin,
    dirname as pathDirname,
    fromFileUrl
} from 'https://deno.land/std@0.224.0/path/mod.ts';
import cookieParser from 'npm:cookie-parser@1.4.6';
import { load as dotenvLoad } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';

// 載入 .env 檔案中的環境變數
await dotenvLoad({
    envPath: pathJoin(pathDirname(fromFileUrl(import.meta.url)), '.env')
});

const app = express();
const port = Deno.env.get('PORT') || 8893;

// 中介層設置
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 靜態檔案服務
const __dirname = pathDirname(fromFileUrl(import.meta.url));
app.use(express.static(pathJoin(__dirname, 'public')));

// ==== 新增：API 元數據定義 ====
// 在這裡集中定義您的 API 端點、方法和參數類型
const apiMetadata = {
    // echomsg 是 GET 請求，參數 'msg' 來自 query
    'echomsg': { method: 'GET', paramName: 'msg', paramType: 'query' },
    // reversemmsg 是 POST 請求，參數 'message' 是 JSON
    'reversemmsg': { method: 'POST', paramName: 'message', paramType: 'body' }
    // 如果您有其他 JSON POST 請求，可以這樣定義：
    // 'login': { method: 'POST', paramName: 'credentials', paramType: 'body' }
    // 預設 'body' 指的是 JSON 物件
};
// =============================

// API 路由
app.get('/api/echomsg', (req, res) => {
    const msg = req.query.msg || 'No message provided';
    res.json({ received: msg, echoed: msg });
});

// 針對 /api/reversemmsg 路由，使用 express.text() 來解析純文字主體
app.post('/api/reversemmsg', (req, res) => {
    const message = req.body.message || '';
    const reversed = message.split('').reverse().join('');
    res.json({ original: message, reversed: reversed });
});

// --- 新增：在所有路由定義之後，調用 API 代理生成腳本 ---
// 僅在開發模式下生成檔案
if (Deno.env.get('NODE_ENV') !== 'production') {
    const { generateApiProxyFile } = await import('./generateApiProxy.js');
    // 將 app 實例和 apiMetadata 物件傳遞給生成函數
    generateApiProxyFile(app, apiMetadata);
}
// --- 結束新增 ---

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
    console.log(`環境: ${Deno.env.get('NODE_ENV') || 'development'}`);
});

export default app;
