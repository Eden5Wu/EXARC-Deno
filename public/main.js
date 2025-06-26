// public/main.js

// 移除 api 導入，因為我們現在透過 apiProxy 呼叫
// import { api } from './ajax/apiExecutor.js';
import { login, logout, isAuthenticated, initializeAuth } from './ajax/authService.js';
import { apiProxy } from './ajax/apiProxy.js'; // 導入 apiProxy

// 初始化認證狀態 (如果localStorage有Token會自動恢復)
initializeAuth();

// 用於顯示回應的 DOM 元素
const echoResponseDiv = document.getElementById('echoResponse');
const reverseResponseDiv = document.getElementById('reverseResponse');

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
    }
};

// 由於您的 Express 後端沒有登入 API，這裡的登入/登出功能會失敗。
// 如果未來您添加了登入 API，可以取消註解以下代碼進行測試。
/*
// 假設有一個假的登入按鈕
window.testLogin = async () => {
    try {
        console.log('嘗試登入...');
        // 這裡的憑證需要與您後端的登入 API 期望的格式相符
        const loginPayload = { username: 'testuser', password: 'password123' };
        // 這裡可以考慮讓 authService.js 內部直接使用 apiProxy.login 而不是 api.post
        const response = await login(loginPayload, '額外客戶端資訊');
        console.log('登入成功:', response);
        alert('登入成功！');
        console.log('是否已登入:', isAuthenticated());
    } catch (error) {
        console.error('登入失敗:', error);
        alert('登入失敗: ' + (error.response?.data?.message || error.message));
    }
};

window.testLogout = () => {
    logout();
    console.log('已登出。');
    alert('已登出！');
    console.log('是否已登入:', isAuthenticated());
};
*/