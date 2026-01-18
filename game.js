// Hämta canvas och context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Spelkonstanter
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const FLY_FORCE = -8;
const MAX_FLY_ENERGY = 100;
const FLY_ENERGY_DRAIN = 2;
const FLY_ENERGY_RECHARGE = 1;

// Spelarens tillstånd
const player = {
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    flyEnergy: MAX_FLY_ENERGY,
    facingRight: true,
    jumpCount: 0,
    maxJumps: 2
};

// Kamera
const camera = {
    x: 0,
    y: 0
};

// Tangentbordsinput
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Spelvariabler
let score = 0;
let gameTime = 0;

// Plattformar
const platforms = [
    // Marken
    { x: 0, y: 550, width: 3000, height: 50, color: '#8B4513' },

    // Startområde
    { x: 200, y: 480, width: 120, height: 20, color: '#CD853F' },
    { x: 400, y: 420, width: 100, height: 20, color: '#CD853F' },
    { x: 580, y: 360, width: 120, height: 20, color: '#CD853F' },

    // Mitt-sektion med gap
    { x: 800, y: 480, width: 150, height: 20, color: '#CD853F' },
    { x: 1050, y: 400, width: 100, height: 20, color: '#CD853F' },
    { x: 1250, y: 350, width: 120, height: 20, color: '#CD853F' },

    // Hög plattform (kräver flygning)
    { x: 1450, y: 250, width: 150, height: 20, color: '#FFD700' },

    // Trappsteg
    { x: 1700, y: 480, width: 80, height: 20, color: '#CD853F' },
    { x: 1800, y: 420, width: 80, height: 20, color: '#CD853F' },
    { x: 1900, y: 360, width: 80, height: 20, color: '#CD853F' },
    { x: 2000, y: 300, width: 80, height: 20, color: '#CD853F' },

    // Slutområde
    { x: 2200, y: 450, width: 200, height: 20, color: '#CD853F' },
    { x: 2500, y: 480, width: 300, height: 20, color: '#CD853F' },
];

// Mynt att samla
const coins = [
    { x: 250, y: 440, width: 20, height: 20, collected: false },
    { x: 440, y: 380, width: 20, height: 20, collected: false },
    { x: 620, y: 320, width: 20, height: 20, collected: false },
    { x: 870, y: 440, width: 20, height: 20, collected: false },
    { x: 1090, y: 360, width: 20, height: 20, collected: false },
    { x: 1290, y: 310, width: 20, height: 20, collected: false },
    { x: 1520, y: 210, width: 20, height: 20, collected: false },
    { x: 1740, y: 440, width: 20, height: 20, collected: false },
    { x: 1840, y: 380, width: 20, height: 20, collected: false },
    { x: 2040, y: 260, width: 20, height: 20, collected: false },
    { x: 2300, y: 410, width: 20, height: 20, collected: false },
    { x: 2650, y: 440, width: 20, height: 20, collected: false },
];

// Hinder
const obstacles = [
    { x: 1100, y: 520, width: 30, height: 30, type: 'spike' },
    { x: 1500, y: 520, width: 30, height: 30, type: 'spike' },
    { x: 2100, y: 520, width: 30, height: 30, type: 'spike' },
];

// Kollisionsdetektering
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Rita sparven (enkel pixel-art stil)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x - camera.x, player.y - camera.y);

    if (!player.facingRight) {
        ctx.scale(-1, 1);
        ctx.translate(-player.width, 0);
    }

    // Kropp (brun)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(8, 10, 16, 14);

    // Huvud
    ctx.fillStyle = '#654321';
    ctx.fillRect(20, 8, 10, 10);

    // Öga
    ctx.fillStyle = '#000';
    ctx.fillRect(26, 11, 2, 2);

    // Näbb
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(29, 13, 3, 2);

    // Vinge (animation baserad på tid)
    const wingOffset = Math.sin(gameTime * 0.2) * 3;
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(10, 12 + wingOffset, 8, 4);

    // Stjärt
    ctx.fillStyle = '#654321';
    ctx.fillRect(3, 14, 6, 6);

    // Ben (små)
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(14, 24, 2, 4);
    ctx.fillRect(18, 24, 2, 4);

    ctx.restore();

    // Rita flyg-energimätare
    const barWidth = 50;
    const barHeight = 6;
    const barX = player.x - camera.x;
    const barY = player.y - camera.y - 15;

    // Bakgrund
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Energi
    const energyWidth = (player.flyEnergy / MAX_FLY_ENERGY) * barWidth;
    const energyColor = player.flyEnergy > 30 ? '#3498db' : '#e74c3c';
    ctx.fillStyle = energyColor;
    ctx.fillRect(barX, barY, energyWidth, barHeight);

    // Ram
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// Rita plattformar
function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(
            platform.x - camera.x,
            platform.y - camera.y,
            platform.width,
            platform.height
        );

        // Lägg till kant/skugga
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            platform.x - camera.x,
            platform.y - camera.y,
            platform.width,
            platform.height
        );
    });
}

