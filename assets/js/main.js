// main.js — hero slideshow + small card slideshows
(function () {
  'use strict';

  // Hero slideshow
  const slides = document.getElementById('slides');
  const dots = document.getElementById('dots');
  const yearEl = document.getElementById('y');

  if (slides && dots) {
    const slideCount = slides.children.length;
    if (slideCount > 0) {
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
    }
  }

  // Set year immediately if present
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();


// Small card slideshow initializer (for cards like Sikkim & Darjeeling)
(function () {
  'use strict';

  function initCardSlides() {
    const slideshows = document.querySelectorAll('.card-slideshow');
    slideshows.forEach((ss) => {
      const slidesWrap = ss.querySelector('.card-slides');
      const dotsWrap = ss.querySelector('.card-dots');
      const dir = ss.dataset.slideshow; // e.g., 'sikkim_darjeeling'
      if (!slidesWrap || !dotsWrap || !dir) return;

      // Attempt to append slide1..slide8 from the directory
      const extraCount = 8;
      for (let i = 1; i <= extraCount; i++) {
        const imgPathJpeg = `assets/images/${dir}/slide${i}.jpeg`;
        const imgPathJpg = `assets/images/${dir}/slide${i}.jpg`;

        // Create image element and test by preloading (with logging)
        (function (jpegPath, jpgPath) {
          const img = new Image();
          img.onload = () => {
            console.log('[slides] loaded', jpegPath);
            appendSlide(img.src);
          };
          img.onerror = () => {
            console.warn('[slides] failed to load', jpegPath, '- trying', jpgPath);
            const img2 = new Image();
            img2.onload = () => {
              console.log('[slides] loaded (jpg)', jpgPath);
              appendSlide(img2.src);
            };
            img2.onerror = () => console.warn('[slides] failed to load', jpgPath);
            img2.src = jpgPath;
          };
          img.src = jpegPath;
        })(imgPathJpeg, imgPathJpg);
      }

      function appendSlide(src) {
        // prevent duplicates
        if ([...slidesWrap.querySelectorAll('img')].some(i => i.src && i.src.endsWith(src.split('/').pop()))) return;
        const slide = document.createElement('div');
        slide.className = 'card-slide';
        const image = document.createElement('img');
        image.src = src;
        image.alt = '';
        image.loading = 'lazy';
        // detect orientation once loaded
        image.addEventListener('load', () => {
          if (image.naturalHeight > image.naturalWidth) {
            slide.classList.add('portrait');
          }
        });
        slide.appendChild(image);
        slidesWrap.appendChild(slide);
        rebuildDots();
      }

      // check any existing images already in slidesWrap (base images)
      [...slidesWrap.querySelectorAll('img')].forEach((img) => {
        if (img.complete) {
          if (img.naturalHeight > img.naturalWidth) img.closest('.card-slide')?.classList.add('portrait');
        } else {
          img.addEventListener('load', () => {
            if (img.naturalHeight > img.naturalWidth) img.closest('.card-slide')?.classList.add('portrait');
          });
        }
      });

      function rebuildDots() {
        dotsWrap.innerHTML = '';
        const count = slidesWrap.children.length;
        for (let i = 0; i < count; i++) {
          const btn = document.createElement('button');
          if (i === 0) btn.classList.add('active');
          btn.type = 'button';
          btn.addEventListener('click', () => go(i));
          dotsWrap.appendChild(btn);
        }
      }

      let idx = 0;
      let hover = false;

      function go(to) {
        const count = slidesWrap.children.length;
        idx = (to + count) % count;
        slidesWrap.style.transform = `translateX(${-idx * 100}%)`;
        [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === idx));
      }

      function next() { go(idx + 1); }

      let id = setInterval(() => { if (!hover && slidesWrap.children.length > 1) next(); }, 3000);

      ss.addEventListener('mouseenter', () => (hover = true));
      ss.addEventListener('mouseleave', () => (hover = false));

      // initial dots (in case only the base image is present)
      rebuildDots();
    });
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCardSlides);
  else initCardSlides();

})();


// Reviews carousel: fetch JSON and render a responsive slider
(function () {
  'use strict';

  async function initReviews() {
    const container = document.querySelector('.reviews-slider');
    if (!container) return;
    const track = container.querySelector('.reviews-track');
    const dotsWrap = container.querySelector('.reviews-dots');
    if (!track || !dotsWrap) return;

    let data;
    try {
      const res = await fetch('assets/data/reviews.json');
      data = await res.json();
    } catch (err) {
      console.error('Failed to load reviews.json', err);
      return;
    }

    // Render slides
    data.forEach((r) => {
      const slide = document.createElement('div');
      slide.className = 'review-slide';

      const card = document.createElement('div');
      card.className = 'review-card';

      const img = document.createElement('img');
      img.className = 'review-avatar';
      img.src = r.avatar;
      img.alt = r.name;

      const content = document.createElement('div');
      content.className = 'review-content';
  const who = document.createElement('strong');
  // Only append location when present and non-empty
  const loc = (r.location || '').toString().trim();
  who.textContent = loc ? `${r.name} — ${loc}` : r.name;
      const dateEl = document.createElement('div');
      dateEl.className = 'review-date muted';
      // Format date if present (YYYY-MM-DD expected)
      if (r.date) {
        try {
          const d = new Date(r.date);
          const opts = { year: 'numeric', month: 'short', day: 'numeric' };
          dateEl.textContent = d.toLocaleDateString(undefined, opts);
        } catch (e) {
          dateEl.textContent = r.date;
        }
      }

      const p = document.createElement('p');
      p.textContent = r.text;

      content.appendChild(who);
      if (dateEl.textContent) content.appendChild(dateEl);
      content.appendChild(p);

      // Thumbnails grid (optional)
      if (Array.isArray(r.images) && r.images.length > 0) {
        const thumbs = document.createElement('div');
        thumbs.className = 'review-thumbs';
          r.images.forEach((src, i) => {
            const t = document.createElement('button');
            t.type = 'button';
            t.className = 'review-thumb';
            const im = document.createElement('img');
            im.src = src;
            im.alt = `${r.name} photo ${i + 1}`;
            t.appendChild(im);
            // open lightbox with the full images array and starting index
            t.addEventListener('click', () => openLightbox(r.images, i));
            thumbs.appendChild(t);
          });
        content.appendChild(thumbs);
      }
      card.appendChild(img);
      card.appendChild(content);
      slide.appendChild(card);
      track.appendChild(slide);
    });

    // Build dots and interactions
    const slides = [...track.children];
    let idx = 0;
    let hover = false;

    function rebuildDots() {
      dotsWrap.innerHTML = '';
      for (let i = 0; i < slides.length; i++) {
        const btn = document.createElement('button');
        if (i === 0) btn.classList.add('active');
        btn.type = 'button';
        btn.addEventListener('click', () => go(i));
        dotsWrap.appendChild(btn);
      }
    }

    function go(to) {
      const count = slides.length;
      idx = (to + count) % count;
      // compute per-view offset: on wide screens two per view
      const perView = window.innerWidth >= 700 ? 2 : 1;
      const offset = Math.floor(idx / perView) * perView;
      track.style.transform = `translateX(${-(offset / perView) * 100}%)`;
      [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === Math.floor(idx / perView)));
    }

    function next() { go(idx + 1); }

    rebuildDots();

    let autoId = setInterval(() => { if (!hover) next(); }, 3500);

    container.addEventListener('mouseenter', () => (hover = true));
    container.addEventListener('mouseleave', () => (hover = false));

    // Keyboard support
    container.tabIndex = 0;
    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') go(idx - 1);
    });

    // Recompute current position on resize (keeps dots correct)
    window.addEventListener('resize', () => go(idx));

    // cleanup on unload
    window.addEventListener('beforeunload', () => clearInterval(autoId));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReviews);
  else initReviews();

})();

