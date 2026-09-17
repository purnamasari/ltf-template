/**
 * The kiosk's durable storage: one IndexedDB database, two stores.
 *
 * `letters` is the outbox — a letter lives here from the moment it is sealed
 * until the server has it. `kv` holds the device bearer and the cached `meta`.
 *
 * IndexedDB rather than localStorage because this is the system of record until
 * the server says otherwise: it survives better, it is asynchronous, and it is
 * not capped at a few megabytes of strings.
 */

const DB_NAME = "ltf";
const DB_VERSION = 1;

export const LETTERS = "letters";
export const KV = "kv";

let open: Promise<IDBDatabase> | null = null;

function database(): Promise<IDBDatabase> {
  if (open) return open;

  open = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LETTERS)) db.createObjectStore(LETTERS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return open;
}

function run<T>(store: string, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return database().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = work(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export const put = <T>(store: string, value: T, key?: IDBValidKey) =>
  run(store, "readwrite", (s) => s.put(value, key));

export const get = <T>(store: string, key: IDBValidKey) =>
  run<T | undefined>(store, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);

export const getAll = <T>(store: string) =>
  run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);

export const remove = (store: string, key: IDBValidKey) =>
  run(store, "readwrite", (s) => s.delete(key));
