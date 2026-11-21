/**
 * Binarios de PDF de prueba en IndexedDB.
 * localStorage solo guarda metadatos del expediente. Esto no es cifrado,
 * ni un control de acceso, ni la custodia de un sistema clínico.
 */
const DB_NAME = "recado-pdf-local";
const STORE = "archivos";
const VERSION = 1;

function abrir(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB no está disponible en este navegador."));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("No se pudo abrir el almacenamiento local."));
  });
}

export async function guardarPdfLocal(id: string, archivo: Blob | Uint8Array): Promise<void> {
  const bytes = archivo instanceof Uint8Array ? archivo : new Uint8Array(await archivo.arrayBuffer());
  const db = await abrir();
  try {
    const copia = bytes.slice().buffer;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(copia, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo guardar el PDF local."));
    });
  } finally {
    db.close();
  }
}

export async function leerPdfLocal(id: string): Promise<Blob | null> {
  const db = await abrir();
  try {
    const data = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("No se pudo leer el PDF local."));
    });
    return aBlobPdf(data);
  } finally {
    db.close();
  }
}

export async function limpiarPdfsLocales(): Promise<void> {
  const db = await abrir();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo vaciar el almacenamiento local."));
    });
  } finally {
    db.close();
  }
}

function aBlobPdf(data: unknown): Blob | null {
  if (data instanceof Blob) return data.type ? data : new Blob([data], { type: "application/pdf" });
  if (data instanceof ArrayBuffer) return new Blob([data], { type: "application/pdf" });
  if (ArrayBuffer.isView(data)) {
    const copia = new Uint8Array(data.byteLength);
    copia.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    return new Blob([copia], { type: "application/pdf" });
  }
  return null;
}
