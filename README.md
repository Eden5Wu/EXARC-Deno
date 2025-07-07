# EXARC (Express ARC JS Starter Kit) - Deno 版本

這個專案是一個基於 Express.js 的輕量級後端模板，旨在提供一個高效且易於維護的前後端 API 互動架構。它特別強調在開發模式下自動同步前端 API 代理模組，確保前後端介面的一致性，大幅提升開發效率。此為 **Deno 運行環境版本**.

---

## 專案結構
```yaml
+public
  +ajax
    +apiExecutor.js   // 基礎 API 執行器
    +authService.js   // 認證服務模組
    +apiProxy.js      // 前端 API 代理 (由後端動態生成)
  +index.html       // 靜態測試頁面
  +main.js          // 前端主邏輯
  +jquery-mobile-demo.html // jQuery Mobile 示範頁面
  +react-demo.html  // React 示範頁面
  +vue-demo.html    // Vue 示範頁面
  +react-todo.html // React TODO List 完整範例
  +apiProxyInvoker.html // API 動態調用器 HTML 介面
  +apiProxyInvoker.js   // API 動態調用器 JavaScript 邏輯
+generateApiProxy.js// 後端腳本：負責動態生成 apiProxy.js
+deno.json          // Deno 專案任務與依賴配置
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
    * **如何使用：** 您可以直接在前端呼叫 `login(credentialsPayload)`、`logout()`、`isAuthenticated()` 等函數來管理用戶認證狀態。

* **`public/ajax/apiProxy.js`**
    * 這是**前端 API 呼叫的核心代理模組**。它提供了一系列語義化的函數，讓前端可以直接以 `apiProxy.yourApiName(params)` 的方式呼叫後端 API，而無需關心底層的 URL 路徑、HTTP 方法或參數傳遞方式。
    * **動態生成：** 這個檔案的內容**不會**手動修改。它會在您啟動後端伺服器時，由 `generateApiProxy.js` 腳本根據 `server.js` 中定義的後端路由自動生成或更新。這確保了前端 API 介面與後端始終保持同步。
    * **如何使用：** 在您的前端 JavaScript (`main.js`、`react-demo.html` 等) 中，直接 `import { apiProxy } from 'apiProxy';`，然後調用例如 `apiProxy.echomsg(message)` 或 `apiProxy.reversemmsg(data)`。

* **`public/index.html`, `public/main.js` 與各種 Demo 頁面**
    * `index.html` 是前端的進入點，載入所有必要的 JavaScript 模組。
    * `main.js` 是前端的應用程式邏輯，它示範了如何使用 `apiProxy.js` 來呼叫後端 API 並顯示回應。
    * 其他 Demo 頁面 (`react-demo.html`, `vue-demo.html`, `jquery-mobile-demo.html`) 則展示了如何在不同的前端框架中整合此代理模式。
    * **如何使用：** 這是您編寫前端使用者介面和互動邏輯的地方，使用 `apiProxy` 來與後端溝通.

* **`public/apiProxyInvoker.html` 與 `public/apiProxyInvoker.js`**
    * 這兩個檔案共同提供了一個自動化、互動式的 API 調用與測試介面。
    * `apiProxyInvoker.js` 會動態讀取 `public/ajax/apiProxy.js` 的原始碼，解析其中的 JSDoc 註解和函數參數，並在 `apiProxyInvoker.html` 中為每個 API 方法生成一個可操作的表單。
    * 這使得開發者無需任何手動配置，即可快速查看所有後端 API 的文件並進行測試。
    * **如何使用：** 在開發模式下，您可以直接在瀏覽器中訪問此頁面進行 API 測試和探索。

* **`generateApiProxy.js`**
    * 這是一個**後端 Deno 腳本**，在 `server.js` 啟動時被調用（僅限開發模式）。
    * 它的職責是讀取 Express 應用程式 (`server.js`) 中定義的所有 API 路由，並根據這些路由資訊自動生成 `public/ajax/apiProxy.js` 的內容。
    * **如何使用：** 作為開發工具，您通常不需要直接調用或修改它，它會在 `deno task dev` 啟動時自動執行.

* **`server.js`**
    * Express.js 後端應用程式的主入口點。
    * 它配置了 Express 伺服器、中介層，並定義了所有的後端 API 路由。
    * 在開發模式下，它會引用並執行 `generateApiProxy.js` 腳本來自動更新前端的 `apiProxy.js`。
    * **如何使用：** 定義您的後端 API 端點，並啟動 Express 伺服器。

* **`deno.json`**
    * 定義 Deno 專案的配置，包含 `tasks`（任務）和 `imports`（導入映射）。
    * `imports` 讓您可以為 npm 套件或遠端 URL 定義簡潔的別名，例如將 `npm:express@4.18.2` 別名為 `express`。
    * `tasks` 定義了可透過 `deno task <task_name>` 執行的命令，簡化了啟動和開發流程。

---

## 如何使用 (快速啟動專案)

您可以透過 Git 工具快速複製此專案模板，開始您的開發。

1.  **確保安裝 Git** (如果尚未安裝)：請從 [Git 官方網站](https://git-scm.com/downloads) 下載並安裝。

2.  **複製專案模板**：
    ```console
    git clone [https://github.com/Eden5Wu/EXARC-Deno](https://github.com/Eden5Wu/EXARC-Deno) your-new-deno-project-name
    ```
    請將 `your-new-deno-project-name` 替換為您實際的專案名稱 (例如 `EXARC-Deno`)。
    當然，直接下載 zip 檔也是可以的。

3.  **進入專案目錄**：
    ```console
    cd your-new-deno-project-name
    ```

4.  **啟動開發伺服器**：
    ```console
    deno task dev
    ```
    Deno 將會自動下載並快取所需的 npm 模組（例如 Express）。
    此指令會使用 `deno.json` 中定義的 `dev` 任務，並帶有必要的權限旗標 (`--allow-net`, `--allow-env`, `--allow-read`, `--allow-write`, `--unstable-kv`) 和監控模式 (`--watch`).

5.  伺服器啟動後：
    * `public/ajax/apiProxy.js` 將會被自動生成（或更新）。
    * 您就可以在瀏覽器中訪問 `http://localhost:8893` (或您在 `.env` 中配置的埠號) 進行測試.

---

## 使用 API 動態調用器 (apiProxyInvoker)

除了示範頁面，EXARC 現在還提供了一個強大的 API 動態調用器，讓您無需任何額外配置即可快速測試後端 API。

1.  **確保伺服器已啟動**：
    執行 \`deno task dev\` 命令以啟動您的 EXARC 後端伺服器。這會自動生成或更新 \`public/ajax/apiProxy.js\` 檔案。

2.  **在瀏覽器中訪問調用器**：
    打開您的瀏覽器，訪問以下網址：
    \`http://localhost:8893/apiProxyInvoker.html\` (請根據您的伺服器埠號調整)

3.  **探索與測試 API**：

    * 頁面載入後，\`apiProxyInvoker.js\` 會自動讀取 \`apiProxy.js\` 的內容。

    * 它會動態生成所有 API 方法的區塊，每個區塊都包含：

      * API 名稱。

      * 從 \`apiProxy.js\` 的 JSDoc 中解析出的詳細說明。

      * 根據 API 參數類型自動生成的輸入欄位（例如，\`message\` 或 \`credentials\` 參數會提供多行文本框，並智能判斷純文字或 JSON 輸入）。

      * 一個「發送請求」按鈕。

      * 顯示伺服器回應的區域。

    * 您可以直接在輸入框中填寫參數，點擊「發送請求」按鈕，並即時查看 API 的回傳結果。這對於 API 的快速驗證、調試和理解非常有幫助。

---

## 核心開發理念：後端驅動，前端自動化

本模板的核心設計理念是**以後端為唯一的真實來源 (Backend as the Single Source of Truth)**。開發者只需專注於在後端 `server.js` 中定義 API 路由，前端所需的一切將會自動生成與同步，讓您體驗真正的「填空式」開發。

* **API 代理自動生成**：當您在 `server.js` 新增或修改 API 路由後，`generateApiProxy.js` 腳本會自動掃描這些路由，並在前端生成對應的 `public/ajax/apiProxy.js` 檔案。您無需手動編寫任何 `fetch` 或 `axios` 請求。
* **文件與測試同步**：更強大的是，`apiProxyInvoker.html` 會動態讀取 `apiProxy.js` 的原始碼與註解，為您即時生成一個互動式的 API 測試頁面。新增 API 的同時，也完成了測試工具的部署。

---

## 快速上手：新增 API 的標準流程

跟隨以下簡單四步驟，體驗本模板的敏捷開發流程。以「新增一個獲取使用者列表的 API」為例：

### 第一步：在後端 `server.js` 中定義新路由

打開 `server.js` 檔案，在您喜歡的位置加入新的 Express 路由定義。這是您唯一需要編寫核心業務邏輯的地方。

```javascript
// server.js

// ... 其他既有路由 ...

// ========= 新增您的 API =========
app.get('/api/users/list', (req, res) => {
    // 您的業務邏輯，例如從資料庫查詢
    const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
    ];
    // 直接回傳 JSON
    res.json(users);
});

