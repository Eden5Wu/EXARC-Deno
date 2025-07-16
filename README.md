# EXARC (Deno/Oak ARC JS Starter Kit)

這個專案是原 `EXARC (Express ARC JS Starter Kit)` 的 Deno 和 Oak 框架重構版本。它不僅保留了原始專案的核心理念——提供一個高效且易於維護的前後端 API 互動架構，更利用 Deno 的現代特性（如原生 TypeScript 支援、去中心化的依賴管理和更安全的執行環境）將其昇華。

我們的目標是打造一個**極致簡潔、高度自動化**的後端開發體驗。

## 核心開發理念：後端驅動，前端自動化

本模板的核心設計理念是**以後端為唯一的真實來源 (Backend as the Single Source of Truth)**。開發者只需專注於在後端 `api/mod.ts` 中定義 API 路由，前端所需的一切將會自動生成與同步，讓您體驗真正的「填空式」開發。

* **API 代理自動生成**：當您在 `api/mod.ts` 新增或修改 API 路由後，`generateApiProxy.js` 腳本會自動掃描這些路由，並在前端生成對應的 `public/ajax/apiProxy.js` 檔案。您無需手動編寫任何 `fetch` 或 `axios` 請求。

* **文件與測試同步**：更強大的是，`apiProxyInvoker.html` 會動態讀取 `apiProxy.js` 的原始碼與您在後端撰寫的 JSDoc 註解，為您即時生成一個互動式的 API 測試頁面。新增 API 的同時，也完成了測試工具的部署。

## 專案結構 (最終版)

```
/
├── api/
│   ├── mod.ts              # 專案核心：所有 API 的定義、文件與邏輯都在此
│   └── todos.ts            # 範例：Todo 相關的資料庫邏輯
├── middleware/
│   └── auth.ts             # JWT 認證中介軟體
├── public/                 # (與原專案相同) 前端靜態檔案
│   ├── ajax/
│   │   ├── apiExecutor.js
│   │   ├── authService.js
│   │   └── apiProxy.js     # (由後端動態生成)
│   ├── *.html              # 各式範例頁面
│   └── *.js
├── utils/
│   └── generateApiProxy.ts   # 動態生成 apiProxy.js 的腳本
├── .env                    # 環境變數設定檔
├── deps.ts                 # Deno 依賴項管理
├── deno.jsonc              # Deno 專案設定與任務腳本
└── main.ts                 # Deno 應用程式主入口
```

## 快速上手：新增 API 的標準流程

跟隨以下簡單四步驟，體驗本模板的敏捷開發流程。以「新增一個獲取使用者列表的 API」為例：

### 第一步：在 `api/mod.ts` 中定義新路由

打開 `api/mod.ts` 檔案，在您喜歡的位置加入新的路由定義。這是您唯一需要編寫核心業務邏輯的地方。

```typescript
// api/mod.ts

// ... 其他既有路由 ...

// ========= 新增您的 API =========

/**
 * 取得所有使用者的列表。
 * @returns {Promise<object[]>} 一個包含使用者物件的陣列。
 */
apiRouter.get("/api/users/list", (ctx) => {
    // 您的業務邏輯，例如從資料庫查詢
    const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
    ];
    // 直接回傳 JSON
    ctx.response.body = users;
});

// ========= API 定義結束 =========

// ...
```
**重點**：請務必在路由定義的上方，撰寫清楚的 JSDoc 註解。這將會自動成為您前端 API 的文件。

### 第二步：(自動) 生成前端 API 代理

這是此模板的魔力所在。

如果您是透過 `deno task dev` 指令來啟動專案，**您不需要手動做任何事**。開發伺服器會即時監控您的檔案變更。

當您儲存 `api/mod.ts` 後，伺服器會自動重啟。在重啟的過程中，`utils/generateApiProxy.ts` 腳本將被再次執行，它會掃描您剛剛加入的 `/api/users/list` 路由和它的 JSDoc，並自動將其轉換為可供前端呼叫的函式，然後更新到 `public/ajax/apiProxy.js` 檔案中。

### 第三步：在前端直覺地呼叫新 API

得益於自動生成的 `apiProxy.js` 檔案，您現在可以立即在任何前端 JavaScript 檔案中（例如 `public/main.js`、React 或 Vue 元件），像呼叫一個本地的非同步函式一樣來使用這個新 API。

這個腳本會智慧地將後端路由路徑 `/api/users/list` 轉換為前端的駝峰式 (camelCase) 函式名稱 `usersList`，讓您的程式碼更加語意化且易於閱讀。

```javascript
// 在您的任何前端 JS 檔案中 (e.g., public/main.js)
import { apiProxy } from './ajax/apiProxy.js';

async function displayUsers() {
    try {
        // 直接呼叫，完全無需關心 URL、Header 或 HTTP 方法的細節
        const userList = await apiProxy.usersList();

        console.log('成功取得使用者列表:', userList);
        // 在此處將 userList 渲染到您的頁面上

    } catch (error) {
        // 統一的錯誤處理機制
        console.error('取得使用者列表失敗:', error);
    }
}

// 執行它！
displayUsers();
```

### 第四步：使用動態調用器，即時測試與探索

這一步是體驗本模板強大之處的關鍵。您無需依賴 Postman 或其他外部工具，即可對剛剛建立的 API 進行完整的測試。

1.  **確保後端伺服器仍在運行。**
2.  在您的瀏覽器中，打開 `http://localhost:8893/apiProxyInvoker.html`。

頁面載入後，您會立刻看到一個為 `usersList` 新建立的區塊，其中包含了您在後端 JSDoc 中撰寫的詳細說明。點擊「發送請求」按鈕，即可立即看到後端回傳的結果。

## 如何使用 (快速啟動專案)

1.  **安裝 Deno**:
    如果您尚未安裝 Deno，請參考 [Deno 官方網站](https://deno.land/manual/getting_started/installation) 的說明進行安裝。

2.  **複製專案檔案**:
    將本專案的所有檔案複製到您的新專案目錄中。

3.  **建立 `.env` 檔案**:
    在專案根目錄建立一個 `.env` 檔案，並填入以下內容：

    ```
    PORT=8893
    DENO_ENV=development
    USE_AUTH=true
    JWT_SECRET=您的超級秘密金鑰請務必更改它並保持安全！
    ```

4.  **啟動開發伺服器**:
    在終端機中執行以下命令：

    ```console
    deno task dev
    ```deno task dev` 會使用 `deno.jsonc` 中定義的腳本來啟動伺服器。`--watch` 旗標會監控檔案變更並自動重啟，`--allow-*` 旗標則授予應用程式必要的權限。

5.  **測試應用**:
    * 伺服器啟動後，`apiProxy.js` 將會被自動生成（或更新）。
    * 您可以在瀏覽器中訪問 `http://localhost:8893` 以及 `http://localhost:8893/apiProxyInvoker.html` 來進行測試。
