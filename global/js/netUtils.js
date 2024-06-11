import {DB_VERSION} from "./consts.js";

export function getUsername() {
    return getFromDB('username');
}

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

function openDB() {
    const userDB = indexedDB.open("userDatabase", DB_VERSION);
    userDB.onupgradeneeded = dbOnUpgradeNeeded;
    userDB.onerror = function (event) {
        reject("Database error: " + event.target.error);
    };
    return userDB;
}

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

export * from './netUtils.js';