// ========= API 定義結束 =========

// ... 伺服器啟動代碼 ...
```

---

### 第二步：(自動) 生成前端 API 代理

這是此模板的魔力所在。

如果您是透過 `deno task dev` 指令來啟動專案，**您不需要手動做任何事**。開發伺服器會即時監控您的檔案變更。

當您儲存 `server.js` 後，伺服器會自動重啟。在重啟的過程中，`generateApiProxy.js` 腳本將被再次執行，它會掃描您剛剛加入的 `/api/users/list` 路由，並自動將其轉換為可供前端呼叫的函式，然後更新到 `public/ajax/apiProxy.js` 檔案中。這個過程完全無感且自動化，確保了前後端介面的即時同步。

---

### 第三步：在前端直覺地呼叫新 API

得益於自動生成的 `apiProxy.js` 檔案，您現在可以立即在任何前端 JavaScript 檔案中（例如 `public/main.js`、React 或 Vue 元件），像呼叫一個本地的非同步函式一樣來使用這個新 API。

這個腳本會智慧地將後端路由路徑 `/api/users/list` 轉換為前端的駝峰式 (camelCase) 函式名稱 `usersList`，讓您的程式碼更加語意化且易於閱讀。

**您只需要：**
1.  導入 `apiProxy` 物件。
2.  直接呼叫對應的函式即可。

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

正如您所見，前端開發者完全從繁瑣的 API 請求配置中解放出來，可以更專注於 UI 與業務邏輯的實現。

---

### 第四步：使用動態調用器，即時測試與探索

這一步是體驗本模板強大之處的關鍵。您無需依賴 Postman 或其他外部工具，即可對剛剛建立的 API 進行完整的測試。

1.  **確保後端伺服器仍在運行。**
2.  在您的瀏覽器中，打開 `http://localhost:8893/apiProxyInvoker.html`。

