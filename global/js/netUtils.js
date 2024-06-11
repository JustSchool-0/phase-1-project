import {AUTH_ENDPOINT, DB_VERSION} from "./consts.js";

export async function logout() {
    const token = await getAccessToken();
    if (!token) {
        return; // User is already logged out
    }

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    await fetch(`${AUTH_ENDPOINT}/logout`, {
        method: 'DELETE',
        headers: headers,
        redirect: 'error'
    })
        .then(response => response.json())
        .then(json => {
            window.open(json.redirect, '_self');
            purgeLocalStorage();
            clearUserData();
        })
        .catch(error => {
            reportError(error);
            alert('Logout attempt rejected by server');
        });
}

export function purgeLocalStorage() {
    localStorage.removeItem('username');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

export function storeUserData(jsonResponse) {
    const userDB = openDB();

    userDB.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(["userStore"], "readwrite");
        const objectStore = transaction.objectStore("userStore");

        const userData = {
            username: jsonResponse.username,
            accessToken: jsonResponse.accessToken,
            refreshToken: jsonResponse.refreshToken
        };

        const addRequest = objectStore.add(userData);

        addRequest.onsuccess = function (event) {
            console.log("User data has been added to your database.");
        };

        addRequest.onerror = function (event) {
            console.error("Unable to add data. Error:", event.target.error);
        };
    };
}

export function clearUserData() {
    const userDB = openDB();

    userDB.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(["userStore"], "readwrite");
        const objectStore = transaction.objectStore("userStore");

        const clearRequest = objectStore.clear();

        clearRequest.onsuccess = function (event) {
            console.log("User data has been cleared from the database.");
        };

        clearRequest.onerror = function (event) {
            console.error("Error clearing data:", event.target.error);
        };
    };
}

export function getUsername() {
    return getFromDB('username');
}

export function getAccessToken() {
    return getFromDB('accessToken');
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