// Lightbox helper (global scope for simplicity)
let _lbState = { imgs: [], idx: 0 };

function openLightbox(imgs, startIndex = 0) {
  _lbState.imgs = Array.isArray(imgs) ? imgs : [imgs];
  _lbState.idx = startIndex || 0;

  // remember previous active element so we can restore focus when closing
  _lbState.previousActive = document.activeElement;

  let lb = document.getElementById('simple-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'simple-lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop" tabindex="-1">
        <button class="lb-close" aria-label="Close">×</button>
        <button class="lb-prev" aria-label="Previous">‹</button>
        <div class="lb-content"><img src="" alt=""></div>
        <div class="lb-counter" aria-live="polite"></div>
        <button class="lb-next" aria-label="Next">›</button>
      </div>`;
    document.body.appendChild(lb);
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', prevLightbox);
    lb.querySelector('.lb-next').addEventListener('click', nextLightbox);
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-backdrop')) closeLightbox(); });
    // keyboard handlers for navigation and close
    lb._kbdHandler = function (e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    };
    document.addEventListener('keydown', lb._kbdHandler);

    // focus trap keydown handler (cycles focus within lightbox)
    lb._trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusable = Array.from(lb.querySelectorAll(selector)).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const idx = focusable.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (idx === 0 || document.activeElement === lb) {
          focusable[focusable.length - 1].focus();
          e.preventDefault();
        }
      } else {
        if (idx === focusable.length - 1) {
          focusable[0].focus();
          e.preventDefault();
        }
      }
    };
    lb.addEventListener('keydown', lb._trapHandler);
  }
  updateLightboxImage();
  lb.style.display = 'block';
  document.body.style.overflow = 'hidden';
  // focus the close button to begin
  const closeBtn = lb.querySelector('.lb-close');
  if (closeBtn) closeBtn.focus();
}

function updateLightboxImage() {
  const lb = document.getElementById('simple-lightbox');
  if (!lb) return;
  const img = lb.querySelector('.lb-content img');
  const src = _lbState.imgs[_lbState.idx];
  img.src = src || '';
  // update aria-hidden of prev/next when single image
  const prev = lb.querySelector('.lb-prev');
  const next = lb.querySelector('.lb-next');
  if (prev && next) {
    if (_lbState.imgs.length <= 1) { prev.style.display = 'none'; next.style.display = 'none'; }
    else { prev.style.display = ''; next.style.display = ''; }
  }
  // update counter
  const counter = lb.querySelector('.lb-counter');
  if (counter) counter.textContent = _lbState.imgs.length > 0 ? `${_lbState.idx + 1} / ${_lbState.imgs.length}` : '';
}

function closeLightbox() {
  const lb = document.getElementById('simple-lightbox');
  if (!lb) return;
  lb.style.display = 'none';
  const img = lb.querySelector('.lb-content img');
  img.src = '';
  document.body.style.overflow = '';
  _lbState.imgs = [];
  _lbState.idx = 0;
  // remove keyboard handlers if present
  if (lb._kbdHandler) document.removeEventListener('keydown', lb._kbdHandler);
  if (lb._trapHandler) lb.removeEventListener('keydown', lb._trapHandler);
  // restore focus to previously focused element
  try { if (_lbState.previousActive && typeof _lbState.previousActive.focus === 'function') _lbState.previousActive.focus(); } catch (e) {}
  _lbState.previousActive = null;
}

function prevLightbox() {
  if (!_lbState.imgs.length) return;
  _lbState.idx = (_lbState.idx - 1 + _lbState.imgs.length) % _lbState.imgs.length;
  updateLightboxImage();
}

function nextLightbox() {
  if (!_lbState.imgs.length) return;
  _lbState.idx = (_lbState.idx + 1) % _lbState.imgs.length;
  updateLightboxImage();
}


