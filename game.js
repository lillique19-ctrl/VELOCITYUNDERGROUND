let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 400;

// Physics
const GRAVITY = 0.5;
const FRICTION = 0.88;
const ACCEL = 0.7;

// Inventory State
let inventory = [null, null, null];
let selectedSlot = 0;
const keys = {};

const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 60,
    grounded: false, dir: 1
};

// Platforms - Added a huge ground to prevent falling through
let platforms = [
    { x: 0, y: 350, w: 2000, h: 50 }, 
    { x: 300, y: 250, w: 200, h: 15 },
    { x: 600, y: 180, w: 200, h: 15 }
];

let items = [
    { x: 350, y: 220, name: "BRICK", color: "#888" },
    { x: 650, y: 150, name: "SCRAP", color: "gold" }
];

// Start Game Function
function startGame(ch) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
}

// Controls
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "1") selectedSlot = 0;
    if (e.key === "2") selectedSlot = 1;
    if (e.key === "3") selectedSlot = 2;
    if (e.key.toLowerCase() === "q") dropItem();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function dropItem() {
    if (inventory[selectedSlot]) {
        items.push({ x: player.x + (player.dir * 40), y: player.y, name: inventory[selectedSlot], color: "#888" });
        inventory[selectedSlot] = null;
    }
}

// DRAWING THE HUMANOID (Hoodie and Jeans)
function drawHumanoid(char, isPlayer) {
    // Legs (Light Black/Gray Jeans)
    ctx.fillStyle = "#4a4a4e"; 
    ctx.fillRect(char.x + 5, char.y + 35, 8, 25); 
    ctx.fillRect(char.x + 17, char.y + 35, 8, 25);
    
    // Torso (Black Hoodie)
    ctx.fillStyle = "#000000";
    ctx.fillRect(char.x, char.y + 10, 30, 30);
    
    // Hood/Head
    ctx.beginPath();
    ctx.arc(char.x + 15, char.y + 8, 12, 0, Math.PI * 2);
    ctx.fill();
}

function update() {
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -12; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Platform Collisions
    player.grounded = false;
    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.w > p.x &&
            player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0;
            player.y = p.y - player.h;
            player.grounded = true;
        }
    });

    // Item Pickup
    items.forEach((item, i) => {
        if (Math.abs(player.x - item.x) < 30 && Math.abs(player.y - item.y) < 40) {
            for (let s = 0; s < 3; s++) {
                if (!inventory[s]) {
                    inventory[s] = item.name;
                    items.splice(i, 1);
                    break;
                }
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = "#0a0015";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Platforms
    ctx.fillStyle = "#111";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Items
    items.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x, item.y, 15, 15);
    });

    // Draw Player
    drawHumanoid(player, true);

    // Update Inventory UI
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if(slot) {
            slot.innerText = inventory[i] || "EMPTY";
            slot.className = (i === selectedSlot) ? "inv-slot active" : "inv-slot";
        }
    }
}

function loop() {
    if (gameState === "PLAYING") {
        update();
        draw();
    }
    requestAnimationFrame(loop);
}
loop();
