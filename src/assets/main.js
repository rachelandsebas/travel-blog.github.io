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
});
