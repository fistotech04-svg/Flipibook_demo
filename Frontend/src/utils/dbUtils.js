// IndexedDB Helpers for Editor State Persistence
const DB_NAME = 'Fisto3DContext';
const STORE_NAME = 'EditorState';

/**
 * Initializes the IndexedDB instance
 * @returns {Promise<IDBDatabase>}
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || 'Failed to open IndexedDB');
  });
};

/**
 * Saves a value to IndexedDB
 * @param {string} key 
 * @param {any} value 
 * @returns {Promise<void>}
 */
export const saveToDB = async (key, value) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("IndexedDB Save Error:", err);
  }
};

/**
 * Retrieves a value from IndexedDB
 * @param {string} key 
 * @returns {Promise<any>}
 */
export const getFromDB = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB Load Error:", err);
    return null;
  }
};
