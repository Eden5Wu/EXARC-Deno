// server.js (for Deno)

import express from 'npm:express@4.18.2';
import {
    join as pathJoin,
    dirname as pathDirname,
    fromFileUrl
} from 'https://deno.land/std@0.224.0/path/mod.ts';
import cookieParser from 'npm:cookie-parser@1.4.6';
import { load as dotenvLoad } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
// 導入您自定義的認證中介軟體
import { authenticateTokenFlexible } from './authMiddleware.js';

import { SignJWT } from "npm:jose@5.9.6"; 

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

// 新增：從環境變數讀取是否啟用認證功能
const useAuth = Deno.env.get('USE_AUTH') === 'true';

// ==== API 元數據定義 (已更新) ====
// 在這裡集中定義您的 API 端點、方法和參數類型
// 這些資訊會傳遞給 generateApiProxy.js 用於生成前端代理
const apiMetadata = {
    // echomsg 是 GET 請求，參數 'msg' 來自 query
    'echomsg': { method: 'GET', paramName: 'msg', paramType: 'query' },
    // reversemmsg 是 POST 請求，參數 'message' 是 JSON body
    'reversemmsg': { method: 'POST', paramName: 'message', paramType: 'body' },
    // 新增：login 是 POST 請求，參數 'credentials' 是 JSON body
    'login': { method: 'POST', paramName: 'credentials', paramType: 'body' }
};
// =============================

// 新增：根據環境變數決定是否應用認證中介軟體
if (useAuth) {
    // 將彈性認證中介軟體應用於所有 /api 路由
    console.log('認證功能已啟用：所有 /api/* 路由將檢查 JWT Token。');
    app.use('/api', authenticateTokenFlexible);
} else {
    console.log('認證功能已停用。所有 API 路由皆可公開存取。');
}

// 新增：登入 API 路由
app.post('/api/login', async (req, res) => {
    // 這裡只是個示範，實際應用中應從資料庫驗證使用者。
    const { username, password } = req.body;
    // 假設驗證成功
    if (username === 'testuser' && password === 'password123') {
        // payload 應該包含用戶的識別資訊，例如 ID 和角色
        const user = { id: 1, name: username, role: 'admin' };

        // 1. 獲取 JWT Secret 並轉換為 Uint8Array
        const JWT_SECRET_STRING = Deno.env.get('JWT_SECRET');
        if (!JWT_SECRET_STRING) {
            console.error('JWT_SECRET 環境變數未設定！無法生成 Token。');
            return res.status(500).json({ message: '伺服器錯誤：JWT 密鑰未配置。' });
        }
        // jose 函式庫也需要 Uint8Array 格式的金鑰
        const JWT_SECRET_KEY_BYTES = new TextEncoder().encode(JWT_SECRET_STRING);

        // 2. 使用 SignJWT 來創建 JWT Token (遵循 jose 範例)
        const token = await new SignJWT(user) // payload
            .setProtectedHeader({ alg: "HS256", typ: "JWT" }) // JWT 標頭
            .setIssuedAt() // 設定發行時間 (iat)
            .setExpirationTime('2h') // 設定過期時間，例如 2 小時後
            .sign(JWT_SECRET_KEY_BYTES); // 使用 Uint8Array 金鑰進行簽署

        // 返回 Token 給前端
        return res.json({ message: '登入成功', token: token, user: user });
    }
    // 驗證失敗
    res.status(401).json({ message: '無效的使用者名稱或密碼' });
});

// API 路由
app.get('/api/echomsg', (req, res) => {
    const msg = req.query.msg || 'No message provided';
    let response = { received: msg, echoed: msg };

    // 由於認證中介軟體的設計，如果請求能到達這裡，
    // 並且 `useAuth` 為 true，那麼 req.user 肯定會存在。
    // 如果 `useAuth` 為 false，則 req.user 就不會存在。
    if (req.user) { // 直接判斷 req.user 是否存在
        response.authStatus = '已認證';
        response.user = req.user;
    } else {
        response.authStatus = '未認證 (或認證功能已停用)';
    }
    res.json(response);
});

app.post('/api/reversemmsg', (req, res) => {
    const message = req.body.message || '';
    const reversed = message.split('').reverse().join('');
    let response = { original: message, reversed: reversed };

    // 由於認證中介軟體的設計，如果請求能到達這裡，
    // 並且 `useAuth` 為 true，那麼 req.user 肯定會存在。
    // 如果 `useAuth` 為 false，則 req.user 就不會存在。
    if (req.user) { // 直接判斷 req.user 是否存在
        response.authStatus = '已認證';
        response.user = req.user;
    } else {
        response.authStatus = '未認證 (或認證功能已停用)';
    }
    res.json(response);
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
