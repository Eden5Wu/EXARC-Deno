# EXARC (Express ARC JS Framework)

這個專案是一個基於 Express.js 的輕量級後端模板，旨在提供一個高效且易於維護的前後端 API 互動架構。它特別強調在開發模式下自動同步前端 API 代理模組，確保前後端介面的一致性，大幅提升開發效率。此為 **Deno 運行環境版本**。

---

## 專案結構
```
+public
  +ajax
    +apiExecutor.js   // 基礎 API 執行器
    +authService.js   // 認證服務模組
    +apiProxy.js      // 前端 API 代理 (由後端動態生成)
  +index.html       // 靜態測試頁面
  +main.js          // 前端主邏輯
+generateApiProxy.js// 後端腳本：負責動態生成 apiProxy.js
+package.json       // 專案依賴與配置
+server.js          // Express.js 後端伺服器主入口
```
---

## 核心功能與檔案說明

這個框架的核心理念是將前端與後端的 API 呼叫流程自動化和標準化，讓開發者能更專注於業務邏輯而非重複的 API 定義。

* **`public/ajax/apiExecutor.js`**
    * 這是所有 API 請求的基礎執行器。它封裝了 `fetch` API，負責處理 HTTP 方法 (GET/POST/PUT/DELETE)、請求頭 (headers)、JSON 序列化與反序列化，以及統一的錯誤處理。
    * 它也負責設定和取得認證 Token (`Authorization` header)。
    * **如何使用：** 其他模組會透過它來發送底層的 HTTP 請求。

* **`public/ajax/authService.js`**
    * 處理用戶認證的業務邏輯，例如登入、登出。
    * 它使用 `apiExecutor.js` 來與後端認證 API 溝通。
    * 負責將認證 Token 儲存到 `localStorage` 中以實現持久化登入狀態，並在應用程式啟動時恢復。
    * **如何使用：** 您可以直接在前端呼叫 `login(credentials)`、`logout()`、`isAuthenticated()` 等函數來管理用戶認證狀態。

* **`public/ajax/apiProxy.js`**
    * 這是**前端 API 呼叫的核心代理模組**。它提供了一系列語義化的函數，讓前端可以直接以 `apiProxy.yourApiName(params)` 的方式呼叫後端 API，而無需關心底層的 URL 路徑、HTTP 方法或參數傳遞方式。
    * **動態生成：** 這個檔案的內容**不會**手動修改。它會在您啟動後端伺服器時，由 `generateApiProxy.js` 腳本根據 `server.js` 中定義的後端路由自動生成或更新。這確保了前端 API 介面與後端始終保持同步。
    * **如何使用：** 在您的前端 JavaScript (`main.js` 或其他模組) 中，直接 `import { apiProxy } from './ajax/apiProxy.js';`，然後調用例如 `apiProxy.echomsg(message)` 或 `apiProxy.reversemmsg(data)`。

* **`public/index.html` 與 `public/main.js`**
    * `index.html` 是前端的進入點，載入所有必要的 JavaScript 模組。
    * `main.js` 是前端的應用程式邏輯，它示範了如何使用 `apiProxy.js` 來呼叫後端 API 並顯示回應。
    * **如何使用：** 這是您編寫前端使用者介面和互動邏輯的地方，使用 `apiProxy` 來與後端溝通。

* **`generateApiProxy.js`**
    * 這是一個**後端 Deno 腳本**，在 `server.js` 啟動時被調用（僅限開發模式）。
    * 它的職責是讀取 Express 應用程式 (`server.js`) 中定義的所有 API 路由，並根據這些路由資訊以及 **`apiMetadata`** 的定義，自動生成 `public/ajax/apiProxy.js` 的內容。
    * **如何使用：** 作為開發工具，您通常不需要直接調用或修改它，它會在 `deno task dev` 啟動時自動執行。

