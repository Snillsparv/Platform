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

// Ladda sparv-sprites
const sparvSprite1 = new Image();
sparvSprite1.src = 'images/sparv_1.png';

const sparvSprite2 = new Image();
sparvSprite2.src = 'images/sparv_2.png';

const sparvFlygSprite = new Image();
sparvFlygSprite.src = 'images/sparv_flyg.png';

// Ladda plattformstiles
const tilesImage = new Image();
tilesImage.src = 'images/tiles.png';

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
let walkAnimationTime = 0;

// Plattformar (bredder justerade för hela tiles)
const platforms = [
    // Marken
    { x: 0, y: 1000, width: 7040, height: 80, color: '#8B4513' },

    // Startområde
    { x: 450, y: 880, width: 240, height: 30, color: '#CD853F' },
    { x: 900, y: 780, width: 240, height: 30, color: '#CD853F' },
    { x: 1300, y: 670, width: 240, height: 30, color: '#CD853F' },

    // Mitt-sektion med gap
    { x: 1800, y: 880, width: 320, height: 30, color: '#CD853F' },
    { x: 2250, y: 750, width: 240, height: 30, color: '#CD853F' },
    { x: 2700, y: 640, width: 240, height: 30, color: '#CD853F' },

    // Hög plattform (kräver flygning)
    { x: 3150, y: 470, width: 320, height: 30, color: '#FFD700' },

    // Trappsteg
    { x: 3750, y: 880, width: 160, height: 30, color: '#CD853F' },
    { x: 3975, y: 780, width: 160, height: 30, color: '#CD853F' },
    { x: 4200, y: 680, width: 160, height: 30, color: '#CD853F' },
    { x: 4425, y: 580, width: 160, height: 30, color: '#CD853F' },

    // Slutområde
    { x: 4800, y: 810, width: 480, height: 30, color: '#CD853F' },
    { x: 5550, y: 880, width: 720, height: 30, color: '#CD853F' },
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

// Hämta spelarens hitbox (smalare än spriten men samma höjd)
function getPlayerHitbox() {
    const hitboxWidth = 50; // Smalare än 80px sprite
    const hitboxHeight = 70; // Nästan lika hög som spriten
    const offsetX = (player.width - hitboxWidth) / 2;
    const offsetY = (player.height - hitboxHeight) / 2;
    return {
        x: player.x + offsetX,
        y: player.y + offsetY,
        width: hitboxWidth,
        height: hitboxHeight
    };
}

// Rita sparven (med animerad sprite)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x - camera.x, player.y - camera.y);

    // Vänd spriten om spelaren går åt vänster
    if (!player.facingRight) {
        ctx.scale(-1, 1);
        ctx.translate(-player.width, 0);
    }

    // Välj rätt sprite baserat på spelarens tillstånd
    let currentSprite = sparvSprite1; // Standardsprite när man står still

    // Kontrollera om spelaren flyger (i luften + använder flygförmåga)
    const isFlying = !player.isGrounded && keys[' '] && player.flyEnergy > 0 && player.velocityY > 0;
    const isWalking = player.isGrounded && (keys['ArrowLeft'] || keys['ArrowRight']);

    if (isFlying) {
        // Använd flygsprite när spelaren bromsar fallet
        currentSprite = sparvFlygSprite;
    } else if (isWalking) {
        // Gånganimation: växla mellan sprite 1 och 2 (MYCKET LÅNGSAM för test)
        walkAnimationTime++;
        if (walkAnimationTime >= 180) walkAnimationTime = 0; // Loopa efter 180 frames (3 sekunder)
        const walkCycle = Math.floor(walkAnimationTime / 90) % 2; // 90 frames = 1.5 sekunder per sprite
        // INVERTERAT: Börja med sparv_2 först
        currentSprite = walkCycle === 0 ? sparvSprite2 : sparvSprite1;
    } else {
        // Stå still med sprite 1
        currentSprite = sparvSprite1;
        // VIKTIGT: Återställ INTE walkAnimationTime här, det orsakar flimmer!
    }

    // Rita vald sprite om den är laddad, annars fallback
    if (currentSprite.complete && currentSprite.naturalWidth > 0) {
        // Rita sprite med pixelerad stil
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(currentSprite, 0, 0, player.width, player.height);
    } else {
        // Fallback: enkel brun rektangel medan sprite laddar
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, player.width, player.height);
    }

    ctx.restore();

    // STOR DEBUG-INDIKATOR: Visa vilken sprite som används
    if (isWalking) {
        const walkCycle = Math.floor(walkAnimationTime / 90) % 2;

        // Stor färgad ruta
        ctx.fillStyle = walkCycle === 0 ? '#00FF00' : '#FF0000'; // Grön för sparv_2, röd för sparv_1
        ctx.fillRect(player.x - camera.x, player.y - camera.y - 30, 120, 25);

        // Stor text med timer-info
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText((walkCycle === 0 ? 'SPARV_2 ' : 'SPARV_1 ') + '(t=' + walkAnimationTime + ')', player.x - camera.x + 60, player.y - camera.y - 10);
        ctx.textAlign = 'left';
    }

    // Flyg-energimätare gömd (inte längre synlig)
}

