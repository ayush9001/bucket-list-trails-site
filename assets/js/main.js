(function () {
  'use strict';

  const slides = document.getElementById('slides');
  const dots = document.getElementById('dots');
  const yearEl = document.getElementById('y');

  if (!slides || !dots) {
    // Required elements not present — nothing to do.
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    return;
  }

  const slideCount = slides.children.length;
  if (slideCount === 0) return;

  let index = 0;
  let hover = false;

  function go(to) {
    index = (to + slideCount) % slideCount;
    slides.style.transform = `translateX(${-index * 100}%)`;
    [...dots.children].forEach((d, idx) => d.classList.toggle('active', idx === index));
  }

  function next() { go(index + 1); }

  // Create controls
  for (let d = 0; d < slideCount; d++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dot' + (d === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Slide ${d + 1} of ${slideCount}`);
    btn.addEventListener('click', () => go(d));
    dots.appendChild(btn);
  }

  // Autoplay
  const autoplayIntervalMs = 4000;
  const autoplayId = setInterval(() => { if (!hover) next(); }, autoplayIntervalMs);

  // Pause on hover
  const sliderEl = slides.parentElement;
  sliderEl.addEventListener('mouseenter', () => (hover = true));
  sliderEl.addEventListener('mouseleave', () => (hover = false));

  // Touch gestures
  let startX = 0;
  slides.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  slides.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? next() : go(index - 1);
    }
  }, { passive: true });

  // Keyboard support
  sliderEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') go(index - 1);
  });

  // Clean up on unload
  window.addEventListener('beforeunload', () => clearInterval(autoplayId));

  // Set year
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


