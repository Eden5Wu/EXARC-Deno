// public/ajax/authService.js
// 此模組處理登入/登出的業務邏輯，並管理 Token 的生命週期。

import { api } from './apiExecutor.js'; // 導入您的 apiExecutor 實例 (注意路徑變更)

/**
 * @private
 * 定義儲存認證 Token 在 localStorage 中的鍵名。
 */
const AUTH_TOKEN_STORAGE_KEY = 'authToken';

/**
 * 處理用戶登入的業務邏輯。
 * 發送登入請求到後端，並在成功後儲存認證 Token。
 *
 * @param {Object} credentialsPayload - 包含登入憑證的物件。其結構完全由前端開發者根據後端 API 要求定義。
 * @param {...any} optionalClientSideData - 額外的可選參數。這些參數不會被發送到後端 API。
 * 它們僅用於客戶端 `authService` 內部邏輯、日誌記錄或其他客戶端自定義用途。
 * 您可以傳遞 0 到 N 個這樣的參數。
 * @returns {Promise<Object>} 登入成功時解析為伺服器回應數據的 Promise。
 * @throws {Error} 登入失敗時拋出錯誤。此錯誤通常包含 `response` 屬性，其中有伺服器返回的錯誤數據。
 */
export async function login(credentialsPayload, ...optionalClientSideData) {
    if (!credentialsPayload || typeof credentialsPayload !== 'object') {
        throw new Error('登入函式需要一個包含憑證的物件作為第一個參數。');
    }

    try {
        const response = await api.post('login', credentialsPayload);

        if (response && typeof response.token === 'string') {
            const authToken = `Bearer ${response.token}`;
            api.setAuth(authToken); // 將 Token 設定給 apiExecutor，以便後續請求使用
            localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken); // 將 Token 儲存到 localStorage，實現持久化
            console.log('登入成功，認證 Token 已設定並儲存。');
            if (optionalClientSideData.length > 0) {
                console.log('login 函式接收到額外的客戶端數據 (未發送至 API):', optionalClientSideData);
            }
        } else {
            throw new Error('登入成功但未收到有效的認證 Token。請聯繫管理員。');
        }

        return response; // 返回伺服器登入成功的原始數據
    } catch (error) {
        console.error('認證服務 - 登入失敗:', error);
        throw error;
    }
}

/**
 * 處理用戶登出。
 * 清除本地儲存中的認證 Token，並從 apiExecutor 中移除 Token。
 */
export function logout() {
    api.setAuth(null); // 從 apiExecutor 中清除當前認證 Token
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY); // 從 localStorage 中移除持久化的 Token
    console.log('已登出，認證 Token 已從記憶體和本地儲存中清除。');
}

/**
 * **新增功能**：清除本地儲存中的認證相關數據。
 * 這對於某些調試或強制用戶登出並清除所有本地狀態的場景很有用。
 */
export function clearLocalStorageAuth() {
    api.setAuth(null); // 確保 apiExecutor 中的 Token 也被清除
    // 直接清除整個 localStorage 或只清除 AUTH_TOKEN_STORAGE_KEY，取決於您的需求
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    // 如果您想清除所有 localStorage 數據，可以使用：
    // localStorage.clear();
    console.log('本地儲存中的認證 Token 已清除。');
}


/**
 * 檢查用戶是否已登入（基於 localStorage 中是否有認證 Token）。
 * 這只是一個快速的客戶端檢查，實際的認證狀態仍需透過發送受保護的 API 請求來確認。
 * @returns {boolean} 如果 localStorage 中有認證 Token 則返回 true，否則返回 false。
 */
export function isAuthenticated() {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) !== null;
}

/**
 * 在應用程式啟動時初始化認證狀態。
 * 嘗試從 localStorage 恢復之前儲存的認證 Token，並設定給 apiExecutor。
 * 這是為了實現「保持登入」功能，讓用戶重新載入頁面後仍能保持登入狀態。
 */
export function initializeAuth() {
    const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (storedToken) {
        api.setAuth(storedToken); // 將儲存的 Token 設定給 apiExecutor
        console.log('認證 Token 已從本地儲存恢復。');
        // 可選：您可以在此處發送一個輕量級請求到後端，驗證這個 Token 是否仍然有效。
        // 例如：
        // api.get('verify-token').catch(e => {
        //     if (e.response?.status === 401 || e.response?.status === 403) {
        //         console.warn('恢復的 Token 無效，自動登出。');
        //         logout();
        //     }
        // });
    }
}