頁面載入後，`apiProxyInvoker.js` 會自動讀取 `apiProxy.js` 的內容，並動態生成所有 API 方法的測試介面。您會立刻看到一個為 `usersList` 新建立的區塊，其中包含了：

* **API 名稱與說明**：從 JSDoc 註解中解析出的詳細說明。
* **參數輸入欄位**：根據 API 參數自動生成的輸入框。
* **發送按鈕**：點擊即可立即發送請求。
* **回應區域**：即時顯示後端回傳的結果。

這個動態調用器讓 API 的驗證、除錯和探索變得無比直觀與高效，是您開發過程中的得力助手。

---

## 總結：為何選擇 EXARC 模板？

遵循以上流程，您就可以不斷地在 `server.js` 中「填空」，快速擴充您的應用程式功能。選擇 EXARC，意味著選擇一個更現代、更高效的開發模式：

* **專注核心邏輯**：將時間花在刀口上，只需專注於後端的業務邏輯實現。
* **告別樣板程式碼**：徹底告別手動編寫和維護前端 `fetch` 或 `axios` 請求的繁瑣工作。
* **杜絕前後端不同步**：透過後端路由自動生成前端代理，從根本上消除了前後端 API 介面不一致的常見錯誤。
* **極致開發效率**：從定義路由到完成測試，整個流程無縫銜接，大幅縮短開發週期，讓您能更快地交付價值。
