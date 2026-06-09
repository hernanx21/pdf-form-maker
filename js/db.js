/**
 * IndexedDB wrapper for Ficha Técnica de Medición
 * Stores: fichas, fotos
 */
const DB = (() => {
  const DB_NAME = 'fichaMedicion';
  const DB_VERSION = 1;
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const database = e.target.result;

        if (!database.objectStoreNames.contains('fichas')) {
          const fichasStore = database.createObjectStore('fichas', { keyPath: 'id' });
          fichasStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!database.objectStoreNames.contains('fotos')) {
          const fotosStore = database.createObjectStore('fotos', { keyPath: 'id', autoIncrement: true });
          fotosStore.createIndex('fichaId', 'fichaId', { unique: false });
        }
      };

      req.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  function tx(storeName, mode = 'readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ---- Fichas ----

  async function createFicha(data) {
    await open();
    const now = new Date().toISOString();
    const ficha = {
      id: data.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    await promisify(tx('fichas', 'readwrite').add(ficha));
    return ficha;
  }

  async function getFicha(id) {
    await open();
    return promisify(tx('fichas').get(id));
  }

  async function updateFicha(id, data) {
    await open();
    const store = tx('fichas', 'readwrite');
    const existing = await promisify(store.get(id));
    if (!existing) throw new Error('Ficha not found');
    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await promisify(tx('fichas', 'readwrite').put(updated));
    return updated;
  }

  async function deleteFicha(id) {
    await open();
    await promisify(tx('fichas', 'readwrite').delete(id));
    // Also delete associated photos
    await deleteAllFotos(id);
  }

  async function getAllFichas() {
    await open();
    return promisify(tx('fichas').getAll());
  }

  // ---- Fotos ----

  async function addFoto(fichaId, blob, name) {
    await open();
    const record = { fichaId, blob, name, createdAt: new Date().toISOString() };
    const id = await promisify(tx('fotos', 'readwrite').add(record));
    return { ...record, id };
  }

  async function getFotos(fichaId) {
    await open();
    const index = db.transaction('fotos', 'readonly').objectStore('fotos').index('fichaId');
    return promisify(index.getAll(fichaId));
  }

  async function deleteFoto(id) {
    await open();
    await promisify(tx('fotos', 'readwrite').delete(id));
  }

  async function deleteAllFotos(fichaId) {
    await open();
    const fotos = await getFotos(fichaId);
    const store = tx('fotos', 'readwrite');
    await Promise.all(fotos.map(f => promisify(store.delete(f.id))));
  }

  return { createFicha, getFicha, updateFicha, deleteFicha, getAllFichas, addFoto, getFotos, deleteFoto, deleteAllFotos };
})();
