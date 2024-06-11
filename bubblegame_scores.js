import {BUBBLEGAME_ENDPOINT} from "./global/js/consts.js";
import {getUsername} from "./global/js/netUtils.js";

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

function onResize() {
    const scoreInfoElements = document.querySelectorAll('.scoreinfo');
    const usernameElements = document.querySelectorAll('.username');
    const rankingElements = document.querySelectorAll('.ranking');

    const innerWidth = window.innerWidth;
    if (innerWidth >= 972) {
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

async function renderLeaderboard() {
    await renderSelfScore();
    await renderTopScores();
}

// Function to create a score info element
function createScoreInfo(scoreData) {
    const scoreInfo = document.createElement("div");
    scoreInfo.classList.add("scoreinfo");

    let backgroundColor;
    switch (scoreData.rank) {
        case 1:
            backgroundColor = "hsla(46,98%,52%,0.75)";
            break;
        case 2:
            backgroundColor = "hsla(190,78%,50%,0.75)";
            break;
        case 3:
            backgroundColor = "hsla(27,100%,45%,0.75)";
            break;
        default:
            backgroundColor = "hsla(194,16%,73%,0.75)";
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
            const container = document.getElementById("self-score-container");
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

// Function to render top scores
async function renderTopScores() {
    // Fetch data from high-score endpoint
    await fetch(`${BUBBLEGAME_ENDPOINT}/highscores/${queryMode}?limit=20`)
        .then(response => response.json())
        .then(json => {
            // Get the container to render scores
            const topScoresContainer = document.getElementById("top-scores-container");
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

function getDeviceCategory() {
    const category = localStorage.getItem('bubblegame_device_category');
    return category ? category : 'mobile';
}