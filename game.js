let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 400;

// --- PHYSICS & STATS ---
const GRAVITY = 0.5;
const FRICTION = 0.88;
const ACCEL = 0.7;

let inventory = [null, null, null];
let selectedSlot = 0;
const keys = {};

const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 60,
    grounded: false, dir: 1, 
    isPunching: 0, health: 100
};

// --- WORLD DATA ---
let platforms = [
    { x: 0, y: 360, w: 1200, h: 40 }, // Ground
    { x: 300, y: 260, w: 200, h: 15 },
    { x: 600, y: 180, w: 200, h: 15 }
];

let items = [
    { x: 350, y: 230, name: "BRICK", color: "#888" },
    { x: 650, y: 150, name: "SCRAP", color: "gold" }
];

let enemies = [
    { x: 700, y: 300, vx: 2, w: 30, h: 60, health: 100, state: "ALIVE" }
];

// --- INPUTS ---
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "1") selectedSlot = 0;
    if (e.key === "2") selectedSlot = 1;
    if (e.key === "3") selectedSlot = 2;
    if (e.key.toLowerCase() === "f") player.isPunching = 10; // Punch frames
    if (e.key.toLowerCase() === "q") dropItem();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function startGame(ch) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
}

function dropItem() {
    if (inventory[selectedSlot]) {
        items.push({ x: player.x + 40, y: player.y, name: inventory[selectedSlot], color: "#888" });
        inventory[selectedSlot] = null;
    }
}

// --- DRAWING HUMANOIDS ---
function drawHumanoid(char, isEnemy) {
    const x = char.x;
    const y = char.y;

    // Legs (Black/Gray Jeans)
    ctx.fillStyle = isEnemy ? "#1a1a1a" : "#2e2e3a";
    ctx.fillRect(x + 5, y + 35, 8, 25); 
    ctx.fillRect(x + 17, y + 35, 8, 25);
    
    // Torso (Black Hoodie)
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x, y + 10, 30, 30);
    
    // Punching Arm
    if (char.isPunching > 0) {
        ctx.fillStyle = "#f3d2b3"; // Skin tone
        let armX = char.dir === 1 ? x + 25 : x - 15;
        ctx.fillRect(armX, y + 20, 20, 8);
    }

    // Head/Hood
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(x + 15, y + 8, 12, 0, Math.PI * 2);
    ctx.fill();
}

// --- CORE ENGINE ---
function update() {
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -12; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.isPunching > 0) player.isPunching--;

    // Combat Collision
    if (player.isPunching === 5) {
        enemies.forEach(en => {
            let dist = Math.abs(player.x - en.x);
            if (dist < 60 && en.state === "ALIVE") {
                en.health -= 50;
                en.vx = player.dir * 10; // Knockback
                if (en.health <= 0) en.state = "DEAD";
            }
        });
    }

    // World Collisions
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

    // Enemy AI
    enemies.forEach(en => {
        if (en.state === "ALIVE") {
            en.x += en.vx;
            if (en.x > 900 || en.x < 100) en.vx *= -1;
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Sky
    ctx.fillStyle = "#050010";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Draw Platforms
    ctx.fillStyle = "#1a1a1a";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Draw Items
    items.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x, item.y, 15, 15);
    });

    // Draw Characters
    drawHumanoid(player, false);
    enemies.forEach(en => {
        if (en.state === "ALIVE") drawHumanoid(en, true);
    });

    // Update Inventory UI
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerText = inventory[i] || "EMPTY";
        slot.className = i === selectedSlot ? "inv-slot active" : "inv-slot";
    }

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function loop() {
    if (gameState === "PLAYING") {
        update();
        draw();
    }
    requestAnimationFrame(loop);
}
loop();
