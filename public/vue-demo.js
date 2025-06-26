<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue 3 API Demo with apiProxy</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; }
    .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; }
    h1, h2 { color: #333; }
    button { padding: 10px 15px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
    button.get { background-color: #4CAF50; color: white; }
    button.post { background-color: #008CBA; color: white; }
    input[type="text"] { width: calc(100% - 22px); padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
    pre { background-color: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    .loading { color: #888; font-style: italic; }
    .error { color: red; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js",
        "apiProxy": "./ajax/apiProxy.js"
      }
    }
  </script>
</head>
<body>
  <div id="app">
    <div class="container">
      <h1>Vue 3 + API Proxy Demo</h1>
      <p>此頁面使用 Vue 元件呼叫後端的 `/api/echomsg` (GET) 和 `/api/reversemmsg` (POST)。</p>

      <hr />

      <h2>Echo Message (GET)</h2>
      <label for="echoInput">輸入訊息:</label>
      <input
        type="text"
        id="echoInput"
        v-model="echoInput"
        :disabled="echoLoading"
      />
      <button class="get" @click="handleEcho" :disabled="echoLoading">
        {{ echoLoading ? '發送中...' : '發送 GET 請求' }}
      </button>
      <h3>回應:</h3>
      <pre :class="{ error: echoResponse.includes('錯誤') }">{{ echoResponse }}</pre>

      <hr />

      <h2>Reverse Message (POST)</h2>
      <label htmlFor="reverseInput">輸入要反轉的訊息:</label>
      <input
        type="text"
        id="reverseInput"
        v-model="reverseInput"
        :disabled="reverseLoading"
      />
      <button class="post" @click="handleReverse" :disabled="reverseLoading">
        {{ reverseLoading ? '發送中...' : '發送 POST 請求' }}
      </button>
      <h3>回應:</h3>
      <pre :class="{ error: reverseResponse.includes('錯誤') }">{{ reverseResponse }}</pre>
    </div>
  </div>

  <script type="module">
    // 從 importmap 定義的路徑導入 Vue 的 create app 和 ref
    import { createApp, ref } from 'vue';
    // 從 importmap 定義的路徑導入 apiProxy。
    import { apiProxy } from 'apiProxy';
    
    // 建立 Vue 應用程式
    createApp({
      setup() {
        // 狀態：管理 echomsg API 的輸入和回應
        const echoInput = ref('Hello from Vue!');
        const echoResponse = ref('等待發送...');
        const echoLoading = ref(false);

        // 狀態：管理 reversemmsg API 的輸入和回應
        const reverseInput = ref('Vue is awesome');
        const reverseResponse = ref('等待發送...');
        const reverseLoading = ref(false);

        // 處理 GET 請求
        const handleEcho = async () => {
          echoLoading.value = true;
          echoResponse.value = '載入中...';
          try {
            // 使用 apiProxy 呼叫 echomsg
            const response = await apiProxy.echomsg(echoInput.value);
            echoResponse.value = JSON.stringify(response, null, 2);
          } catch (error) {
            console.error('Echo API 呼叫失敗:', error);
            echoResponse.value = `錯誤: ${error.message}\n${JSON.stringify(error.response?.data, null, 2) || ''}`;
          } finally {
            echoLoading.value = false;
          }
        };

        // 處理 POST 請求
        const handleReverse = async () => {
          reverseLoading.value = true;
          reverseResponse.value = '載入中...';
          try {
            // apiProxy.reversemmsg 期望一個包含 'message' 的 JSON 物件
            const response = await apiProxy.reversemmsg(reverseInput.value);
            reverseResponse.value = JSON.stringify(response, null, 2);
          } catch (error) {
            console.error('Reverse API 呼叫失敗:', error);
            reverseResponse.value = `錯誤: ${error.message}\n${JSON.stringify(error.response?.data, null, 2) || ''}`;
          } finally {
            reverseLoading.value = false;
          }
        };

        // 將狀態和方法手提供給模板
        return {
          echoInput,
          echoResponse,
          echoLoading,
          reverseInput,
          reverseResponse,
          reverseLoading,
          handleEcho,
          handleReverse
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
