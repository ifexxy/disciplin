// storage.js
let db;
const request = indexedDB.open("disciplinDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const store = db.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
};

export function saveEntry(data) {
  const tx = db.transaction("entries", "readwrite");
  const store = tx.objectStore("entries");
  store.add(data);
}

export function getEntries(callback) {
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");
  const request = store.getAll();

  request.onsuccess = function () {
    callback(request.result);
  };
}