* **`server.js`**
    * Express.js 後端應用程式的主入口點。
    * 它配置了 Express 伺服器、中介層、定義了所有的後端 API 路由。
    * **API 元數據定義 (`apiMetadata`)**：此檔案中包含了 `apiMetadata` 物件的定義。這個物件是**手動維護**的，用於明確聲明每個 API 端點的預期 HTTP 方法、參數名稱及參數類型（例如：`query` 參數、`JSON` 物件主體 [`body`]）。`generateApiProxy.js` 腳本會依據此 `apiMetadata` 來生成精確的前端 API 代理函數。這類似於在 TypeScript 中自行定義 API 的型別介面 (interface) 或撰寫 API 文件，確保前後端資料契約的一致性。
    * 在開發模式下，它會引用並執行 `generateApiProxy.js` 腳本來自動更新前端的 `apiProxy.js`。
    * **如何使用：** 定義您的後端 API 端點，維護 `apiMetadata` 以描述其介面，並啟動 Express 伺服器。

    **`apiMetadata` 範例:**
    ```javascript
    const apiMetadata = {
        'echomsg': { method: 'GET', paramName: 'msg', paramType: 'query' },
        'reversemmsg': { method: 'POST', paramName: 'message', paramType: 'body' }
        // 如果您有其他 JSON POST 請求，可以這樣定義：
        // 'login': { method: 'POST', paramName: 'credentials', paramType: 'body' }
        // 預設 'body' 指的是 JSON 物件
    };
    ```

---

## 如何使用 (快速啟動專案)

您可以透過 Git 工具快速複製此專案模板，開始您的開發：

1.  **確保安裝 Git** (如果尚未安裝)：請從 [Git 官方網站](https://git-scm.com/downloads) 下載並安裝。

2.  **複製專案模板**：
    ```console
    git clone [https://github.com/Eden5Wu/EXARC](https://github.com/Eden5Wu/EXARC) your-new-deno-project-name
    ```
    請將 `your-new-deno-project-name` 替換為您實際的專案名稱 (例如 `EXARC-Deno`)。

3.  **進入專案目錄**：
    ```console
    cd your-new-deno-project-name
    ```

4.  **重要：更新 Deno 相關檔案**
    由於此模板原本為 Node.js 專案，您需要將以下檔案更新為 Deno 相容版本（這些檔案已在之前的對話中提供）：
    * `server.js`
    * `generateApiProxy.js`
    * `public/ajax/apiExecutor.js`
    * 建立 `deno.json` 檔案來定義 Deno 任務和依賴導入映射。

    **`deno.json` 範例:**
    ```json
    {
      "tasks": {
        "start": "deno run --allow-net --allow-env --allow-read --allow-write --unstable-kv server.js",
        "dev": "deno run --allow-net --allow-env --allow-read --allow-write --unstable-kv --watch server.js"
      },
      "imports": {
        "express": "npm:express@4.18.2",
        "cookie-parser": "npm:cookie-parser@1.4.6",
        "dotenv": "[https://deno.land/std@0.224.0/dotenv/mod.ts](https://deno.land/std@0.224.0/dotenv/mod.ts)",
        "path": "[https://deno.land/std@0.224.0/path/mod.ts](https://deno.land/std@0.224.0/path/mod.ts)"
      }
    }
    ```

5.  **啟動開發伺服器**：
    ```console
    deno task dev
    ```
    Deno 將會自動下載並快取所需的 npm 模組（例如 Express）。
    此指令會使用 `deno.json` 中定義的 `dev` 任務，並帶有必要的權限旗標 (`--allow-net`, `--allow-env`, `--allow-read`, `--allow-write`, `--unstable-kv`) 和監控模式 (`--watch`)。

6.  伺服器啟動後：
    * `public/ajax/apiProxy.js` 將會被自動生成（或更新）。
    * 您就可以在瀏覽器中訪問 `http://localhost:8893` (或您在 `.env` 中配置的埠號) 進行測試。
