# `netUtils.js` — How It Works

## `getUsername` Function

This function retrieves the username from the IndexedDB database. It calls `getFromDB` with the index name `username`.

```js
export function getUsername() {
    return getFromDB('username');
}
```

## `getFromDB` Function

This function retrieves a value from the IndexedDB based on the given index name. It returns a Promise that resolves
with the retrieved value or `null` if no entries are found. It handles the following steps:

- Opens the database.
- Initiates a transaction with read-only access.
- Opens an index and retrieves data using a cursor.
- Resolves the Promise with the retrieved data or `null` if no data is found.
- Rejects the Promise if there is an error during the retrieval process.

```js
function getFromDB(indexName) {
    return new Promise((resolve, reject) => {
        const userDB = openDB();

        userDB.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(["userStore"], "readonly");
            const objectStore = transaction.objectStore("userStore");

            const index = objectStore.index(indexName);
            const getRequest = index.openCursor();

            getRequest.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value[indexName]);
                } else {
                    resolve(null); // No entries found
                }
            };

            getRequest.onerror = function (event) {
                reject("Error retrieving data: " + event.target.error);
            };
        };
    });
}
```

## `openDB` Function

This function opens the IndexedDB database and sets up the necessary event handlers for database upgrades and errors. It
returns the database request object.

```js
function openDB() {
    const userDB = indexedDB.open("userDatabase", DB_VERSION);
    userDB.onupgradeneeded = dbOnUpgradeNeeded;
    userDB.onerror = function (event) {
        reject("Database error: " + event.target.error);
    };
    return userDB;
}
```

## `dbOnUpgradeNeeded` Function

This function handles the database upgrade process. It creates an object store named `userStore` with a key path id and
auto-increment enabled. It also creates indexes for `username`, `accessToken`, and `refreshToken`. This function is
called when the database version changes.

```js
function dbOnUpgradeNeeded(event) {
    console.log('Upgrading db...');

    const db = event.target.result;

    if (!db.objectStoreNames.contains("userStore")) {
        const objectStore = db.createObjectStore("userStore", {keyPath: "id", autoIncrement: true});
        objectStore.createIndex("username", "username", {unique: true});
        objectStore.createIndex("accessToken", "accessToken", {unique: false});
        objectStore.createIndex("refreshToken", "refreshToken", {unique: false});
    }
    console.log('DB upgrade complete...');
}
```