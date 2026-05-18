// Game variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameStats = document.getElementById("game-stats");
const gameOverScreen = document.getElementById("game-over");
const gameWinScreen = document.getElementById("game-win");
const restartButton = document.getElementById("restart-button");
const playAgainButton = document.getElementById("play-again-button");
const homeMenu = document.getElementById("home-menu");
const startButton = document.getElementById("start-button");
const muteButton = document.getElementById("mute-button");

// Player sprite
const playerImage = new Image();
playerImage.src = "images/Treasure Tide Boat 2.png";
let playerFacingLeft = false;

// Falling object sprites
const coinImage = new Image();
coinImage.src = "images/coin-fish.png";
const gemImage = new Image();
gemImage.src = "images/pearl.png";
const obstacleImage = new Image();
obstacleImage.src = "images/obstacle-hook.png";

// Render sizes for falling objects
const coinRenderSize = 46;
const gemRenderSize = 60;
const obstacleRenderSize = 60;

// Game settings
const laneCount = 5;
const laneWidth = canvas.width / laneCount;
const playerSize = 30;
const playerRenderSize = 100;
const objectSize = 20;
const playerY = canvas.height - playerSize - 10;
let playerLane = Math.floor(laneCount / 2);
let coins = 0;
let lives = 3;
let gameRunning = false;
let frameCount = 0;
let audioMuted = false;

const coinSound = new Audio("audio/coin-collect.mp3");
const gemSound = new Audio("audio/gem-collect.mp3");
const obstacleSound = new Audio("audio/obstacle-hit.mp3");
const gameOverSound = new Audio("audio/game-over.mp3");
const backgroundMusic = new Audio("audio/background-music.mp3");

[coinSound, gemSound, obstacleSound, gameOverSound, backgroundMusic].forEach((audio) => {
  audio.preload = "auto";
  audio.load();
  audio.addEventListener("error", () => {});
});

backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;

function safePlaySound(audio) {
  if (audioMuted || !audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // ignore missing or blocked audio
  }
}

function startBackgroundMusic() {
  if (audioMuted) return;
  try {
    backgroundMusic.play().catch(() => {});
  } catch (e) {
    // ignore play error
  }
}

function setAudioMuted(muted) {
  audioMuted = muted;
  [coinSound, gemSound, obstacleSound, gameOverSound, backgroundMusic].forEach((audio) => {
    audio.muted = muted;
  });
  if (!muted) {
    startBackgroundMusic();
  }
  if (muteButton) {
    muteButton.innerText = muted ? "🔇" : "🔊";
  }
}

// Arrays to store game objects
let fallingObjects = [];

// Object types
const OBJECT_TYPES = {
  COIN: { value: 1, color: "yellow", shape: "circle" },
  GEM: { value: 10, color: "purple", shape: "diamond" },
  OBSTACLE: { value: 0, color: "red", shape: "x" },
};

// Initialize the game
function init() {
  coins = 0;
  lives = 3;
  fallingObjects = [];
  playerLane = Math.floor(laneCount / 2);
  gameRunning = true;
  gameOverScreen.style.display = "none";
  gameWinScreen.style.display = "none";
  updateStats();
  startBackgroundMusic();
}

// Move player left or right
function movePlayer(direction) {
  if (!gameRunning) return;

  if (direction === "left" && playerLane > 0) {
    playerLane--;
    playerFacingLeft = true;
  } else if (direction === "right" && playerLane < laneCount - 1) {
    playerLane++;
    playerFacingLeft = false;
  }
}

// Add a new falling object
function addFallingObject() {
  if (!gameRunning) return;

  const lane = Math.floor(Math.random() * laneCount);

  // Use weighted probabilities to make gems rare
  const rand = Math.random();
  let type;

  if (rand < 0.15) {
    // 15% chance for gems (rare)
    type = OBJECT_TYPES.GEM;
  } else if (rand < 0.6) {
    // 45% chance for coins
    type = OBJECT_TYPES.COIN;
  } else {
    // 40% chance for obstacles
    type = OBJECT_TYPES.OBSTACLE;
  }

  fallingObjects.push({
    lane: lane,
    y: -objectSize,
    type: type,
    speed: 2 + Math.random() * 2, // Random speed between 2 and 4
  });
}

// Update all game objects
function update() {
  if (!gameRunning) return;

  // Update falling objects
  for (let i = fallingObjects.length - 1; i >= 0; i--) {
    const obj = fallingObjects[i];
    obj.y += obj.speed;

    // Check if object is out of bounds
    if (obj.y > canvas.height) {
      fallingObjects.splice(i, 1);
      continue;
    }

    // Check collision with player
    const playerX = playerLane * laneWidth + laneWidth / 2;
    const objX = obj.lane * laneWidth + laneWidth / 2;

    const distance = Math.sqrt(
      Math.pow(playerX - objX, 2) + Math.pow(playerY - obj.y, 2),
    );

    if (distance < (playerSize + objectSize) / 2) {
      // Collision detected
      if (obj.type === OBJECT_TYPES.OBSTACLE) {
        safePlaySound(obstacleSound);
        lives--;
        updateStats();
        if (lives <= 0) {
          gameOver();
        }
      } else {
        if (obj.type === OBJECT_TYPES.GEM) {
          safePlaySound(gemSound);
        } else {
          safePlaySound(coinSound);
        }
        coins += obj.type.value;
        updateStats();
        if (coins >= 100) {
          gameWin();
        }
      }
      fallingObjects.splice(i, 1);
    }
  }

  // Randomly add new objects
  if (Math.random() < 0.02) {
    // 2% chance each frame
    addFallingObject();
  }
}

