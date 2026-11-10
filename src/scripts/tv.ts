// The Media screen: a TV. CH+/CH- and the guide buttons change the channel,
// each one a featured YouTube video, with a burst of static in between.
import { startStatic, type StaticHandle } from './static';

const tv = document.querySelector<HTMLElement>('.tv');

if (tv) {
  const iframe = tv.querySelector<HTMLIFrameElement>('iframe')!;
  const canvas = tv.querySelector<HTMLCanvasElement>('.tv-static')!;
  const osd = tv.querySelector<HTMLElement>('.tv-osd')!;
  const osdCh = osd.querySelector<HTMLElement>('.ch')!;
  const osdTitle = osd.querySelector<HTMLElement>('.t')!;
  const readCh = tv.querySelector<HTMLElement>('[data-tv-ch]')!;
  const readTitle = tv.querySelector<HTMLElement>('[data-tv-title]')!;
  const guide = Array.from(tv.querySelectorAll<HTMLButtonElement>('[data-yt]'));

  // Our own transport controls drive the YouTube player over postMessage (its native bar is hidden).
  const YT = 'https://www.youtube-nocookie.com';
  const btnPlay = tv.querySelector<HTMLButtonElement>('[data-yt-play]')!;
  const btnMute = tv.querySelector<HTMLButtonElement>('[data-yt-mute]')!;
  const seek = tv.querySelector<HTMLInputElement>('[data-yt-seek]')!;
  const vol = tv.querySelector<HTMLInputElement>('[data-yt-vol]')!;
  const timeEl = tv.querySelector<HTMLElement>('[data-yt-time]')!;
  const catcher = tv.querySelector<HTMLElement>('.tv-catch')!;
  const yt = { state: -1, time: 0, dur: 0, muted: false, volume: 100, seeking: false };
  let handshake = 0;

  const send = (func: string, args: unknown[] = []) =>
    iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' }), YT);
  const clock = (t: number) => {
    t = Math.max(0, Math.floor(t || 0));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };
  function paint() {
    const playing = yt.state === 1 || yt.state === 3;
    btnPlay.textContent = playing ? 'Pause' : 'Play';
    btnPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    btnMute.textContent = yt.muted || yt.volume === 0 ? 'Muted' : 'Vol';
    btnMute.setAttribute('aria-label', yt.muted ? 'Unmute' : 'Mute');
    btnMute.classList.toggle('is-on', yt.muted || yt.volume === 0);
    if (!yt.seeking) seek.value = String(yt.dur ? Math.round((yt.time / yt.dur) * 1000) : 0);
    timeEl.textContent = `${clock(yt.time)} / ${clock(yt.dur)}`;
    if (document.activeElement !== vol) vol.value = String(yt.muted ? 0 : yt.volume);
  }
  function resetPlayer() {
    Object.assign(yt, { state: -1, time: 0, dur: 0, seeking: false });
    paint();
  }
  // The player only talks back once it hears "listening", so keep saying it until it answers.
  function startHandshake() {
    clearInterval(handshake);
    let n = 0;
    const say = () => {
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT);
      if (++n > 40) clearInterval(handshake);
    };
    say();
    handshake = window.setInterval(say, 500);
  }
  iframe.addEventListener('load', () => {
    if (iframe.src.startsWith(YT)) startHandshake();
  });
  window.addEventListener('message', (e) => {
    if (e.source !== iframe.contentWindow) return;
    let d: any;
    try {
      d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch {
      return;
    }
    if (!d || (d.event !== 'infoDelivery' && d.event !== 'initialDelivery' && d.event !== 'onStateChange')) return;
    clearInterval(handshake);
    const i = d.info ?? {};
    if (d.event === 'onStateChange' && typeof d.info === 'number') yt.state = d.info;
    if (typeof i.playerState === 'number') yt.state = i.playerState;
    if (typeof i.currentTime === 'number') yt.time = i.currentTime;
    if (typeof i.duration === 'number') yt.dur = i.duration;
    if (typeof i.muted === 'boolean') yt.muted = i.muted;
    if (typeof i.volume === 'number') yt.volume = i.volume;
    paint();
  });
  const togglePlay = () => (yt.state === 1 || yt.state === 3 ? send('pauseVideo') : send('playVideo'));
  btnPlay.addEventListener('click', togglePlay);
  catcher.addEventListener('click', togglePlay);
  btnMute.addEventListener('click', () => {
    yt.muted = !yt.muted;
    if (yt.muted) send('mute');
    else {
      send('unMute');
      if (yt.volume === 0) send('setVolume', [60]);
    }
    paint();
  });
  vol.addEventListener('input', () => {
    const v = Number(vol.value);
    yt.volume = v;
    send('setVolume', [v]);
    if (v > 0 && yt.muted) {
      yt.muted = false;
      send('unMute');
    } else if (v === 0) {
      yt.muted = true;
      send('mute');
    }
    paint();
  });
  seek.addEventListener('input', () => {
    yt.seeking = true;
    yt.time = (Number(seek.value) / 1000) * yt.dur;
    paint();
  });
  seek.addEventListener('change', () => {
    send('seekTo', [(Number(seek.value) / 1000) * yt.dur, true]);
    yt.seeking = false;
  });

  const pad = (n: number) => String(n).padStart(2, '0');
  const channels = guide.map((b) => ({ id: b.dataset.yt!, title: b.dataset.title ?? '' }));

  let index = 0;
  let started = false;
  let token = 0;
  let staticHandle: StaticHandle | null = null;
  let osdTimer = 0;

  function showOsd() {
    osd.classList.add('show');
    clearTimeout(osdTimer);
    osdTimer = window.setTimeout(() => osd.classList.remove('show'), 3200);
  }

  function tune(i: number, autoplay: boolean) {
    index = (i + channels.length) % channels.length;
    const c = channels[index];
    const label = `CH ${pad(index + 1)}`;

    osdCh.textContent = label;
    osdTitle.textContent = c.title;
    readCh.textContent = `${label} / ${pad(channels.length)}`;
    readTitle.textContent = c.title;
    guide.forEach((b, n) => b.classList.toggle('is-on', n === index));
    showOsd();

    // Static covers the swap: at least a beat, until the video has loaded (or 1.8s).
    staticHandle?.stop();
    const handle = startStatic(canvas, 96);
    staticHandle = handle;
    const mine = ++token;
    const minimum = new Promise((r) => setTimeout(r, 450));
    const loaded = new Promise((r) => {
      const done = () => {
        iframe.removeEventListener('load', done);
        r(null);
      };
      iframe.addEventListener('load', done);
      setTimeout(done, 1800);
    });
    resetPlayer();
    iframe.src =
      `${YT}/embed/${c.id}?rel=0&playsinline=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1` +
      `&enablejsapi=1&origin=${encodeURIComponent(location.origin)}` +
      (autoplay ? '&autoplay=1' : '');
    iframe.title = `${label}: ${c.title}`;
    void Promise.all([minimum, loaded]).then(() => {
      if (mine === token) handle.stop();
    });
  }

  const step = (d: number) => tune(index + d, true);

  // Desktop: the menus drawn over the video show on activity and fade after a few seconds.
  const root = document.documentElement;
  let uiTimer = 0;
  let uiHeld = false;
  const hideUi = () => {
    if (!uiHeld) root.dataset.tvui = 'off';
  };
  const showUi = () => {
    if (root.dataset.pane !== 'media') return;
    root.dataset.tvui = 'on';
    clearTimeout(uiTimer);
    uiTimer = window.setTimeout(hideUi, 3800);
  };
  document.addEventListener('mousemove', showUi);
  document.addEventListener('pointerdown', showUi);
  document.addEventListener('keydown', showUi);
  // Don't fade out while the pointer rests on a menu or a button inside one has focus.
  const hold = (on: boolean) => {
    uiHeld = on;
    if (on) showUi();
    else uiTimer = window.setTimeout(hideUi, 3800);
  };
  const menus = [tv.querySelector('.tv-side'), tv.querySelector('.tv-readout'), tv.querySelector('.tv-deck'), document.querySelector('.osd'), document.querySelector('.hud')];
  menus.forEach((m) => {
    m?.addEventListener('mouseenter', () => hold(true));
    m?.addEventListener('mouseleave', () => hold(false));
    m?.addEventListener('focusin', () => hold(true));
    m?.addEventListener('focusout', () => hold(false));
  });

  tv.querySelectorAll<HTMLElement>('[data-tv-step]').forEach((b) =>
    b.addEventListener('click', () => step(Number(b.dataset.tvStep))),
  );
  guide.forEach((b, n) => b.addEventListener('click', () => tune(n, true)));

  document.addEventListener('keydown', (e) => {
    if (document.documentElement.dataset.pane !== 'media') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowUp', 'PageUp', ']'].includes(e.key)) {
      e.preventDefault();
      step(1);
    } else if (['ArrowDown', 'PageDown', '['].includes(e.key)) {
      e.preventDefault();
      step(-1);
    }
  });

  // Tune in when the screen opens; shut the video off when leaving so it can't keep playing unseen.
  // Also runs once at load, so opening the page straight on #media still gets a picture.
  let on = false;
  function powerOn() {
    if (on) return;
    on = true;
    showUi();
    // First tune-in doesn't autoplay, so nobody gets surprise sound.
    tune(started ? index : 0, false);
    started = true;
  }
  function powerOff() {
    on = false;
    clearTimeout(uiTimer);
    delete root.dataset.tvui;
    uiHeld = false;
    token++;
    staticHandle?.stop();
    clearInterval(handshake);
    resetPlayer();
    iframe.src = 'about:blank';
  }
  document.addEventListener('pane:change', (e) => {
    const { name, prev } = (e as CustomEvent).detail;
    if (name === 'media') powerOn();
    else if (prev === 'media' || on) powerOff();
  });
  if (root.dataset.pane === 'media') powerOn();
}
