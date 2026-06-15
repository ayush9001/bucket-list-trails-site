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