// Draw everything on canvas
function draw() {
  // Initialize bubble state once
  if (!draw.bubbles) {
    draw.bubbles = [];
  }

  // Initialize background image once
  if (!draw.backgroundImage) {
    draw.backgroundImage = new Image();
    draw.backgroundImage.src = "Images/Treasure Tide Background.jpg";
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background image if loaded, otherwise fill with deep sea gradient
  if (draw.backgroundImage.complete && draw.backgroundImage.naturalWidth) {
    ctx.drawImage(draw.backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0b1a35");
    gradient.addColorStop(1, "#04101f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Add bubbles from the bottom
  if (Math.random() < 0.12) {
    draw.bubbles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      radius: 2 + Math.random() * 4,
      speed: 0.4 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.2,
      drift: (Math.random() - 0.5) * 0.5,
    });
  }

  // Draw and update bubbles
  for (let i = draw.bubbles.length - 1; i >= 0; i--) {
    const bubble = draw.bubbles[i];
    bubble.y -= bubble.speed;
    bubble.x += bubble.drift;
    bubble.alpha = Math.max(0, bubble.alpha - 0.001);

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${bubble.alpha})`;
    ctx.fill();

    if (bubble.y + bubble.radius < 0 || bubble.alpha <= 0) {
      draw.bubbles.splice(i, 1);
    }
  }

  // Draw lanes (bioluminescent teal lines)
  ctx.strokeStyle = "rgba(0, 255, 200, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 1; i < laneCount; i++) {
    const x = i * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw player boat sprite upside down
  const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
  if (playerImage.complete && playerImage.naturalWidth) {
    ctx.save();
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 15;
    ctx.translate(playerX + playerSize / 2, playerY + playerSize / 2);
    ctx.rotate(Math.PI);
    if (playerFacingLeft) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      playerImage,
      -playerRenderSize / 2,
      -playerRenderSize / 2,
      playerRenderSize,
      playerRenderSize,
    );
    ctx.restore();
  } else {
    ctx.fillStyle = "blue";
    ctx.fillRect(playerX, playerY, playerSize, playerSize);
  }

  // Draw falling objects
  for (const obj of fallingObjects) {
    const objX = obj.lane * laneWidth + laneWidth / 2;

    if (obj.type === OBJECT_TYPES.COIN) {
      const imageSize = coinRenderSize;
      ctx.save();
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 14;
      ctx.drawImage(
        coinImage,
        objX - imageSize / 2,
        obj.y - imageSize / 2,
        imageSize,
        imageSize,
      );
      ctx.restore();
    } else if (obj.type === OBJECT_TYPES.GEM) {
      const imageSize = gemRenderSize;
      ctx.save();
      ctx.shadowColor = "#aee8ff";
      ctx.shadowBlur = 18;
      ctx.drawImage(
        gemImage,
        objX - imageSize / 2,
        obj.y - imageSize / 2,
        imageSize,
        imageSize,
      );
      ctx.restore();
    } else if (obj.type === OBJECT_TYPES.OBSTACLE) {
      const imageSize = obstacleRenderSize;
      const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.2 + obj.lane);
      ctx.save();
      ctx.shadowColor = "rgba(255, 51, 51, 0.9)";
      ctx.shadowBlur = 18 + pulse * 18;
      ctx.drawImage(
        obstacleImage,
        objX - imageSize / 2,
        obj.y - imageSize / 2,
        imageSize,
        imageSize,
      );
      ctx.restore();
    }
  }
}

// Game loop
function gameLoop() {
  update();
  draw();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Update statistics display
function updateStats() {
  const fishCount = document.getElementById("fish-count");
  if (fishCount) {
    fishCount.innerText = coins;
  }
  const hearts = Array.from({ length: lives }, () => "❤️").join("");
  gameStats.querySelector(".hearts").innerText = hearts;
}

// Game over
function gameOver() {
  gameRunning = false;
  gameOverScreen.style.display = "block";
  safePlaySound(gameOverSound);
}

// Game win
function gameWin() {
  gameRunning = false;
  gameWinScreen.style.display = "block";
}

// Event listeners
document.addEventListener("keydown", (e) => {
  // Arrow keys
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    movePlayer("left");
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    movePlayer("right");
  }
});

restartButton.addEventListener("click", init);
playAgainButton.addEventListener("click", init);
startButton.addEventListener("click", () => {
  homeMenu.style.display = "none";
  init();
  gameRunning = true;
});

if (muteButton) {
  muteButton.addEventListener("click", () => {
    setAudioMuted(!audioMuted);
  });
  muteButton.innerText = audioMuted ? "🔇" : "🔊";
}

// Start the game menu
init();
gameRunning = false;
gameLoop();
