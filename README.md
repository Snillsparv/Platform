# 🐦 Sparv Plattformsspel

Ett plattformsspel i Super Mario Bros-stil med en sparv som huvudperson!

## Funktioner

- **Sparv som huvudperson** med pixel-art design
- **Flygförmåga** med begränsad energi som laddas på marken
- **Dubbelhoppning** för extra rörlighet
- **Mynt att samla** för poäng
- **Hinder och taggar** att undvika
- **Kamerasystem** som följer spelaren
- **Flera plattformar** med varierande höjd

## Kontroller

- **← →** Vänster/Höger piltangent - Rörelse
- **Mellanslag** - Hoppa (tryck igen i luften för dubbelhoppning)
- **Håll Mellanslag** - Flyg (begränsad energi)

## Hur man spelar

1. Öppna `index.html` i en webbläsare
2. Använd piltangenterna för att röra dig
3. Samla mynt för att få poäng
4. Undvik röda taggar (de återställer dig till start)
5. Använd flygförmågan strategiskt - den laddas bara när du står på marken!

## Sprite-information

### Nuvarande sprites (procedurellt genererade)

Spelet använder för närvarande procedurellt genererade sprites ritade direkt på canvas. Detta är perfekt för prototyping!

### Om du vill använda egna sprite-bilder

**Rekommenderade storlekar:**

- **32x32 pixlar** - Nuvarande spelstorlek, perfekt balans
- **48x48 pixlar** - Om du vill ha mer detaljer
- **16x16 pixlar** - För retro-känsla

**Hur man skapar sprites:**

1. **Online verktyg (gratis):**
   - [Pixilart](https://www.pixilart.com/) - Enkel och kraftfull
   - [Piskel](https://www.piskelapp.com/) - Bra för animationer
   - [Lospec Pixel Editor](https://lospec.com/pixel-editor/)

2. **Desktop-program:**
   - **Aseprite** (~20 USD) - Branschstandard för pixel art
   - **GIMP** (gratis) - Med pixel grid
   - **GraphicsGale** (gratis)

3. **AI-generering + pixelifiering:**
   - Generera med DALL-E, Midjourney eller Stable Diffusion
   - Konvertera till pixel art med verktyg som [Pixel It](https://giventofly.github.io/pixelit/)

### Sprites som behövs

För att göra spelet komplett med riktiga bilder behöver du:

1. **Sparv (player):**
   - Stillastående (1 frame)
   - Gång (2-4 frames)
   - Hopp (1-2 frames)
   - Flygning (2-4 frames med vingar uppe/nere)

2. **Mynt:**
   - Rotation (4-8 frames för mjuk animation)

3. **Plattformar:**
   - Gräs/trä textur (kan vara tileable)

4. **Hinder:**
   - Taggar eller andra faror

### Hur man integrerar egna sprites

I `game.js`, ersätt funktionen `drawPlayer()` med bildladdning:

```javascript
// Lägg till i början av filen
const playerImage = new Image();
playerImage.src = 'sprites/sparrow.png';

// I drawPlayer() funktionen
function drawPlayer() {
    ctx.drawImage(
        playerImage,
        player.x - camera.x,
        player.y - camera.y,
        player.width,
        player.height
    );
}
```

## Teknisk information

- **Teknologi:** HTML5 Canvas + Vanilla JavaScript
- **Fysik:** Anpassad gravitationsmotor
- **Kollision:** AABB (Axis-Aligned Bounding Box)
- **Animation:** RequestAnimationFrame loop

## Utökningsmöjligheter

- Lägg till fler nivåer
- Fiender att besegra
- Power-ups (mer flyg-energi, hastighetsökning)
- Ljudeffekter och musik
- Highscore-system med localStorage
- Olika fågelkaraktärer att välja mellan
- Vädereffekter (regn, vind)
- Parallax scrolling bakgrund

## Licens

Fri att använda och modifiera!
