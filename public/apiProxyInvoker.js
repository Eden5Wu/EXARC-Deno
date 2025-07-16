// apiProxyInvoker.js

// 注意：我們不再直接從這裡 import apiProxy，因為我們需要它的原始碼。
// 我們仍然需要 apiExecutor 和 authService 來實際執行 API 請求。
import { api } from './ajax/apiExecutor.js'; // 導入底層執行器
import { isAuthenticated, initializeAuth } from './ajax/authService.js'; // 導入認證相關函式

// DOM 元素
const apiContainer = document.getElementById('api-container'); // 取得 API 容器元素
const authStatusDiv = document.getElementById('authStatus'); // 取得認證狀態元素

// 讓 apiProxy 物件可以被全域存取
let apiProxy = {}; 

/**
 * 提取 API 方法的 JSDoc 註解和參數名稱。
 * 這個函數會解析 apiProxy.js 的原始碼字串，只處理 apiProxy 物件內的方法。
 * @param {string} sourceCode - apiProxy.js 的完整原始碼字串。
 * @returns {{ [key: string]: { jsdoc: string, params: string[] } }} - 包含所有 API 元數據的物件。
 */
function parseApiProxySource(sourceCode) {
    const metadata = {};
    
    // 步驟 1: 找到 apiProxy 物件的定義區塊
    const apiProxyObjectRegex = /export const apiProxy = {([^]*?)};/m;
    const apiProxyMatch = sourceCode.match(apiProxyObjectRegex);
    
    if (!apiProxyMatch || apiProxyMatch.length < 2) {
        console.error('無法找到 `export const apiProxy = { ... };` 物件定義。');
        return metadata;
    }
    
    // 取得 apiProxy 物件內部的程式碼字串
    const apiProxyContent = apiProxyMatch[1];

    // 步驟 2: 在物件內部，匹配每一個方法及其上方的 JSDoc 註解
    const methodRegex = /\/\*\*[^]*?\*\/[\s\n]*?([a-zA-Z0-9]+):\s*async\s*\(([^)]*)\)/g;
    
    let match;
    // 在 apiProxyContent 內部執行匹配
    while ((match = methodRegex.exec(apiProxyContent)) !== null) {
        const jsdoc = match[0].match(/\/\*\*[^]*?\*\//)[0];
        const methodName = match[1];
        const paramsString = match[2].trim();
        
        // 解析參數字串
        const params = paramsString
            .split(',')
            .map(p => p.split('=')[0].trim().replace(/[{}]/g, '')) // 移除預設值和解構賦值的大括號
            .filter(p => p !== ''); // 移除空字串

        metadata[methodName] = { jsdoc, params };
    }
    
    return metadata;
}


/**
 * 動態生成 API 測試區塊。
 * @param {string} apiName API 方法名稱。
 * @param {Object} metadata API 的元數據。
 */
