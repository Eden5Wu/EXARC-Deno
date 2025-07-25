// public/ajax/apiExecutor.js

/**
 * @private
 * API 的基礎路徑。此變數預期在瀏覽器環境中由一個全域變數 `window.__APP_CONFIG__.apiBaseUrl` 提供。
 * 例如：如果您的 Express API 路徑是 `http://localhost:8893/api/hello`，那麼 `apiBaseUrl` 應該是 `http://localhost:8893/api`。
 * 如果 `window.__APP_CONFIG__` 或 `apiBaseUrl` 不存在，則預設為 `/api`。
 */
const API_BASE_URL = window.__APP_CONFIG__?.apiBaseUrl || '/api';

/**
 * @private
 * 儲存當前用於 API 請求的認證 Token。
 * 格式通常是 'Bearer <您的JWT Token>' 或 'Basic <base64編碼的用戶名:密碼>'。
 * 初始化為 null，表示沒有認證 Token。
 */
let _authenticationToken = null;

/**
 * 設定用於後續 API 請求的認證 Token。
 * @param {string|null} token - 認證 Token 字串。如果傳入 null，則表示清除 Token。
 */
export function setAuthenticationToken(token) {
    _authenticationToken = token;
}

/**
 * 取得當前設定的認證 Token。
 * @returns {string|null} 當前的認證 Token 字串，如果未設定則為 null。
 */
export function getAuthenticationToken() {
    return _authenticationToken;
}

/**
 * @private
 * 構建完整的 API 請求 URL。
 * @param {string} endpoint - API 端點路徑，例如 'login' 或 'punchin/record'。
 * 此處不應包含 `/api/` 前綴，因為 `API_BASE_URL` 已包含基礎路徑。
 * @param {Object} [queryParams={}] - 選用的查詢參數物件，會被轉換為 URL 查詢字串。
 * @returns {string} 完整的請求 URL。
 */
function buildUrl(endpoint, queryParams = {}) {
    // 結合基礎路徑與端點。API_BASE_URL 應已包含 `/api` 部分。
    let url = `${API_BASE_URL}/${endpoint}`;

    const finalQueryParams = (queryParams === null || queryParams === undefined) ? {} : queryParams;
    const params = new URLSearchParams(finalQueryParams);
    const queryString = params.toString();

    if (queryString) {
        url += `?${queryString}`; // 添加查詢字串
    }
    return url;
}

/**
 * 執行一個 API 請求。這是框架的核心，負責底層的 HTTP 通訊。
 * 它返回一個 Promise，使非同步操作更易於管理。
 *
 * @param {string} method - HTTP 方法 ('GET', 'POST', 'PUT', 'DELETE')。
 * @param {string} endpoint - API 端點路徑，不包含基礎路徑和 `/api/`。
 * @param {Object|Array} [data=null] - 請求體數據，用於 'POST' 或 'PUT' 請求。將被轉換為 JSON 字串。
 * 如果為 FormData 類型，將直接作為 body 發送；否則將被轉換為 JSON 字串。
 * @param {Object} [queryParams={}] - 查詢參數物件，用於 'GET' 或 'DELETE' 請求。
 * @returns {Promise<Object|string>} 成功時解析為伺服器回應的 JSON 物件或文本；失敗時拋出包含錯誤信息的 Error 物件。
 * @throws {Error} 如果請求失敗或伺服器返回非 2xx 狀態碼。
 * 錯誤物件會包含 `response` 屬性，其中包含 `status`, `statusText`, 和 `data`。
 */
async function executeApi(method, endpoint, data = null, queryParams = {}, accept=null) {
    const url = buildUrl(endpoint, queryParams);
    const headers = {
        'Accept': (accept == null ? "application/json" : accept),       // 期望接收 JSON 格式的回應
    };

    // 如果 _authenticationToken 已設定，則添加到 Authorization 頭
    if (_authenticationToken) {
        headers['Authorization'] = _authenticationToken;
    }

    // About credentials:
    // If your backend API relies on cookies to maintain user session state (e.g., traditional session-based authentication), please uncomment this line
    // 後端 API 依賴於 Cookie 來維護使用者會話狀態 (例如傳統的 Session-based 認證)，請取消註解此行
    const config = {
        method: method,
        headers: headers,
        // credentials: 'include' 
    };

    // 對於 POST 或 PUT 請求，將數據添加到請求體中
    if (data !== null && (method === 'POST' || method === 'PUT')) {
        if (data instanceof FormData) {
            // 如果是 FormData，不要手動設定 Content-Type，瀏覽器會自動設定 multipart/form-data 和邊界
            config.body = data;
            delete headers['Content-Type']; // 確保不發送 'Content-Type: application/json'
        } else {
            // 否則，假定為 JSON 數據
            headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(url, config); // 發送 HTTP 請求

        // 檢查 HTTP 回應狀態碼是否在 2xx (成功) 範圍內
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = await response.text();
            }
            const error = new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        }

        // 嘗試解析 JSON 回應
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        console.error(`執行 API 失敗 (${method} ${endpoint}):`, error);
        throw error;
    }
}

/**
 * 提供簡化的 API 呼叫方法 (類似 DataSnap 代理的介面)。
 * 前端應用程式可以直接使用這些方法來發送請求，例如：
 * `api.get('users')`
 * `api.post('login', { username, password })`
 */
export const api = {
    get: (endpoint, queryParams, accept = null) => executeApi('GET', endpoint, null, queryParams, accept),
    post: (endpoint, data, accept = null) => executeApi('POST', endpoint, data, null, accept), // 注意這裡，如果需要查詢參數，還需要額外處理
    put: (endpoint, data, accept = null) => executeApi('PUT', endpoint, data, null, accept),
    delete: (endpoint, queryParams, accept = null) => executeApi('DELETE', endpoint, null, queryParams, accept),
    setAuth: setAuthenticationToken,
    getAuth: getAuthenticationToken,
};