// Rita plattformar
function drawPlatforms() {
    platforms.forEach(platform => {
        // Om tiles-bilden är laddad, använd den, annars fallback till färg
        if (tilesImage.complete && tilesImage.naturalWidth > 0) {
            const tileWidth = tilesImage.width; // Hela bildens bredd = en tile
            const tileHeight = 80; // Alltid 80px höga tiles

            // Pixelerad rendering för tiles
            ctx.imageSmoothingEnabled = false;

            // Beräkna faktisk plattformsstorlek baserat på tiles
            const tilesX = Math.round(platform.width / tileWidth);
            const tilesY = Math.ceil(platform.height / tileHeight);
            const actualWidth = tilesX * tileWidth;
            const actualHeight = tilesY * tileHeight;

            // Rita tiles i ett grid
            for (let row = 0; row < tilesY; row++) {
                for (let col = 0; col < tilesX; col++) {
                    const x = platform.x - camera.x + (col * tileWidth);
                    const y = platform.y - camera.y + (row * tileHeight);

                    // Rita hela tiles (ingen klippning)
                    ctx.drawImage(
                        tilesImage,
                        0, 0, tileWidth, tilesImage.height,
                        x, y, tileWidth, tileHeight
                    );
                }
            }

            // Uppdatera plattformens faktiska storlek för korrekt kollision
            platform.actualWidth = actualWidth;
            platform.actualHeight = actualHeight;
        } else {
            // Fallback: färgad rektangel medan tiles laddar
            ctx.fillStyle = platform.color;
            ctx.fillRect(
                platform.x - camera.x,
                platform.y - camera.y,
                platform.width,
                platform.height
            );

            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                platform.x - camera.x,
                platform.y - camera.y,
                platform.width,
                platform.height
            );
        }
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

    // Återställ flyg-energi omedelbart när man landar
    if (player.isGrounded) {
        player.flyEnergy = MAX_FLY_ENERGY;
    }

    // Gravitation
    player.velocityY += GRAVITY;

    // Flygförmåga (bromsar fallet istället för att lyfta)
    if (keys[' '] && player.flyEnergy > 0 && !player.isGrounded && player.velocityY > 0) {
        player.velocityY *= FLY_SLOW_FACTOR; // Bromsa fallet
        player.flyEnergy -= FLY_ENERGY_DRAIN;
        if (player.flyEnergy < 0) player.flyEnergy = 0;
    }

    // Spara gamla position för kollisionskoll
    const oldX = player.x;
    const oldY = player.y;

    // Uppdatera position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Kollision med plattformar
    player.isGrounded = false;
    const playerHitbox = getPlayerHitbox();

    platforms.forEach(platform => {
        // Använd actualWidth och actualHeight om de finns, annars width/height
        const platformWidth = platform.actualWidth || platform.width;
        const platformHeight = platform.actualHeight || platform.height;
        const collisionBox = {
            x: platform.x,
            y: platform.y,
            width: platformWidth,
            height: platformHeight
        };

        if (checkCollision(playerHitbox, collisionBox)) {
            // Beräkna överlappning från olika håll
            const overlapLeft = (playerHitbox.x + playerHitbox.width) - collisionBox.x;
            const overlapRight = (collisionBox.x + collisionBox.width) - playerHitbox.x;
            const overlapTop = (playerHitbox.y + playerHitbox.height) - collisionBox.y;
            const overlapBottom = (collisionBox.y + collisionBox.height) - playerHitbox.y;

            // Hitta minsta överlappningen
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            // Kollidera från ovan (landa på plattform)
            if (minOverlap === overlapTop && player.velocityY >= 0) {
                player.y = collisionBox.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
                player.jumpCount = 0;
            }
            // Kollidera från nedan (slå i huvudet)
            else if (minOverlap === overlapBottom && player.velocityY < 0) {
                player.y = collisionBox.y + collisionBox.height;
                player.velocityY = 0;
            }
            // Kollidera från vänster (går åt höger mot vägg)
            else if (minOverlap === overlapLeft && player.velocityX > 0) {
                player.x = oldX; // Återställ till gamla positionen istället för att justera
                player.velocityX = 0;
            }
            // Kollidera från höger (går åt vänster mot vägg)
            else if (minOverlap === overlapRight && player.velocityX < 0) {
                player.x = oldX; // Återställ till gamla positionen istället för att justera
                player.velocityX = 0;
            }
        }
    });

    // Samla mynt
    coins.forEach(coin => {
        if (!coin.collected && checkCollision(playerHitbox, coin)) {
            coin.collected = true;
            score += 10;
            // Poängräknare borttagen från UI
        }
    });

    // Kollision med hinder
    obstacles.forEach(obstacle => {
        if (checkCollision(playerHitbox, obstacle)) {
            // Reset till start
            player.x = 150;
            player.y = 200;
            player.velocityX = 0;
            player.velocityY = 0;
            score = Math.max(0, score - 20);
            // Poängräknare borttagen från UI
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