function createApiSection(apiName, metadata) {
    const section = document.createElement('div');
    section.className = 'api-section';
    section.id = `api-${apiName}`;

    let inputFieldsHTML = '';
    const params = metadata.params;

    if (params.length > 0) {
        params.forEach(param => {
            // 根據參數名稱或 JSDoc 內容推斷輸入類型
            const isJsonParam = metadata.jsdoc.includes(`@param {object} ${param}`) || 
                                param.includes('data') || 
                                param.includes('credentials');

            if (isJsonParam) {
                inputFieldsHTML += `
                    <label for="input-${apiName}-${param}">${param}:</label>
                    <textarea id="input-${apiName}-${param}" rows="5" placeholder="輸入 JSON 數據，例如: { 'key': 'value' }"></textarea>
                `;
            } else {
                inputFieldsHTML += `
                    <label for="input-${apiName}-${param}">${param}:</label>
                    <input type="text" id="input-${apiName}-${param}" value="" placeholder="請輸入 ${param}">
                `;
            }
        });
    } else {
        inputFieldsHTML = '<p>此 API 不需要參數。</p>';
    }

    section.innerHTML = `
        <h3>${apiName}</h3>
        <pre>${metadata.jsdoc || '無 JSDoc 註解。'}</pre>
        <div class="input-fields">${inputFieldsHTML}</div>
        <button id="btn-${apiName}">發送請求</button>
        <h4>回應:</h4>
        <pre class="response-box" id="response-${apiName}">等待發送...</pre>
    `;

    apiContainer.appendChild(section);

    // 綁定事件監聽器
    const sendBtn = document.getElementById(`btn-${apiName}`);
    const responseBox = document.getElementById(`response-${apiName}`);

    sendBtn.addEventListener('click', async () => {
        responseBox.className = 'response-box'; // 重設樣式
        responseBox.textContent = '載入中...';
        sendBtn.disabled = true;

        let args = [];
        let inputValues = {};

        // 收集參數值
        for (const param of params) {
            const inputElement = document.getElementById(`input-${apiName}-${param}`);
            if (inputElement) {
                let value = inputElement.value;
                const trimmedValue = value.trim();
                
                // === 修正核心邏輯 START ===
                // 改為更通用的判斷方式
                const isJsonParam = metadata.jsdoc.includes(`@param {object} ${param}`) ||
                                    param.includes('data') || 
                                    param.includes('credentials');

                if (inputElement.tagName === 'TEXTAREA' && isJsonParam) {
                    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            responseBox.className = 'response-box error-response';
                            responseBox.textContent = `錯誤: 參數 '${param}' 的 JSON 輸入格式無效。請檢查語法。`;
                            sendBtn.disabled = false;
                            return; // 提前結束
                        }
                    } else if (trimmedValue !== '') {
                        // 如果 Textarea 中有內容但不是合法的 JSON 開頭，提示錯誤
                        responseBox.className = 'response-box error-response';
                        responseBox.textContent = `錯誤: 參數 '${param}' 期望一個 JSON 物件或陣列。`;
                        sendBtn.disabled = false;
                        return;
                    } else {
                        // 如果為空，則傳遞 null 或 undefined
                        value = null; 
                    }
                }
                // === 修正核心邏輯 END ===
                inputValues[param] = value;
            }
        }
        
        args = params.map(p => inputValues[p]);

        try {
            const response = await apiProxy[apiName](...args);
            responseBox.textContent = JSON.stringify(response, null, 2);
        } catch (error) {
            console.error(`呼叫 ${apiName} API 失敗:`, error);
            const errorMessage = `錯誤: ${error.message}\n${JSON.stringify(error.response?.data, null, 2) || ''}`;
            responseBox.className = 'response-box error-response';
            responseBox.textContent = errorMessage;
        } finally {
            sendBtn.disabled = false;
            updateAuthStatusUI();
        }
    });
}


/**
 * 更新認證狀態的 UI 顯示。
 */
function updateAuthStatusUI() {
    authStatusDiv.textContent = `認證狀態: ${isAuthenticated() ? '已登入' : '未登入'}`; // 使用 isAuthenticated() 函式檢查狀態
}

// 頁面載入時的主要初始化邏輯
document.addEventListener('DOMContentLoaded', async () => {
    apiContainer.innerHTML = '載入 API 資訊中...'; // 初始顯示載入訊息

    try {
        const proxySourceResponse = await fetch('./ajax/apiProxy.js'); // 載入 apiProxy.js 檔案
        if (!proxySourceResponse.ok) {
            throw new Error(`無法載入 apiProxy.js: ${proxySourceResponse.status}`); // 檢查 HTTP 回應是否成功
        }
        const proxySourceCode = await proxySourceResponse.text(); // 取得檔案內容
        
        const apiMetadata = parseApiProxySource(proxySourceCode); // 解析原始碼以獲取元數據
        
        const { apiProxy: loadedApiProxy } = await import('./ajax/apiProxy.js'); // 動態導入 apiProxy.js
        apiProxy = loadedApiProxy; // 將載入的物件賦值給全域變數
        
        apiContainer.innerHTML = ''; // 清空載入中訊息
        for (const apiName in apiMetadata) {
            if (Object.prototype.hasOwnProperty.call(apiMetadata, apiName)) {
                createApiSection(apiName, apiMetadata[apiName]); // 為每個 API 方法創建測試區塊
            }
        }
    } catch (error) {
        console.error('初始化失敗:', error); // 捕捉並印出錯誤
        apiContainer.innerHTML = `<p style="color:red;">載入或解析 API 代理檔案失敗: ${error.message}</p>`; // 在頁面上顯示錯誤訊息
    }
    
    initializeAuth(); // 從 localStorage 恢復認證 Token
    updateAuthStatusUI(); // 更新 UI 顯示
});
