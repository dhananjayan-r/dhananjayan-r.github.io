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


// ── CAREER INDEX (live-calculated, calendar-accurate) ──
function diffYMD(start, end) {
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
        months--;
        const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        days += prevMonthLastDay;
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return { years, months, days };
}

function fmtYMD({ years, months, days }) {
    const parts = [];
    if (years) parts.push(`${years}y`);
    if (months || years) parts.push(`${months}m`);
    parts.push(`${days}d`);
    return parts.join(' ');
}

(function renderCareerIndex() {
    const now = new Date();

    const careerStart = new Date(2019, 8, 16);   // Sutherland - Sep 16, 2019
    const engStart     = new Date(2021, 0, 1);    // Genome internship - Jan 1, 2021 (post career-gap, start of technical career)

    const spanEl  = document.getElementById('idx-total-span');
    const engEl   = document.getElementById('idx-eng-exp');
    const daysEl  = document.getElementById('idx-total-days');
    const hoursEl = document.getElementById('idx-total-hours');
    if (!spanEl && !engEl && !daysEl && !hoursEl) return;

    if (spanEl) spanEl.textContent = fmtYMD(diffYMD(careerStart, now));
    if (engEl)  engEl.textContent  = fmtYMD(diffYMD(engStart, now));

    const msPerDay = 1000 * 60 * 60 * 24;
    const sumDays = (periods) => {
        let total = 0;
        periods.forEach(([start, end]) => {
            const periodEnd = end || now;
            if (start <= now) {
                total += Math.max(0, Math.round((Math.min(periodEnd, now) - start) / msPerDay));
            }
        });
        return total;
    };

    // All roles, including the pre-technical Sutherland stint
    const allPeriods = [
        [new Date(2019, 8, 16),  new Date(2020, 0, 4)],   // Sutherland
        [new Date(2021, 0, 1),   new Date(2021, 5, 1)],   // Genome intern
        [new Date(2021, 5, 1),   new Date(2023, 0, 31)],  // Genome full-time
        [new Date(2023, 1, 1),   new Date(2025, 1, 21)],  // TNQ
        [new Date(2025, 2, 26),  new Date(2026, 8, 21)],  // EdgeVerve
        [new Date(2026, 8, 23),  null],                   // Droidal (ongoing)
    ];
    if (daysEl) daysEl.textContent = `${sumDays(allPeriods).toLocaleString()} days`;

    // Technical career only - post career-gap (excludes Sutherland)
    if (hoursEl) {
        const techPeriods = allPeriods.slice(1); // drop Sutherland
        const techDays = sumDays(techPeriods);
        const techHours = techDays * 8;
        hoursEl.textContent = `${techHours.toLocaleString()} hrs`;
    }
})();




