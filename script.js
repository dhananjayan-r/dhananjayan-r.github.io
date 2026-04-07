// ── PARTICLE BACKGROUND ──
(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let W, H;
    const COUNT = 240;
    let mouse = { x: -9999, y: -9999 };
    const REPEL_RADIUS = 120;
    const REPEL_FORCE  = 3.2;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeParticle() {
        return {
            x:    Math.random() * W,
            y:    Math.random() * H,
            ox:   0, oy: 0,   // will be set after placement
            vx:   (Math.random() - 0.5) * 0.4,
            vy:   (Math.random() - 0.5) * 0.4,
            r:    Math.random() * 2 + 0.6,
            alpha: Math.random() * 0.4 + 0.12,
        };
    }

    let particles = [];

    function init() {
        resize();
        particles = Array.from({ length: COUNT }, () => {
            const p = makeParticle();
            p.ox = p.x; p.oy = p.y;
            return p;
        });
    }

    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', resize);

    function draw() {
        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Mouse repel
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPEL_RADIUS && dist > 0) {
                const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            // Gentle drift back toward origin
            p.vx += (p.ox - p.x) * 0.012;
            p.vy += (p.oy - p.y) * 0.012;

            // Damping
            p.vx *= 0.88;
            p.vy *= 0.88;

            p.x += p.vx;
            p.y += p.vy;

            // Connecting lines
            for (let j = i + 1; j < particles.length; j++) {
                const q  = particles[j];
                const ex = p.x - q.x, ey = p.y - q.y;
                const d  = Math.sqrt(ex * ex + ey * ey);
                if (d < 140) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(0,113,227,${0.10 * (1 - d / 140)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // Dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(29,29,31,${p.alpha})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    init();
    draw();
})();


// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});


// ── NAVBAR SCROLL ──
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 40
        ? 'rgba(255,255,255,0.96)'
        : 'rgba(255,255,255,0.82)';
});


// ── SCROLL REVEAL ──
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 90);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.timeline-item, .project-card, .skill-block').forEach(el => {
    revealObserver.observe(el);
});


// ── COUNTER ANIMATION ──
function animateCounter(el, target, duration) {
    const isFloat = String(target).includes('.');
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const val = target * ease;
        el.textContent = isFloat ? val.toFixed(1) : Math.round(val).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = isFloat ? target : target.toLocaleString();
    }
    requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.stat-num[data-target]').forEach(el => {
                animateCounter(el, parseFloat(el.dataset.target), 1400);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const statsRow = document.querySelector('.stats-row');
if (statsRow) statsObserver.observe(statsRow);




// ── GALLERY TOGGLE ──
function toggleGallery(btn) {
    const isExpanded = btn.textContent === 'See Less';
    document.querySelectorAll('.tile.hidden, .tile').forEach(t => {
        if (isExpanded) {
            if (!t.classList.contains('hidden')) return;
            t.style.display = 'none';
        } else {
            t.style.display = '';
            t.classList.remove('hidden');
        }
    });
    if (isExpanded) {
        document.querySelectorAll('.tile').forEach((t, i) => {
            if (i >= 3) { t.style.display = 'none'; t.classList.add('hidden'); }
        });
    }
    btn.textContent = isExpanded ? 'See More' : 'See Less';
}
