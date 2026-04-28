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
});