// Rita mynt
function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            // Roterande mynt-animation
            const rotation = Math.sin(gameTime * 0.1) * 0.3;
            const offset = Math.sin(gameTime * 0.15) * 3;

            ctx.save();
            ctx.translate(
                coin.x - camera.x + coin.width / 2,
                coin.y - camera.y + coin.height / 2 + offset
            );
            ctx.rotate(rotation);

            // Guldmynt
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // Inre cirkel
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });
}

// Rita hinder
function drawObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'spike') {
            ctx.fillStyle = '#e74c3c';

            // Rita taggar
            const spikes = 3;
            const spikeWidth = obstacle.width / spikes;

            for (let i = 0; i < spikes; i++) {
                ctx.beginPath();
                ctx.moveTo(obstacle.x - camera.x + i * spikeWidth, obstacle.y - camera.y + obstacle.height);
                ctx.lineTo(obstacle.x - camera.x + i * spikeWidth + spikeWidth / 2, obstacle.y - camera.y);
                ctx.lineTo(obstacle.x - camera.x + (i + 1) * spikeWidth, obstacle.y - camera.y + obstacle.height);
                ctx.closePath();
                ctx.fill();
            }

            // Ram
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                obstacle.x - camera.x,
                obstacle.y - camera.y,
                obstacle.width,
                obstacle.height
            );
        }
    });
}

// Rita bakgrund (moln och sol)
function drawBackground() {
    // Himmel gradient (redan i CSS)

    // Sol
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(650, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Moln
    drawCloud(150 - (gameTime % 800), 100);
    drawCloud(450 - (gameTime % 800), 150);
    drawCloud(650 - (gameTime % 800), 80);
}

function drawCloud(x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 20, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Uppdatera spellogik
function update() {
    gameTime++;

    // Hantera input
    player.velocityX = 0;

    if (keys['ArrowLeft']) {
        player.velocityX = -MOVE_SPEED;
        player.facingRight = false;
    }
    if (keys['ArrowRight']) {
        player.velocityX = MOVE_SPEED;
        player.facingRight = true;
    }

    // Hoppa
    if (keys[' '] && player.jumpCount < player.maxJumps) {
        if (!keys.wasSpacePressed) {
            player.velocityY = JUMP_FORCE;
            player.jumpCount++;
            keys.wasSpacePressed = true;
        }
    } else if (!keys[' ']) {
        keys.wasSpacePressed = false;
    }

    // Flygförmåga (håll mellanslag)
    if (keys[' '] && player.flyEnergy > 0 && !player.isGrounded) {
        player.velocityY += FLY_FORCE * 0.2; // Mjukare flygning
        player.flyEnergy -= FLY_ENERGY_DRAIN;
        if (player.flyEnergy < 0) player.flyEnergy = 0;
    }

    // Ladda flyg-energi på marken
    if (player.isGrounded && player.flyEnergy < MAX_FLY_ENERGY) {
        player.flyEnergy += FLY_ENERGY_RECHARGE;
        if (player.flyEnergy > MAX_FLY_ENERGY) player.flyEnergy = MAX_FLY_ENERGY;
    }

    // Gravitation
    player.velocityY += GRAVITY;

    // Uppdatera position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Kollision med plattformar
    player.isGrounded = false;

    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Kollidera från ovan (landa på plattform)
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
                player.jumpCount = 0;
            }
            // Kollidera från nedan (slå i huvudet)
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Kollidera från sidan
            else {
                if (player.velocityX > 0) {
                    player.x = platform.x - player.width;
                } else if (player.velocityX < 0) {
                    player.x = platform.x + platform.width;
                }
            }
        }
    });

    // Samla mynt
    coins.forEach(coin => {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            score += 10;
            document.getElementById('score').textContent = 'Poäng: ' + score;
        }
    });

    // Kollision med hinder
    obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
            // Reset till start
            player.x = 100;
            player.y = 100;
            player.velocityX = 0;
            player.velocityY = 0;
            score = Math.max(0, score - 20);
            document.getElementById('score').textContent = 'Poäng: ' + score;
        }
    });

    // Uppdatera kamera för att följa spelaren
    camera.x = player.x - canvas.width / 3;
    if (camera.x < 0) camera.x = 0;

    // Förhindra att spelaren faller utanför skärmen
    if (player.y > canvas.height) {
        player.x = 100;
        player.y = 100;
        player.velocityX = 0;
        player.velocityY = 0;
    }
}

// Rita allt
function draw() {
    // Rensa canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rita i rätt ordning
    drawBackground();
    drawPlatforms();
    drawCoins();
    drawObstacles();
    drawPlayer();
}

// Huvudloop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Starta spelet
gameLoop();
