// public/main.js

import { login, logout, isAuthenticated, initializeAuth } from './ajax/authService.js';
import { apiProxy } from './ajax/apiProxy.js'; // 導入 apiProxy

// 新增一個前端旗標，控制是否啟用登入功能
// 您可以在這裡設定為 true 或 false
const ENABLE_LOGIN = true;

// 初始化認證狀態 (如果localStorage有Token會自動恢復)
initializeAuth();

// 用於顯示回應的 DOM 元素
const echoResponseDiv = document.getElementById('echoResponse');
const reverseResponseDiv = document.getElementById('reverseResponse');
const authStatusDiv = document.getElementById('authStatus');

// 新增：檢查並更新認證狀態顯示
function updateAuthStatus() {
    if (ENABLE_LOGIN) {
        authStatusDiv.textContent = `認證狀態: ${isAuthenticated() ? '已登入' : '未登入'}`;
    } else {
        authStatusDiv.textContent = '認證功能已在前端停用。';
    }
}
updateAuthStatus();

/**
 * 測試 GET /api/echomsg API
 */
window.testEchoMessage = async () => {
    const message = document.getElementById('echoInput').value;
    echoResponseDiv.textContent = '載入中...';
    try {
        // 使用 apiProxy 呼叫 echomsg
        const response = await apiProxy.echomsg(message);
        echoResponseDiv.textContent = JSON.stringify(response, null, 2);
    } catch (error) {
        // 錯誤處理邏輯已經在 apiProxy.js 中處理，這裡只需顯示錯誤訊息
        echoResponseDiv.textContent = `錯誤: ${error.message}\n${JSON.stringify(error.response, null, 2)}`;
    } finally {
        updateAuthStatus();
    }
};

/**
 * 測試 POST /api/reversemmsg API
 */
window.testReverseMessage = async () => {
    const message = document.getElementById('reverseInput').value;
    reverseResponseDiv.textContent = '載入中...';
    try {
        // 使用 apiProxy 呼叫 reversemmsg
        const response = await apiProxy.reversemmsg(message);
        reverseResponseDiv.textContent = JSON.stringify(response, null, 2);
    } catch (error) {
        // 錯誤處理邏輯已經在 apiProxy.js 中處理，這裡只需顯示錯誤訊息
        reverseResponseDiv.textContent = `錯誤: ${error.message}\n${JSON.stringify(error.response, null, 2)}`;
    } finally {
        updateAuthStatus();
    }
};

// 新增：登入/登出功能
if (ENABLE_LOGIN) {
    window.testLogin = async () => {
        try {
            console.log('嘗試登入...');
            // 這裡的憑證需要與您後端的登入 API 期望的格式相符
            const loginPayload = { username: 'testuser', password: 'password123' };
            // 使用 authService.js 中的 login 函式
            const response = await login(loginPayload, '額外客戶端資訊'); //
            console.log('登入成功:', response); //
            alert('登入成功！');
        } catch (error) {
            console.error('登入失敗:', error);
            alert('登入失敗: ' + (error.response?.data?.message || error.message));
        } finally {
            updateAuthStatus();
        }
    };

    window.testLogout = () => {
        logout(); //
        console.log('已登出。'); //
        alert('已登出！');
        updateAuthStatus();
    };
}