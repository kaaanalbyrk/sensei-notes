// db.js — IndexedDB katmanı. Tüm kayıtlar tek bir "items" deposunda tutulur.
// Kayıt modeli: {id, type:'daily'|'book'|'movie'|'place', date, cat, title, ..., fav, status, rating, created, updated}
// Günlük kayıtlar type:'daily' + date + cat taşır; koleksiyonlar tarih taşımaz → birbirine karışmaz.
const DB = (() => {
  let p;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('sensei-notes', 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore('items', {keyPath:'id'}); s.createIndex('type','type'); s.createIndex('date','date'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('items', mode), rq = fn(t.objectStore('items'));
      t.oncomplete = () => res(rq && rq.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  };
  return {
    all: () => run('readonly', s => s.getAll()),
    put: o => run('readwrite', s => s.put(o)),
    del: id => run('readwrite', s => s.delete(id)),
    // Yedek geri yükleme: mevcut her şeyi siler, listeyi yazar (tek işlem)
    replaceAll: list => run('readwrite', s => { s.clear(); list.forEach(o => s.put(o)); })
  };
})();
