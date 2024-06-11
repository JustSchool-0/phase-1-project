# `main.js` — How It Works

This script is responsible for managing the dynamic behavior of a Bubble Game leaderboard web page. It includes
functionality to toggle between mobile and mouse & keyboard (mnk) modes, resize the layout, and render user and top
scores.

## Imports

```js
import {BUBBLEGAME_ENDPOINT} from "./consts.js";
import {getUsername} from "./netUtils.js";
```

- `BUBBLEGAME_ENDPOINT`: A constant URL endpoint for fetching high scores.
- `getUsername`: A utility function to get the currently logged-in user's username.

## Initial Setup

```js
let queryMode = 'mobile';

document.addEventListener("DOMContentLoaded", () => {
    const mobileButton = document.querySelector("#nav-mobile-button");
    const mnkButton = document.querySelector("#nav-mnk-button");

    mobileButton.addEventListener("click", async function () {
        await toggleActive();
    });
    mnkButton.addEventListener("click", async function () {
        await toggleActive();
    });

    onResize();
    setTimeout(async () => {
        onResize();
        await toggleActive(getDeviceCategory());
    }, 100);
    window.addEventListener("resize", onResize);
});
```

- `queryMode`: A global variable to track the current device category (`mobile` or `mnk`).
- `DOMContentLoaded`: Sets up event listeners for mode buttons and initializes the layout on page load.

## `toggleActive` Function

Toggles the active mode between mobile and mnk and updates the UI accordingly.

```js
async function toggleActive(modeOverride = null, render = true) {
    const mobileButton = document.querySelector("#nav-mobile-button");
    const mnkButton = document.querySelector("#nav-mnk-button");

    if ((modeOverride !== 'mobile') && (queryMode === 'mobile')) {
        mnkButton.classList.add("active");
        mobileButton.classList.remove("active");
        queryMode = 'mnk';
    } else {
        mnkButton.classList.remove("active");
        mobileButton.classList.add("active");
        queryMode = 'mobile';
    }

    if (render) {
        await renderLeaderboard();
        onResize();
    }
}
```

- `modeOverride`: Optional parameter to manually set the mode.
- `render`: Determines whether to re-render the leaderboard.

## `onResize` Function

Adjusts the layout of the leaderboard based on the window width. Uses a grid layout for horizontal and vertical
alignment of score info elements. This ensures the layout is optimized for both mobile and desktop views.

```js
function onResize() {
    const scoreInfoElements = document.querySelectorAll('.scoreinfo');
    const usernameElements = document.querySelectorAll('.username');
    const rankingElements = document.querySelectorAll('.ranking');

    if (window.innerWidth >= 972) {
        // Horizontal layout
        scoreInfoElements.forEach((scoreInfo) => {
            scoreInfo.style.gridTemplateColumns = 'repeat(3, 1fr)';
            scoreInfo.style.gap = '40px';
            scoreInfo.style.textAlign = 'left';
        });
        usernameElements.forEach((username) => {
            username.style.textAlign = 'left';
        });
        rankingElements.forEach((ranking) => {
            ranking.style.textAlign = 'right';
            ranking.style.marginTop = 'auto';
            ranking.style.marginRight = '0';
        });
    } else {
        // Vertical layout
        scoreInfoElements.forEach((scoreInfo) => {
            scoreInfo.style.gridTemplateColumns = 'repeat(1, 3fr)';
            scoreInfo.style.gap = '0';
            scoreInfo.style.textAlign = 'center';
        });
        usernameElements.forEach((username) => {
            username.style.textAlign = 'center';
        });
        rankingElements.forEach((ranking) => {
            ranking.style.textAlign = 'center';
            ranking.style.marginTop = '10px';
            ranking.style.marginRight = 'auto';
        });
    }
}
```

## `renderLeaderboard` Function

Utility function to render both the current user's score and the top scores.

```js
async function renderLeaderboard() {
    await renderSelfScore();
    await renderTopScores();
}
```

## `createScoreInfo` Function

Creates a div element with score information styled according to the user's rank.

```js
function createScoreInfo(scoreData) {
    const scoreInfo = document.createElement("div");
    scoreInfo.classList.add("scoreinfo");

    let backgroundColor;
    switch (scoreData.rank) {
        case 1:
            backgroundColor = "hsla(46, 98%, 52%, 0.75)";
            break;
        case 2:
            backgroundColor = "hsla(190, 78%, 50%, 0.75)";
            break;
        case 3:
            backgroundColor = "hsla(27, 100%, 45%, 0.75)";
            break;
        default:
            backgroundColor = "hsla(194, 16%, 73%, 0.75)";
            break;
    }

    scoreInfo.innerHTML = `
            <h2 class="username">${scoreData.username}</h2>
            <div class="stats-container">
                <p class="stats">${scoreData.score.toFixed(1)} Score</p>
                <p class="stats">${(scoreData.accuracy * 100).toFixed(0)}% Accuracy</p>
                <p class="stats">${scoreData.pops} Pops</p>
            </div>
            <h2 class="ranking" style="background-color: ${backgroundColor};">Rank ${scoreData.rank}</h2>
        `;

    return scoreInfo;
}
```

## `renderSelfScore` Function

Fetches and displays the current user's score from the server.

```js
async function renderSelfScore() {
    const username = await getUsername();
    if (!username) {
        return;
    }
    // Fetch data for a specific user from high-score endpoint
    await fetch(`${BUBBLEGAME_ENDPOINT}/highscores/user/${username}?device_category=${queryMode}`)
        .then(response => response.json())
        .then(json => {
            // Get the container to render score
            const container = document.querySelector("#self-score-container");
            if (container) {
                // Remove all children
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }

            // Render the score for the specific user
            const scoreInfo = createScoreInfo(json);
            container.appendChild(scoreInfo);
        })
        .catch(error => {
            console.error(`Error fetching and rendering score for ${username}:`, error);
        });
}
```

## `renderTopScores` Function

Fetches and displays the top 20 scores from the server for the current mode (mobile or mnk).

```js
async function renderTopScores() {
    // Fetch data from high-score endpoint
    await fetch(`${BUBBLEGAME_ENDPOINT}/highscores/${queryMode}?limit=20`)
        .then(response => response.json())
        .then(json => {
            // Get the container to render scores
            const topScoresContainer = document.querySelector("#top-scores-container");
            if (topScoresContainer) {
                // Remove all children
                while (topScoresContainer.firstChild) {
                    topScoresContainer.removeChild(topScoresContainer.firstChild);
                }
            }

            // Iterate through the fetched scores and render them
            json.forEach((scoreData, index) => {
                const scoreInfo = createScoreInfo(scoreData);
                topScoresContainer.appendChild(scoreInfo);
            });
        })
        .catch(error => {
            console.error(`Error fetching and rendering top ${queryMode} scores:`, error);
        });
}
```

## `getDeviceCategory` Function

Retrieves the device category from local storage, defaulting to mobile if not found.

```js
function getDeviceCategory() {
    const category = localStorage.getItem('bubblegame_device_category');
    return category ? category : 'mobile';
}
```