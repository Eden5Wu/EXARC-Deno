// apiProxyInvoker.js

// 注意：我們不再直接從這裡 import apiProxy，因為我們需要它的原始碼。
// 我們仍然需要 apiExecutor 和 authService 來實際執行 API 請求。
import { api } from './ajax/apiExecutor.js'; // 導入底層執行器
import { isAuthenticated, initializeAuth } from './ajax/authService.js';

// DOM 元素
const apiContainer = document.getElementById('api-container');
const authStatusDiv = document.getElementById('authStatus');

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
    const apiProxyObjectRegex = /export const apiProxy = {([\s\S]*?)};/m;
    const apiProxyMatch = sourceCode.match(apiProxyObjectRegex);
    
    if (!apiProxyMatch || apiProxyMatch.length < 2) {
        console.error('無法找到 `export const apiProxy = { ... };` 物件定義。');
        return metadata;
    }
    
    // 取得 apiProxy 物件內部的程式碼字串
    const apiProxyContent = apiProxyMatch[1];

    // 步驟 2: 在物件內部，匹配每一個方法及其上方的 JSDoc 註解
    // 這個正規表達式尋找：JSDoc 註解 (/** ... */) 後面跟著 `方法名: async (...) => { ... }`
    const methodRegex = /\/\*\*([\s\S]*?)\*\/\s*([a-zA-Z0-9]+):\s*async\s*\(\s*([a-zA-Z0-9_, ={}[\].'"`:]*)\s*\)/g;
    
    let match;
    // 在 apiProxyContent 內部執行匹配
    while ((match = methodRegex.exec(apiProxyContent)) !== null) {
        const jsdocContent = match[1].trim();
        const methodName = match[2];
        const paramsString = match[3].trim();
        
        // 處理 JSDoc 內容，移除開頭的 `*` 和空白
        const jsdoc = jsdocContent.split('\n').map(line => line.replace(/^\s*\*\s*/, '')).join('\n').trim();
        
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
            // 根據參數名稱推斷輸入類型
            if (param.includes('credentials') || param.includes('message') || param.includes('dataOrParams')) {
                inputFieldsHTML += `
                    <label for="input-${apiName}-${param}">${param}:</label>
                    <textarea id="input-${apiName}-${param}" rows="5" placeholder="輸入 JSON 數據，例如: { &#39;message&#39;: &#39;測試&#39; }">${param === 'message' ? '{"message": "Hello"}' : ''}</textarea>
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
        params.forEach(param => {
            const inputElement = document.getElementById(`input-${apiName}-${param}`);
            if (inputElement) {
                let value = inputElement.value;
				const trimmedValue = value.trim();

                // === 修正核心邏輯 START ===
                // 檢查是否是為 POST body 參數而設的 textarea
                if (inputElement.tagName === 'TEXTAREA') {
                    // 根據參數名稱（例如 'message' 或 'credentials'）決定處理方式
                    // 如果輸入是純文字，我們就直接傳遞它
                    // 否則，我們才嘗試解析 JSON
                    if (param === 'message' || param === 'credentials' || param === 'dataOrParams') {
                        // 檢查輸入是否看起來像 JSON 物件或陣列
                        if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
                            try {
                                // 如果是，嘗試解析。
                                value = JSON.parse(value);
                            } catch (e) {
                                // 如果解析失敗，給出錯誤提示，讓使用者修改
                                responseBox.className = 'response-box error-response';
                                responseBox.textContent = `錯誤: JSON 輸入格式無效。請檢查語法。`;
                                sendBtn.disabled = false;
                                return; // 提前結束
                            }
                        }
                        // 如果輸入不是以 { 或 [ 開頭，則將其視為純文字字串，無需解析。
                        // 這會讓 "Hello" 保持為字串，JSON.parse 就不會被呼叫。
                        // 這邊不需要額外處理，因為 value 已經是字串。
                    }
                }
                inputValues[param] = value;
            }
        });

        // 將參數值組合成呼叫函數時的參數順序
        args = params.map(p => inputValues[p]);

        try {
            // 從我們載入的 apiProxy 物件中呼叫對應的方法
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
    authStatusDiv.textContent = `認證狀態: ${isAuthenticated() ? '已登入' : '未登入'}`;
}

// 頁面載入時的主要初始化邏輯
document.addEventListener('DOMContentLoaded', async () => {
    apiContainer.innerHTML = '載入 API 資訊中...';

    // 步驟 1: 載入 apiProxy.js 的原始碼
    try {
        const proxySourceResponse = await fetch('./ajax/apiProxy.js');
        if (!proxySourceResponse.ok) {
            throw new Error(`無法載入 apiProxy.js: ${proxySourceResponse.status}`);
        }
        const proxySourceCode = await proxySourceResponse.text();
        
        // 步驟 2: 解析原始碼以獲取元數據
        const apiMetadata = parseApiProxySource(proxySourceCode);
        console.log('解析出的 API 元數據:', apiMetadata);
        
        // 步驟 3: 動態載入 apiProxy.js 模組本身（用於實際呼叫）
        // 因為 import 動態載入的是執行後的模組，註解會被移除，所以我們需要分兩步
        const { apiProxy: loadedApiProxy } = await import('./ajax/apiProxy.js');
        apiProxy = loadedApiProxy; // 將載入的物件賦值給全域變數
        
        // 步驟 4: 根據解析出的元數據生成 UI
        apiContainer.innerHTML = ''; // 清空載入中訊息
        for (const apiName in apiMetadata) {
            if (Object.prototype.hasOwnProperty.call(apiMetadata, apiName)) {
                createApiSection(apiName, apiMetadata[apiName]);
            }
        }
    } catch (error) {
        console.error('初始化失敗:', error);
        apiContainer.innerHTML = `<p style="color:red;">載入或解析 API 代理檔案失敗: ${error.message}</p>`;
    }
    
    // 步驟 5: 初始化認證狀態並更新 UI
    initializeAuth();
    updateAuthStatusUI();
});