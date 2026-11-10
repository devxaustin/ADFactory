// Global CRT behavior, loaded on every page by Base.astro:
// the power-on animation and the fullscreen button.

const root = document.documentElement;
const monitor = document.getElementById('monitor');

// Power-on: the animation is started by the .boot class set in <head>.
if (root.classList.contains('boot') && monitor) {
  const done = () => {
    root.classList.remove('boot');
    try {
      sessionStorage.setItem('adf-booted', '1');
    } catch {}
  };
  monitor.addEventListener('animationend', (e) => {
    if (e.target === monitor && e.animationName === 'power-on') done();
  });
  setTimeout(done, 1600);
}

// Fullscreen (hidden where the browser can't do it, like iPhone Safari)
const fs = document.querySelector<HTMLButtonElement>('[data-fullscreen]');
if (fs && document.fullscreenEnabled) {
  fs.hidden = false;
  fs.addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen();
  });
}
