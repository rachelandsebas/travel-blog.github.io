document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('burger-menu-btn');
  const menu = document.getElementById('burger-menu');
  const overlay = document.getElementById('burger-menu-overlay');
  const closeBtn = document.getElementById('burger-menu-close');

  function openMenu() {
    if (menu) menu.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }

  function closeMenu() {
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  if (btn) btn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Timeline Scrolling
  const timelineContainer = document.getElementById('timeline-container');
  const prevBtn = document.getElementById('timeline-prev');
  const nextBtn = document.getElementById('timeline-next');

  if (timelineContainer) {
    // Wait a brief moment to ensure layout is complete, then scroll to the end
    setTimeout(() => {
      timelineContainer.scrollLeft = timelineContainer.scrollWidth;
    }, 100);

    let scrollInterval;

    function startScrolling(direction) {
      // Clear any existing interval
      stopScrolling();
      scrollInterval = setInterval(() => {
        timelineContainer.scrollBy({ left: direction * 15, behavior: 'auto' });
      }, 16); // roughly 60fps
    }

    function stopScrolling() {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('mouseenter', () => startScrolling(-1));
      prevBtn.addEventListener('mouseleave', stopScrolling);
      prevBtn.addEventListener('mouseup', stopScrolling);
      prevBtn.addEventListener('touchend', stopScrolling);

      // Fallback click for mobile or quick taps
      prevBtn.addEventListener('click', () => {
        timelineContainer.scrollBy({ left: -300, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('mouseenter', () => startScrolling(1));
      nextBtn.addEventListener('mouseleave', stopScrolling);
      nextBtn.addEventListener('mouseup', stopScrolling);
      nextBtn.addEventListener('touchend', stopScrolling);

      // Fallback click for mobile or quick taps
      nextBtn.addEventListener('click', () => {
        timelineContainer.scrollBy({ left: 300, behavior: 'smooth' });
      });
    }
  }

  // Lightbox Logic
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCaption = document.getElementById('lightbox-caption');

  if (lightbox) {
    let currentGallery = [];
    let currentIndex = 0;

    const allImages = document.querySelectorAll('.post-content img');

    allImages.forEach(img => {
      img.addEventListener('click', () => {
        const carousel = img.closest('.carousel');
        if (carousel) {
          // If in carousel, gallery is all images in that carousel
          currentGallery = Array.from(carousel.querySelectorAll('img'));
        } else {
          // If not in carousel, gallery is just this one image (or all non-carousel images?)
          // Let's assume standalone images are their own single-item galleries for now
          currentGallery = [img];
        }

        currentIndex = currentGallery.indexOf(img);
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      });
    });

    function updateLightbox() {
      const img = currentGallery[currentIndex];
      lightboxImg.src = img.src;
      lightboxCaption.textContent = img.alt || "";
      
      // Show/hide nav buttons based on gallery size
      if (currentGallery.length > 1) {
        lightboxPrev.style.display = 'block';
        lightboxNext.style.display = 'block';
      } else {
        lightboxPrev.style.display = 'none';
        lightboxNext.style.display = 'none';
      }
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % currentGallery.length;
      updateLightbox();
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
      updateLightbox();
    }

    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    });

    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      showPrev();
    });

    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showNext();
    });

    // Close on click outside
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-container')) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      
      if (e.key === 'Escape') {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
      } else if (e.key === 'ArrowRight' && currentGallery.length > 1) {
        showNext();
      } else if (e.key === 'ArrowLeft' && currentGallery.length > 1) {
        showPrev();
      }
    });
  }
});
