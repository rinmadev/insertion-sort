const duelArea = document.getElementById("duel");
let debug = false;
let gameStarted = false;
let allowedToClick = true;
let clickTimeout;
let gameOver = false;
let currentScore = 0;
let shotStartTime = 0;
let currentState = "DEFAULT";
let highlightedEntry = null;
let leaderboard = [
  { name: "Django", score: 2777 },
  { name: "Cassidy", score: 2445 },
  { name: "J. Wales", score: 2075 },
  { name: "B. the Kid", score: 1400 },
  { name: "A. Morgan", score: 1385 }
];

window.addEventListener("DOMContentLoaded", () => {
  enterDefaultState();
});

function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let currentValue = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j].score < currentValue.score) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = currentValue;
  }
  return arr.slice(0, 5);
}

function updateState(state) {
  currentState = state;
  if (debug) updateStateLabel(state);
}

function updateStateLabel(state) {
  let label = document.getElementById("state-label");
  if (!label) {
    label = document.createElement("div");
    label.id = "state-label";
    label.className = "absolute top-4 left-4 text-red-600 text-xl font-bold";
    document.body.appendChild(label);
  }
  label.textContent = `Estado: ${state}`;
}

duelArea.addEventListener("click", () => {
  const music = document.getElementById("bg-music");

    if (music && music.paused) {
      music.volume = 0.05;
      music.play().catch(err => {
        console.warn("Falha ao tocar música:", err);
      });
    }

  if (!allowedToClick || gameOver) return;

  if (currentState === "DEFAULT") {
    enterPreparingState();
    return;
  }

  if (currentState === "WAITING") {
    allowedToClick = false;
    enterEndingState(false);
    return;
  }

  if (currentState === "SHOOTING") {
    allowedToClick = false;
    enterEndingState(true);
    return;
  }
});

function setCharacterXTransforms(npcX, playerX) {
  const npc = document.getElementById('npc');
  const player = document.getElementById('player');
  npc.style.transform = `translateX(${npcX})`;
  player.style.transform = `translateX(${playerX})`;
}


function enterDefaultState() {
  updateState("DEFAULT");
  allowedToClick = true;
  gameOver = false;
  const npc = document.getElementById('npc');
  const player = document.getElementById('player');
  npc.style.backgroundImage = "url('./assets/sprites/npc-idle.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-idle.png')";
  setCharacterXTransforms("-6vw", "6vw");
  enableCharacterTransition();
}

function enterPreparingState() {
  updateState("PREPARING");
  allowedToClick = false;
  const npc = document.getElementById("npc");
  const player = document.getElementById("player");
  setCharacterXTransforms("0", "0");
  npc.style.backgroundImage = "url('./assets/sprites/npc-walk.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-walk.png')";

  const title = document.getElementById("title");
  if (title) {
    title.classList.remove("opacity-100");
    title.classList.add("opacity-0");
  }

  setTimeout(() => {
    title.remove();
  }, 900);

  setTimeout(() => {
    enterWaitingState();
  }, 2000);
}

function enterWaitingState(isRetry = false) {
  updateState("WAITING");

  const npc = document.getElementById("npc");
  const player = document.getElementById("player");
  npc.style.backgroundImage = "url('./assets/sprites/npc-idle.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-idle.png')";

  const execute = () => {
    allowedToClick = true;
    const delay = 2000 + Math.floor(Math.random() * 3000);

    setTimeout(() => {
      if (gameOver) return;
      enterShootingState();
    }, delay);
  };

  if (isRetry) {
    setTimeout(execute, 2000);
  } else {
    execute();
  }
}

function enterShootingState() {
  updateState("SHOOTING");
  allowedToClick = true;
  shotStartTime = performance.now();

  const npc = document.getElementById("npc");
  const player = document.getElementById("player");
  const enemyReactionTime = 1100;
  const revolverMusic = document.getElementById("revolver-music");

  npc.style.backgroundImage = "url('./assets/sprites/npc-shot.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-shot.png')";

  if (revolverMusic) {
    revolverMusic.currentTime = 0;
    revolverMusic.volume = 0.5;
    revolverMusic.play();
  }

  clickTimeout = setTimeout(() => {
    if (!gameOver) {
      allowedToClick = false;
      enterEndingState(false);
    }
  }, enemyReactionTime);
}

