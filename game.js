// Hämta canvas och context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ladda bakgrundsbilder
const bgImage = new Image();
bgImage.src = 'images/bg.png';

const bgScrollImage = new Image();
bgScrollImage.src = 'images/bg_scroll_clean.png';

const bgCloudsImage = new Image();
bgCloudsImage.src = 'images/bg_clouds.png';

// Spelkonstanter
const GRAVITY = 0.2;
const JUMP_FORCE = -10;
const MOVE_SPEED = 4.5;
const FLY_SLOW_FACTOR = 0.7; // Hur mycket flygningen bromsar fallet (lägre = mer bromsning)
const MAX_FLY_ENERGY = 100;
const FLY_ENERGY_DRAIN = 1;
const FLY_ENERGY_RECHARGE = 1.5;

// Spelarens tillstånd
const player = {
    x: 150,
    y: 200,
    width: 80,
    height: 80,
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
let gameStarted = false;

// Plattformar
const platforms = [
    // Marken
    { x: 0, y: 1000, width: 7000, height: 80, color: '#8B4513' },

    // Startområde
    { x: 450, y: 880, width: 270, height: 30, color: '#CD853F' },
    { x: 900, y: 780, width: 230, height: 30, color: '#CD853F' },
    { x: 1300, y: 670, width: 270, height: 30, color: '#CD853F' },

    // Mitt-sektion med gap
    { x: 1800, y: 880, width: 300, height: 30, color: '#CD853F' },
    { x: 2250, y: 750, width: 230, height: 30, color: '#CD853F' },
    { x: 2700, y: 640, width: 270, height: 30, color: '#CD853F' },

    // Hög plattform (kräver flygning)
    { x: 3150, y: 470, width: 300, height: 30, color: '#FFD700' },

    // Trappsteg
    { x: 3750, y: 880, width: 180, height: 30, color: '#CD853F' },
    { x: 3975, y: 780, width: 180, height: 30, color: '#CD853F' },
    { x: 4200, y: 680, width: 180, height: 30, color: '#CD853F' },
    { x: 4425, y: 580, width: 180, height: 30, color: '#CD853F' },

    // Slutområde
    { x: 4800, y: 810, width: 450, height: 30, color: '#CD853F' },
    { x: 5550, y: 880, width: 750, height: 30, color: '#CD853F' },
];

// Mynt att samla
const coins = [
    { x: 555, y: 810, width: 40, height: 40, collected: false },
    { x: 990, y: 710, width: 40, height: 40, collected: false },
    { x: 1395, y: 600, width: 40, height: 40, collected: false },
    { x: 1905, y: 810, width: 40, height: 40, collected: false },
    { x: 2340, y: 680, width: 40, height: 40, collected: false },
    { x: 2790, y: 570, width: 40, height: 40, collected: false },
    { x: 3255, y: 400, width: 40, height: 40, collected: false },
    { x: 3855, y: 810, width: 40, height: 40, collected: false },
    { x: 4080, y: 710, width: 40, height: 40, collected: false },
    { x: 4530, y: 510, width: 40, height: 40, collected: false },
    { x: 5025, y: 740, width: 40, height: 40, collected: false },
    { x: 5850, y: 810, width: 40, height: 40, collected: false },
];

// Hinder
const obstacles = [
    { x: 2475, y: 950, width: 60, height: 60, type: 'spike' },
    { x: 3300, y: 950, width: 60, height: 60, type: 'spike' },
    { x: 4650, y: 950, width: 60, height: 60, type: 'spike' },
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

    // Kropp (brun) - större
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(20, 25, 40, 35);

    // Huvud
    ctx.fillStyle = '#654321';
    ctx.fillRect(50, 20, 25, 25);

    // Öga (vitt först, sedan pupill)
    ctx.fillStyle = '#FFF';
    ctx.fillRect(65, 28, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(67, 30, 3, 3);

    // Näbb
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(73, 33, 7, 5);

    // Vinge (animation baserad på tid)
    const wingOffset = Math.sin(gameTime * 0.2) * 6;
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(25, 30 + wingOffset, 20, 10);

    // Stjärt
    ctx.fillStyle = '#654321';
    ctx.fillRect(8, 35, 15, 15);

    // Ben (små)
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(35, 60, 5, 10);
    ctx.fillRect(45, 60, 5, 10);

    ctx.restore();

    // Rita flyg-energimätare
    const barWidth = 90;
    const barHeight = 12;
    const barX = player.x - camera.x - 5;
    const barY = player.y - camera.y - 25;

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
            const offset = Math.sin(gameTime * 0.15) * 5;

            ctx.save();
            ctx.translate(
                coin.x - camera.x + coin.width / 2,
                coin.y - camera.y + coin.height / 2 + offset
            );
            ctx.rotate(rotation);

            // Guldmynt
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();

            // Inre cirkel
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
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

// Rita bakgrund (med bilder i lager)
function drawBackground() {
    // LAGER 1: Fast bakgrund (bg.png) - täcker hela canvas, ingen scrollning
    if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback om bilden inte är laddad än - himmel gradient
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // LAGER 2: Långsam scrollande bakgrund (bg_scroll.png) - tileable med parallax
    if (bgScrollImage.complete && bgScrollImage.naturalWidth > 0) {
        const tileWidth = bgScrollImage.width;
        const tileHeight = bgScrollImage.height;

        // Långsam parallax scrolling
        const parallaxSpeed = 0.25; // 25% av kamerans hastighet
        const bgOffsetX = (camera.x * parallaxSpeed) % tileWidth;

        // Beräkna hur många tiles som behövs för att täcka skärmen
        const tilesX = Math.ceil(canvas.width / tileWidth) + 2;
        const tilesY = Math.ceil(canvas.height / tileHeight) + 1;

        // Rita grid av tiles
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                ctx.drawImage(
                    bgScrollImage,
                    x * tileWidth - bgOffsetX,
                    y * tileHeight,
                    tileWidth,
                    tileHeight
                );
            }
        }
    }

    // LAGER 3: Snabbare scrollande moln (bg_clouds.png) - tileable med snabbare parallax
    if (bgCloudsImage.complete && bgCloudsImage.naturalWidth > 0) {
        const tileWidth = bgCloudsImage.width;
        const tileHeight = bgCloudsImage.height;

        // Snabbare parallax scrolling (närmare spelaren)
        const parallaxSpeed = 0.55; // 55% av kamerans hastighet
        const bgOffsetX = (camera.x * parallaxSpeed) % tileWidth;

        // Beräkna hur många tiles som behövs för att täcka skärmen
        const tilesX = Math.ceil(canvas.width / tileWidth) + 2;
        const tilesY = Math.ceil(canvas.height / tileHeight) + 1;

        // Rita grid av tiles
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                ctx.drawImage(
                    bgCloudsImage,
                    x * tileWidth - bgOffsetX,
                    y * tileHeight,
                    tileWidth,
                    tileHeight
                );
            }
        }
    }
}