// ── CAREER TRACK (hoverable 2D timeline) ──
(function buildCareerTrack() {
    const segmentsEl = document.getElementById('trackSegments');
    const markersEl  = document.getElementById('trackMarkers');
    const tooltipEl  = document.getElementById('trackTooltip');
    if (!segmentsEl || !markersEl || !tooltipEl) return;

    const ttCompany = document.getElementById('ttCompany');
    const ttRole    = document.getElementById('ttRole');
    const ttPeriod  = document.getElementById('ttPeriod');

    const events = [
        { type: 'job', company: 'Sutherland Global Services', role: 'Associate - CS Internet',
          start: new Date(2019, 8, 16), end: new Date(2020, 0, 4) },
        { type: 'gap', company: 'Career Gap', role: 'Job search / transition into software',
          start: new Date(2020, 0, 4), end: new Date(2021, 0, 1) },
        { type: 'job', company: 'Genome International', role: 'Intern → Junior Software Programmer',
          start: new Date(2021, 0, 1), end: new Date(2023, 0, 31) },
        { type: 'job', company: 'TNQ Technologies', role: 'Software Engineer',
          start: new Date(2023, 1, 1), end: new Date(2025, 1, 21) },
        { type: 'job', company: 'EdgeVerve · Infosys', role: 'Member of Technical Staff - Product Engineering',
          start: new Date(2025, 2, 26), end: new Date(2026, 8, 21) },
        { type: 'job', company: 'Droidal', role: 'Staff Engineer',
          start: new Date(2026, 8, 23), end: null, current: true },
    ];

    const now = new Date();
    const overallStart = events[0].start;
    const overallEnd = now;
    const totalMs = overallEnd - overallStart;

    const pct = (date) => {
        if (totalMs <= 0) return 0;
        return Math.min(100, Math.max(0, ((date - overallStart) / totalMs) * 100));
    };

    const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const fmtPeriod = (ev) => `${fmtDate(ev.start)} – ${ev.end ? fmtDate(ev.end) : 'Present'}`;

    const defaultTip = {
        company: ttCompany ? ttCompany.textContent : '',
        role: ttRole ? ttRole.textContent : '',
        period: ttPeriod ? ttPeriod.textContent : '',
    };

    function showTip(ev) {
        if (!ttCompany || !ttRole || !ttPeriod) return;
        ttCompany.textContent = ev.company;
        ttRole.textContent = ev.role;
        ttPeriod.textContent = fmtPeriod(ev);
    }

    function resetTip() {
        if (!ttCompany || !ttRole || !ttPeriod) return;
        ttCompany.textContent = defaultTip.company;
        ttRole.textContent = defaultTip.role;
        ttPeriod.textContent = defaultTip.period;
    }

    events.forEach((ev) => {
        const startPct = pct(ev.start);
        const endPct = pct(ev.end || now);
        const width = Math.max(0, endPct - startPct);

        if (width > 0) {
            const seg = document.createElement('div');
            seg.className = `track-segment ${ev.type}`;
            seg.style.left = `${startPct}%`;
            seg.style.width = `${width}%`;
            segmentsEl.appendChild(seg);
        }

        const marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'track-marker' + (ev.type === 'gap' ? ' gap-marker' : '') + (ev.current ? ' current' : '');
        marker.style.left = `${startPct}%`;
        marker.setAttribute('aria-label', `${ev.company} – ${fmtPeriod(ev)}`);

        marker.addEventListener('mouseenter', () => showTip(ev));
        marker.addEventListener('focus', () => showTip(ev));
        marker.addEventListener('click', () => showTip(ev));
        marker.addEventListener('mouseleave', resetTip);
        marker.addEventListener('blur', resetTip);

        markersEl.appendChild(marker);
    });

    // ── Runner: loops across the track, label follows showing company/role/~date ──
    const runnerEl = document.getElementById('trackRunner');
    const labelEl  = document.getElementById('trackRunnerLabel');
    const trlCompany = document.getElementById('trlCompany');
    const trlMeta     = document.getElementById('trlMeta');

    if (runnerEl && labelEl && trlCompany && trlMeta) {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion && totalMs > 0) {
            const LOOP_MS = 14000;
            const fmtMonthYear = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            const eventAt = (date) => {
                for (const ev of events) {
                    const end = ev.end || now;
                    if (date >= ev.start && date <= end) return ev;
                }
                return events[events.length - 1];
            };

            let lastLabelKey = '';

            function frame(timestamp) {
                const loopPct = (timestamp % LOOP_MS) / LOOP_MS * 100;
                runnerEl.style.left = `${loopPct}%`;

                const atDate = new Date(overallStart.getTime() + (loopPct / 100) * totalMs);
                const ev = eventAt(atDate);
                const monthYear = fmtMonthYear(atDate);
                const key = `${ev.company}|${monthYear}`;

                if (key !== lastLabelKey) {
                    trlCompany.textContent = ev.company;
                    trlMeta.textContent = `${ev.role} · ~${monthYear}`;
                    lastLabelKey = key;
                }

                // Clamp label anchor so it doesn't spill past the track edges
                let anchor = 'center';
                if (loopPct < 12) anchor = 'left';
                else if (loopPct > 88) anchor = 'right';
                labelEl.style.left = `${loopPct}%`;
                labelEl.style.transform =
                    anchor === 'left' ? 'translateX(0)' :
                    anchor === 'right' ? 'translateX(-100%)' :
                    'translateX(-50%)';

                requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        } else {
            runnerEl.style.display = 'none';
            labelEl.style.display = 'none';
        }
    }
})();