function enterEndingState(playerWon) {
  updateState("ENDING");
  allowedToClick = false;
  gameOver = true;

  const npc = document.getElementById("npc");
  const player = document.getElementById("player");
  const shotSound = document.getElementById("shot-sound");

  if (shotSound) {
    shotSound.currentTime = 0;
    shotSound.volume = 0.2;
    shotSound.play();
  }

  npc.style.backgroundImage = "url('./assets/sprites/npc-shot.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-shot.png')";

  if (playerWon) {
    const reactionTime = performance.now() - shotStartTime;
    currentScore = Math.floor(900000 / reactionTime);

    const playerName = "Player";
    const entry = { name: playerName, score: currentScore };
    leaderboard.push(entry);
    leaderboard = insertionSort(leaderboard);

    if (leaderboard.includes(entry)) {
      highlightedEntry = entry;
    } else {
      highlightedEntry = null;
    }
  } else {
    currentScore = 0;
    highlightedEntry = null;
  }

  setTimeout(() => {
    if (playerWon) {
      enterWinState();
    } else {
      enterDefeatState();
    }
  }, 1000);
}

function enterWinState() {
  updateState("WIN");
  allowedToClick = false;
  const npc = document.getElementById("npc");
  const player = document.getElementById("player");
  npc.style.backgroundImage = "url('./assets/sprites/npc-death.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-shot.png')";

  setTimeout(() => {
    enterScoreboardState();
  }, 2000);
}

function enterDefeatState() {
  updateState("DEFEAT");
  allowedToClick = false;
  const npc = document.getElementById("npc");
  const player = document.getElementById("player");
  npc.style.backgroundImage = "url('./assets/sprites/npc-shot.png')";
  player.style.backgroundImage = "url('./assets/sprites/player-death.png')";

  setTimeout(() => {
    enterScoreboardState();
  }, 2000);
}

function enterScoreboardState() {
  updateState("SCOREBOARD");
  allowedToClick = false;

  const board = document.getElementById("scoreboard");
  const scoreboardText = document.getElementById("scoreboard-text");
  const finalScoreText = document.getElementById("final-score");
  const leaderboardEl = document.getElementById("leaderboard");

  if (leaderboardEl) {
    leaderboardEl.innerHTML = leaderboard
      .map((entry, index) => {
        const isHighlighted = highlightedEntry && entry.name === highlightedEntry.name && entry.score === highlightedEntry.score;
        return `<span class="${isHighlighted ? 'animate-glow text-yellow-400 font-extrabold' : ''}">
  ${index + 1}. ${entry.name} ${entry.score}
</span>`;
      })
      .join("<br>");
  }

  if (finalScoreText) {
    finalScoreText.textContent = `Score: ${currentScore}`; 
  }

  if (board) {
    board.classList.remove("hidden", "animate-scoreboard-out");
    board.classList.add("animate-scoreboard-in");
  }

  if (scoreboardText) {
    scoreboardText.classList.add("opacity-0", "pointer-events-none");
    scoreboardText.classList.remove("hidden", "animate-stamp-in", "animate-stamp-out");

    setTimeout(() => {
      scoreboardText.classList.remove("opacity-0", "pointer-events-none");
      scoreboardText.classList.add("animate-stamp-in");
    }, 1100);
  }
}

function retry() {
  const board = document.getElementById("scoreboard");
  const scoreboardText = document.getElementById("scoreboard-text");

  gameStarted = true;
  gameOver = false;
  allowedToClick = false;

  enterWaitingState(true);

  if (scoreboardText) scoreboardText.classList.add("animate-stamp-out");

  setTimeout(() => {
    if (board) board.classList.add("animate-scoreboard-out");
  }, 300);

  setTimeout(() => {
    [board, scoreboardText].forEach(el => {
      if (el) {
        el.classList.add("hidden");
        el.classList.remove("animate-stamp-out", "animate-scoreboard-out");
      }
    });
  }, 1000);
}

function enableCharacterTransition() {
  requestAnimationFrame(() => {
    const npc = document.getElementById("npc");
    const player = document.getElementById("player");
    npc.classList.add("transition-transform", "duration-[2200ms]");
    player.classList.add("transition-transform", "duration-[2200ms]");
  });
}