const egg = document.getElementById('egg');
let isDragging = false;
let spinVelocity = 0;
let rotateX = 0;
let rotateZ = 0;
let posX = window.innerWidth / 2;
let posY = window.innerHeight / 2;
let velX = 0;
let velY = 0;
let lastFrameTime = performance.now();

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let dragOscillator = null;
let dragGainNode = null;

// Create cosmic particles
for (let i = 0; i < 80; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 2 + 1;
    Object.assign(particle.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 4}s`
    });
    document.body.appendChild(particle);
}

function animate() {
    const now = performance.now();
    const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    if (!isDragging) {
        spinVelocity *= 0.95;
        velX *= 0.9;
        velY *= 0.9;
        posX = Math.max(50, Math.min(window.innerWidth - 50, posX + velX));
        posY = Math.max(66, Math.min(window.innerHeight - 66, posY + velY));
        if (Math.abs(spinVelocity) < 0.1) spinVelocity = 0;
        rotateZ += spinVelocity * deltaTime * 60;
    }

    egg.style.left = `${posX}px`;
    egg.style.top = `${posY}px`;
    egg.style.transform = `translate(-50%, -50%) rotateZ(${rotateZ}deg) rotateX(${rotateX}deg)`;
    requestAnimationFrame(animate);
}
animate();

let lastMouseX, lastMouseY, startX, startY, initialPosX, initialPosY;

function playTapSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function startDragSound() {
    if (!dragOscillator) {
        dragOscillator = audioContext.createOscillator();
        dragGainNode = audioContext.createGain();
        dragOscillator.type = 'triangle';
        dragOscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        dragGainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        dragOscillator.connect(dragGainNode);
        dragGainNode.connect(audioContext.destination);
        dragOscillator.start();
    }
}

function adjustDragPitch(velocity) {
    if (dragOscillator) {
        const pitchFactor = Math.max(0.5, Math.min(2, (Math.abs(velocity) / 100) + 0.5));
        dragOscillator.frequency.setValueAtTime(200 * pitchFactor, audioContext.currentTime);
    }
}

function stopDragSound() {
    if (dragOscillator) {
        dragGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        dragOscillator.stop(audioContext.currentTime + 0.1);
        dragOscillator = null;
        dragGainNode = null;
    }
}

function handleStart(x, y) {
    isDragging = true;
    playTapSound();
    startDragSound();
    adjustDragPitch(velX);
    lastMouseX = x;
    lastMouseY = y;
    startX = x;
    startY = y;
    initialPosX = posX;
    initialPosY = posY;
    egg.style.transition = 'none';
    
    // Start vibration if supported
    if (navigator.vibrate) {
        navigator.vibrate([200, 50, 200, 50, 200]);
    }
}

function handleMove(x, y) {
    if (isDragging) {
        const deltaX = x - startX;
        const deltaY = y - startY;
        posX = initialPosX + deltaX;
        posY = initialPosY + deltaY;
        const spinDelta = x - lastMouseX;
        spinVelocity = spinDelta * 0.5;
        rotateZ += spinDelta * 0.3;
        velX = (x - lastMouseX) * 2;
        velY = (y - lastMouseY) * 2;
        adjustDragPitch(velX);
        lastMouseX = x;
        lastMouseY = y;
        
        // Continue vibration while dragging
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    } else {
        const targetX = x - window.innerWidth / 2;
        const targetY = y - window.innerHeight / 2;
        rotateZ = targetX * 0.03;
        rotateX = -targetY * 0.03;
    }
}

function handleEnd() {
    if (isDragging) {
        isDragging = false;
        stopDragSound();
        playTapSound();
        egg.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Stop vibration
        if (navigator.vibrate) {
            navigator.vibrate(0);
        }
    }
}

// Event listeners
egg.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
document.addEventListener('mouseup', handleEnd);

egg.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', handleEnd);

window.addEventListener('resize', () => {
    if (!isDragging) {
        posX = window.innerWidth / 2;
        posY = window.innerHeight / 2;
    }
});
