let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

const GRAVITY = 0.6;
const FRICTION = 0.85;
const ACCEL = 0.8;

let inventory = [null, null, null];
let selectedSlot = 0;
let combo = 0;
let comboTimer = 0;
let animTimer = 0;
let currentChapter = 1;
let damageNumbers = []; // Floating numbers array

const keys = {};
const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 60,
    grounded: false, dir: 1, health: 3,
    isSliding: false, isDodging: 0, actionFrame: 0, actionType: null
};

let platforms = [
    { x: -500, y: 360, w: 5000, h: 200 }, // Floor
    { x: 300, y: 240, w: 200, h: 20 },
    { x: 600, y: 160, w: 200, h: 20 }
];

// CLICK TO PUNCH/KICK
canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 15;
    
    // Trigger a fake hit for the combo/damage demo
    spawnDamageNumber(player.x + (player.dir * 40), player.y, "-50");
    updateCombo();
});

function spawnDamageNumber(x, y, text) {
    damageNumbers.push({ x, y, text, life: 30 });
}

function updateCombo() {
    combo++;
    comboTimer = 120;
    const ui = document.getElementById('combo-ui');
    ui.style.display = 'block';
    ui.classList.add('combo-pop');
    document.getElementById('combo-count').innerText = combo;
    setTimeout(() => ui.classList.remove('combo-pop'), 200);
}

function startGame(ch) {
    currentChapter = ch;
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
    player.y = 100; player.vx = 0;
}

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "1") selectedSlot = 0;
    if (e.key === "2") selectedSlot = 1;
    if (e.key === "3") selectedSlot = 2;
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function update() {
    animTimer += 0.15;
    if (comboTimer > 0) comboTimer--;
    else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    player.isSliding = keys['shift'] && player.grounded;
    let mAccel = player.isSliding ? ACCEL * 1.3 : ACCEL;

    if (keys['d']) { player.vx += mAccel; player.dir = 1; }
    if (keys['a']) { player.vx -= mAccel; player.dir = -1; }
    if (keys['w'] && player.grounded && !player.isSliding) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;

    // SOLID COLLISION PHYSICS
    player.grounded = false;
    platforms.forEach(p => {
        if (player.x + player.w > p.x && player.x < p.x + p.w) {
            if (player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
                player.vy = 0; player.y = p.y - player.h; player.grounded = true;
            }
        }
    });

    player.y += player.vy;
    player.x += player.vx;

    if (player.actionFrame > 0) player.actionFrame--;
    damageNumbers.forEach((n, i) => { n.y -= 1; n.life--; if(n.life <= 0) damageNumbers.splice(i,1); });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Backgrounds
    if (currentChapter === 1) ctx.fillStyle = "#87CEEB";
    else if (currentChapter === 2) ctx.fillStyle = "#ff5f6d";
    else ctx.fillStyle = "#050010";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    ctx.fillStyle = "#111";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // ANIMATED PLAYER
    const isMoving = Math.abs(player.vx) > 0.5;
    const breathe = (!isMoving && player.grounded) ? Math.sin(animTimer) * 2 : 0;
    const yOff = player.isSliding ? 30 : 0;

    // Jeans
    ctx.fillStyle = "#4a4a4e";
    if (player.isSliding) {
        ctx.fillRect(player.x + (player.dir * 15), player.y + 45, 20, 10);
    } else {
        let legWalk = isMoving ? Math.sin(animTimer * 2) * 10 : 0;
        ctx.fillRect(player.x + 5 + legWalk, player.y + 35, 8, 25);
        ctx.fillRect(player.x + 17 - legWalk, player.y + 35, 8, 25);
    }

    // Hoodie
    ctx.fillStyle = "#000";
    ctx.fillRect(player.x, player.y + 10 + yOff - breathe, 30, (player.isSliding ? 20 : 30) + breathe);
    
    // Head
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 8 + yOff - breathe, 12, 0, Math.PI * 2);
    ctx.fill();

    // Fight Layer
    if (player.actionFrame > 0) {
        ctx.fillStyle = "#f3d2b3";
        let attX = player.dir === 1 ? player.x + 28 : player.x - 15;
        if (player.actionType === "PUNCH") ctx.fillRect(attX, player.y + 18 + yOff, 18, 8);
        else ctx.fillRect(attX, player.y + 35 + yOff, 20, 10);
    }

    // Damage Numbers
    damageNumbers.forEach(n => {
        ctx.fillStyle = "white"; ctx.font = "bold 16px monospace";
        ctx.fillText(n.text, n.x, n.y);
    });

    // Health UI
    for(let i=1; i<=3; i++) document.getElementById('h'+i).style.opacity = player.health >= i ? "1" : "0.2";
    
    // Inv Slots
    for (let i = 0; i < 3; i++) document.getElementById(`slot-${i}`).className = (i === selectedSlot) ? "inv-slot active" : "inv-slot";

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function loop() { if (gameState === "PLAYING") { update(); draw(); } requestAnimationFrame(loop); }
loop();
