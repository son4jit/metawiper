const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d", { alpha: true });

let w, h;
let particles = [];
const particleBaseCount = window.innerWidth < 768 ? 30 : 60;
let animationId;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    init();
}

function init() {
    particles = [];
    for (let i = 0; i < particleBaseCount; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.5 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            color: `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1})`
        });
    }
}

let lastTimestamp = 0;
const targetFPS = 60;
const frameDuration = 1000 / targetFPS;

function draw(timestamp) {
    if (timestamp - lastTimestamp < frameDuration) {
        animationId = requestAnimationFrame(draw);
        return;
    }
    lastTimestamp = timestamp;

    ctx.clearRect(0, 0, w, h);

    // Batch draw particles with same characteristics if possible (simplified here)
    for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
    }

    animationId = requestAnimationFrame(draw);
}

// Check for reduced motion preference
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function handleMotion(e) {
    if (e.matches) {
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, w, h);
    } else {
        animationId = requestAnimationFrame(draw);
    }
}

motionQuery.addEventListener("change", handleMotion);

// Initialize
window.addEventListener("resize", () => {
    cancelAnimationFrame(animationId);
    resize();
    if (!motionQuery.matches) animationId = requestAnimationFrame(draw);
});

resize();
if (!motionQuery.matches) {
    animationId = requestAnimationFrame(draw);
}
