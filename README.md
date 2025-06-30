# EXARC (Express ARC JS Framework)

這個專案是一個基於 Express.js 的輕量級後端模板，旨在提供一個高效且易於維護的前後端 API 互動架構。它特別強調在開發模式下自動同步前端 API 代理模組，確保前後端介面的一致性，大幅提升開發效率。此為 **Deno 運行環境版本**.

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
  +jquery-mobile-demo.html // jQuery Mobile 示範頁面
  +react-demo.html  // React 示範頁面
  +vue-demo.html    // Vue 示範頁面
  +apiProxyInvoker.html // API 動態調用器 HTML 介面
  +apiProxyInvoker.js   // API 動態調用器 JavaScript 邏輯
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
