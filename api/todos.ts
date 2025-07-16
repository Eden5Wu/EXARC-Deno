// api/todos.ts
// 這是一個簡單的記憶體中資料庫，用於模擬待辦事項的 CRUD 操作。

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// 使用 Map 來儲存待辦事項，方便透過 ID 查找
let todos: Map<number, Todo> = new Map();
let nextId = 1;

// 初始化一些範例資料
[
  "學習 Deno",
  "重構 EXARC 專案",
  "撰寫 README.md",
  "喝杯咖啡",
].forEach((text, index) => {
  const id = nextId++;
  todos.set(id, { id, text, completed: index < 2 });
});

/**
 * 取得所有待辦事項。
 * @returns {Todo[]} 待辦事項陣列。
 */
export const getAll = (): Todo[] => {
  return Array.from(todos.values());
};

/**
 * 根據 ID 查找待辦事項。
 * @param {number} id - 待辦事項的 ID。
 * @returns {Todo | undefined} 找到的待辦事項或 undefined。
 */
export const findById = (id: number): Todo | undefined => {
  return todos.get(id);
};

/**
 * 建立一個新的待辦事項。
 * @param {string} text - 待辦事項的內容。
 * @returns {Todo} 新建立的待辦事項。
 */
export const create = (text: string): Todo => {
  const newTodo: Todo = {
    id: nextId++,
    text,
    completed: false,
  };
  todos.set(newTodo.id, newTodo);
  return newTodo;
};

/**
 * 更新一個待辦事項。
 * @param {number} id - 要更新的待辦事項 ID。
 * @param {Partial<Omit<Todo, 'id'>>} updates - 要更新的欄位。
 * @returns {Todo | null} 更新後的待辦事項，如果找不到則為 null。
 */
export const update = (
  id: number,
  updates: Partial<Omit<Todo, "id">>,
): Todo | null => {
  const todo = todos.get(id);
  if (!todo) {
    return null;
  }
  // 更新 text
  if (typeof updates.text === "string") {
    todo.text = updates.text;
  }
  // 更新 completed 狀態
  if (typeof updates.completed === "boolean") {
    todo.completed = updates.completed;
  }
  return todo;
};

/**
 * 刪除一個待辦事項。
 * @param {number} id - 要刪除的待辦事項 ID。
 * @returns {boolean} 如果成功刪除則返回 true，否則返回 false。
 */
export const remove = (id: number): boolean => {
  return todos.delete(id);
};
