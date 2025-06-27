// authMiddleware.js

// 移除 djwt 的導入
// import { verify } from "https://deno.land/x/djwt@v2.9/mod.ts";

// 導入 jose 的驗證函式
import { jwtVerify } from "npm:jose@5.9.6";

// 定義不需要驗證 JWT 的公共路徑
const PUBLIC_ROUTES = [
    '/api/login',
    // ...
];

/**
 * 彈性認證中介軟體
 * @param {Request} req - 請求物件
 * @param {Response} res - 回應物件
 * @param {Function} next - 下一個中介軟體或路由處理器
 */
export async function authenticateTokenFlexible(req, res, next) {
    console.log(`收到請求: ${req.method} ${req.url}`);

    // ... 公共路徑判斷邏輯（保持不變）...
    const originalUrl = req.originalUrl;
    for (const publicRoute of PUBLIC_ROUTES) {
        if (originalUrl.startsWith(publicRoute)) {
            console.log(`路徑 ${originalUrl} 為公共路徑，跳過 JWT 驗證。`);
            return next();
        }
    }

    // 從請求的 Authorization 標頭中取得 Token
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.error('未提供 Authorization 標頭');
        return res.status(401).send('Access Denied: No token provided.');
    }

    // Token 格式通常是 "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.error('Authorization 標頭格式不正確');
        return res.status(401).send('Access Denied: Token format invalid.');
    }

    try {
        // 1. 獲取 Secret Key 並轉換為 Uint8Array
        const JWT_SECRET_STRING = Deno.env.get("JWT_SECRET");
        if (!JWT_SECRET_STRING) {
            console.error('JWT_SECRET 環境變數未設定！');
            return res.status(500).send('Server error: JWT secret key not configured.');
        }
        const JWT_SECRET_KEY_BYTES = new TextEncoder().encode(JWT_SECRET_STRING);

        // 2. 使用 jwtVerify 函式來驗證 Token
        const { payload, protectedHeader } = await jwtVerify(token, JWT_SECRET_KEY_BYTES, {
            algorithms: ['HS256'], // **這裡必須指定演算法**
        });
        
        // 驗證成功，將 payload 附加到 req 物件上，方便後續路由使用
        req.user = payload; 

        console.log('JWT 驗證成功，使用者 payload:', payload);
        next(); // 驗證成功，繼續處理
    } catch (error) {
        // jose 函式庫會拋出不同的錯誤類型，例如 JWTExpired
        console.error('JWT 驗證失敗:', error.message);
        if (error.code === 'ERR_JWT_EXPIRED') {
            return res.status(401).send('Access Denied: JWT Token has expired. Please log in again.');
        } else {
            return res.status(401).send(`Access Denied: Invalid token. Error: ${error.message}`);
        }
    }
}