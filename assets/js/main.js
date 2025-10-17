const slides = document.getElementById('slides');
const dots = document.getElementById('dots');
const n = slides.children.length; let i = 0, hover = false;
function go(k){ i = (k + n) % n; slides.style.transform = `translateX(${-i*100}%)`; [...dots.children].forEach((d, idx) => d.classList.toggle('active', idx === i)); }
function next(){ go(i + 1); }
for (let d = 0; d < n; d++) { const b = document.createElement('button'); b.className = 'dot' + (d === 0 ? ' active' : ''); b.onclick = () => go(d); dots.appendChild(b); }
setInterval(() => { if (!hover) next(); }, 4000);
slides.parentElement.addEventListener('mouseenter', () => hover = true);
slides.parentElement.addEventListener('mouseleave', () => hover = false);
let sx = 0;
slides.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
slides.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { dx < 0 ? next() : go(i - 1); } }, { passive: true });
document.getElementById('y').textContent = new Date().getFullYear();


