# `consts.js` — How It Works

## `ENDPOINT`

This constant stores the base URL of the server used for API requests.

```js
export const ENDPOINT = 'https://my-site-server-ec5c73b08ce0.herokuapp.com';
```

## `BUBBLEGAME_ENDPOINT`

The endpoint URL specifically for BubbleGame. This constant constructs the URL for the Bubble Game by appending
`/bubblegame` to the base URL.

```js
export const BUBBLEGAME_ENDPOINT = `${ENDPOINT}/bubblegame`;
```

## `DB_VERSION`

This constant defines the current version of the IndexedDB database. It is used to handle database upgrades and schema
changes.

```js
export const DB_VERSION = 5;
```