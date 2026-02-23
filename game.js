let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 400;

// Constants
const GRAVITY = 0.6;
const FRICTION = 0.85;
const ACCEL = 0.8;

// State
let inventory = [null, null, null];
let selectedSlot = 0;
const keys = {};
let currentChapter = 1;

const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 60,
    grounded: false, dir: 1, health: 3,
    isSliding: false, isDodging: 0, actionFrame: 0, actionType: null
};

let platforms = [
    { x: 0, y: 360, w: 2000, h: 100 }, // Solid Floor
    { x: 300, y: 260, w: 200, h: 20 },
    { x: 600, y: 180, w: 200, h: 20 }
];

// Click to Attack
canvas.addEventListener('mousedown', (e) => {
    if (gameState !== "PLAYING") return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 10;
});

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "1") selectedSlot = 0;
    if (e.key === "2") selectedSlot = 1;
    if (e.key === "3") selectedSlot = 2;
    if (e.key.toLowerCase() === "q") dropItem();
    if (e.key.toLowerCase() === "f") player.isDodging = 15; // Dodge frames
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function startGame(ch) {
    currentChapter = ch;
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
    player.y = 100; // Reset player position on start
}

function dropItem() {
    if (inventory[selectedSlot]) inventory[selectedSlot] = null;
}

function update() {
    // Slide (Shift)
    player.isSliding = keys['shift'] && player.grounded;
    let moveAccel = player.isSliding ? ACCEL * 1.5 : ACCEL;

    if (keys['d']) { player.vx += moveAccel; player.dir = 1; }
    if (keys['a']) { player.vx -= moveAccel; player.dir = -1; }
    if (keys['w'] && player.grounded && !player.isSliding) {
        player.vy = -14;
        player.grounded = false;
    }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Fixed Collision Logic
    player.grounded = false;
    platforms.forEach(p => {
        if (player.vx + player.x < p.x + p.w && player.x + player.w > p.x &&
            player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0;
            player.y = p.y - player.h;
            player.grounded = true;
        }
    });

    if (player.actionFrame > 0) player.actionFrame--;
    if (player.isDodging > 0) player.isDodging--;
}

function drawHumanoid(char) {
    let h = player.isSliding ? 30 : 60;
    let yOffset = player.isSliding ? 30 : 0;

    // Jeans
    ctx.fillStyle = "#4a4a4e"; 
    ctx.fillRect(char.x + 5, char.y + 35 + yOffset, 8, 25 - yOffset); 
    ctx.fillRect(char.x + 17, char.y + 35 + yOffset, 8, 25 - yOffset);
    // Hoodie
    ctx.fillStyle = player.isDodging > 0 ? "rgba(255,255,255,0.5)" : "#000";
    ctx.fillRect(char.x, char.y + 10 + yOffset, 30, 30 - yOffset);
    // Head
    ctx.beginPath();
    ctx.arc(char.x + 15, char.y + 8 + yOffset, 12, 0, Math.PI * 2);
    ctx.fill();

    // Attack Effect
    if (player.actionFrame > 0) {
        ctx.fillStyle = "#f3d2b3";
        let attackX = player.dir === 1 ? char.x + 30 : char.x - 15;
        ctx.fillRect(attackX, char.y + 20 + yOffset, 15, 10);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chapter Backgrounds
    if (currentChapter === 1) ctx.fillStyle = "#87CEEB";
    else if (currentChapter === 2) ctx.fillStyle = "#ff5f6d";
    else ctx.fillStyle = "#050010";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Drawing the City (Simple Sillhouettes)
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(100, 100, 50, 300);
    ctx.fillRect(250, 50, 80, 350);

    ctx.fillStyle = "#111";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    drawHumanoid(player);

    // Update Health
    for(let i=1; i<=3; i++) {
        document.getElementById('h'+i).style.opacity = player.health >= i ? "1" : "0.2";
    }

    // Inventory Slots
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.className = (i === selectedSlot) ? "inv-slot active" : "inv-slot";
    }

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function loop() {
    if (gameState === "PLAYING") { update(); draw(); }
    requestAnimationFrame(loop);
}
loop();