function drawCloud(x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 38, 0, Math.PI * 2);
    ctx.arc(x + 60, y, 30, 0, Math.PI * 2);
    ctx.fill();
}

// Uppdatera spellogik
function update() {
    // Vänta på att spelet startar
    if (!gameStarted) {
        // Starta spelet när någon tangent trycks
        if (Object.keys(keys).some(key => keys[key])) {
            gameStarted = true;
        }
        return; // Uppdatera inte spelet förrän det har startat
    }

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

    // Hoppa - automatiskt när man håller mellanslag och är på marken
    if (keys[' '] && player.isGrounded) {
        player.velocityY = JUMP_FORCE;
        player.jumpCount = 1;
    }

    // Ladda flyg-energi på marken
    if (player.isGrounded && player.flyEnergy < MAX_FLY_ENERGY) {
        player.flyEnergy += FLY_ENERGY_RECHARGE;
        if (player.flyEnergy > MAX_FLY_ENERGY) player.flyEnergy = MAX_FLY_ENERGY;
    }

    // Gravitation
    player.velocityY += GRAVITY;

    // Flygförmåga (bromsar fallet istället för att lyfta)
    if (keys[' '] && player.flyEnergy > 0 && !player.isGrounded && player.velocityY > 0) {
        player.velocityY *= FLY_SLOW_FACTOR; // Bromsa fallet
        player.flyEnergy -= FLY_ENERGY_DRAIN;
        if (player.flyEnergy < 0) player.flyEnergy = 0;
    }

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
            player.x = 150;
            player.y = 200;
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
        player.x = 150;
        player.y = 200;
        player.velocityX = 0;
        player.velocityY = 0;
    }
}

// Rita välkomstskärm (retro dialogruta)
function drawWelcomeScreen() {
    // Dialogruta längst ner (klassisk stil)
    const boxWidth = 1400;
    const boxHeight = 280;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = canvas.height - boxHeight - 80;

    // Yttre svart ram (retro stil)
    ctx.fillStyle = '#000';
    ctx.fillRect(boxX - 8, boxY - 8, boxWidth + 16, boxHeight + 16);

    // Vit mellanram
    ctx.fillStyle = '#FFF';
    ctx.fillRect(boxX - 4, boxY - 4, boxWidth + 8, boxHeight + 8);

    // Mörkbrun bakgrund
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Inre dekorativ ram (guldkant)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX + 12, boxY + 12, boxWidth - 24, boxHeight - 24);

    // Pixlig retro-text med monospace font
    ctx.textAlign = 'center';
    ctx.imageSmoothingEnabled = false;

    // Rubrik
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.fillText('VÄLKOMMEN TILL SPARVLAND, SPARVEN!', canvas.width / 2, boxY + 70);

    // Huvudtext (SPARVKUNGEN)
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('HELGAD VARE SPARVKUNGEN,', canvas.width / 2, boxY + 125);
    ctx.fillText('RUNDAST AV ALLA RUNDA TING!!!', canvas.width / 2, boxY + 170);

    // Blinkande instruktion (classic retro)
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
        ctx.font = '28px "Courier New", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('▶ TRYCK PÅ VALFRI TANGENT FÖR ATT BÖRJA ◀', canvas.width / 2, boxY + 230);
    }

    ctx.textAlign = 'left';
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

    // Rita välkomstskärm om spelet inte har startat
    if (!gameStarted) {
        drawWelcomeScreen();
    }
}

// Huvudloop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Starta spelet
gameLoop();
