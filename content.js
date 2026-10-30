// Inject custom styles for the button transition and camera flash
const style = document.createElement('style');
style.textContent = `
  .yt-capture-svg {
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform: rotate(0deg);
    transform-origin: center;
  }
  .yt-capture-svg.rotated-180 {
    transform: rotate(180deg);
  }
  .yt-capture-svg.rotated-360 {
    transform: rotate(360deg);
  }
  .yt-snappy-flash-overlay {
    position: fixed !important;
    pointer-events: none !important;
    z-index: 2147483647 !important;
    background: #ffffff !important;
    box-shadow: 0 0 40px 20px rgba(255, 255, 255, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.7) !important;
    opacity: 0;
    animation: yt-snappy-camera-flash 0.45s ease-in-out forwards !important;
    will-change: opacity, transform;
  }
  /* Force max limit: the paused frame held over the player while YouTube swaps streams underneath.
     z-index 20 sits above YouTube's loading spinner (18) and pause icon (19), below its controls (24+) */
  .yt-snappy-freeze {
    position: absolute;
    z-index: 20;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .yt-snappy-freeze.fade-out {
    opacity: 0;
  }
  .yt-snappy-freeze canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .yt-snappy-freeze-label {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 7px 10px;
    border-radius: 8px;
    background: rgba(28, 28, 28, 0.9);
    color: #fff;
    font: 500 13px/1 Roboto, Arial, sans-serif;
    white-space: nowrap;
  }
  /* Background capture: the hidden, muted copy of the page that loads the sharper stream */
  .yt-snappy-copy {
    position: fixed;
    left: 0;
    top: 0;
    width: 640px;
    height: 360px;
    border: 0;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  }
  /* The "Snapping…" pill shown while the video keeps playing. z-index 60 sits above YouTube's top bar (58) */
  .yt-snappy-progress {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 60;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(28, 28, 28, 0.9);
    color: #fff;
    font: 500 13px/1 Roboto, Arial, sans-serif;
    white-space: nowrap;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .yt-snappy-progress.fade-out {
    opacity: 0;
  }
  .yt-snappy-progress-track {
    display: block;
    width: 120px;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.25);
    overflow: hidden;
  }
  .yt-snappy-progress-fill {
    display: block;
    width: 0;
    height: 100%;
    background: #FF70A6;
    transition: width 0.3s ease;
  }
  @keyframes yt-snappy-camera-flash {
    0% {
      opacity: 0;
      transform: scale(0.995);
    }
    30% {
      opacity: 0.9;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.005);
    }
  }
  /* Shorts capture button: same 48x78 footprint as YouTube's own like/share/remix buttons */
  .yt-shorts-capture-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
    padding-bottom: 8px;
    cursor: pointer;
    user-select: none;
    outline: none;
  }
  /* YouTube adds margin-top: 16px to every child of the action bar except its own buttons */
  reel-action-bar-view-model > .yt-shorts-capture-btn {
    margin-top: 0;
  }
  .yt-shorts-capture-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.05);
    transition: background-color 0.2s;
  }
  .yt-shorts-capture-btn:hover .yt-shorts-capture-circle,
  .yt-shorts-capture-btn:focus-visible .yt-shorts-capture-circle {
    background: rgba(0, 0, 0, 0.1);
  }
  .yt-shorts-capture-circle svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: #0f0f0f;
    stroke-width: 1.8;
  }
  /* Label typography measured from YouTube's own "Share" / "Remix" labels */
  .yt-shorts-capture-label {
    margin-top: 4px;
    font: 400 12px/18px Roboto, Arial, sans-serif;
    color: #0f0f0f;
  }
  /* Hover tooltip, sliding in from the left of the button like YouTube's player tooltips */
  .yt-shorts-capture-tooltip {
    position: absolute;
    right: calc(100% + 10px);
    top: 24px;
    transform: translate(6px, -50%);
    opacity: 0;
    pointer-events: none;
    white-space: nowrap;
    padding: 7px 10px;
    border-radius: 8px;
    background: rgba(28, 28, 28, 0.9);
    color: #fff;
    font: 500 13px/1 Roboto, Arial, sans-serif;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 2147483646;
  }
  .yt-shorts-capture-btn:hover .yt-shorts-capture-tooltip,
  .yt-shorts-capture-btn:focus-visible .yt-shorts-capture-tooltip {
    opacity: 1;
    transform: translate(0, -50%);
  }
  /* Dark theme */
  html[dark] .yt-shorts-capture-circle {
    background: rgba(255, 255, 255, 0.2);
  }
  html[dark] .yt-shorts-capture-btn:hover .yt-shorts-capture-circle,
  html[dark] .yt-shorts-capture-btn:focus-visible .yt-shorts-capture-circle {
    background: rgba(255, 255, 255, 0.3);
  }
  html[dark] .yt-shorts-capture-circle svg {
    stroke: #fff;
  }
  html[dark] .yt-shorts-capture-label {
    color: #f1f1f1;
  }
  /* Narrow windows: YouTube overlays the action bar on top of the video */
  reel-action-bar-view-model:has(.ytSpecButtonShapeWithLabelIsOverlay) .yt-shorts-capture-circle {
    background: rgba(0, 0, 0, 0.3);
  }
  reel-action-bar-view-model:has(.ytSpecButtonShapeWithLabelIsOverlay) .yt-shorts-capture-btn:hover .yt-shorts-capture-circle {
    background: rgba(0, 0, 0, 0.45);
  }
  reel-action-bar-view-model:has(.ytSpecButtonShapeWithLabelIsOverlay) .yt-shorts-capture-circle svg {
    stroke: #fff;
  }
  reel-action-bar-view-model:has(.ytSpecButtonShapeWithLabelIsOverlay) .yt-shorts-capture-label {
    color: #fff;
  }
`;
(document.head || document.documentElement).appendChild(style);

// Helper function to reliably get the active, visible playing video (Shorts or Watch)
function getActiveVideo(specificVideo = null) {
  if (specificVideo && specificVideo.videoWidth > 0 && specificVideo.readyState >= 1) {
    return specificVideo;
  }

  const allVideos = Array.from(document.querySelectorAll('video'));
  if (allVideos.length === 0) return null;

  // Filter candidates visible in viewport with non-zero dimensions
  const candidates = allVideos.filter(v => {
    const rect = v.getBoundingClientRect();
    const isVisibleOnScreen = rect.width > 0 && rect.height > 0 && 
                              rect.top < window.innerHeight && rect.bottom > 0 && 
                              rect.left < window.innerWidth && rect.right > 0;
    const hasValidDimensions = v.videoWidth > 0 && v.videoHeight > 0;
    return isVisibleOnScreen && hasValidDimensions;
  });

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    // Prefer video that is unpaused & playing
    const playingVideo = candidates.find(v => !v.paused && v.currentTime > 0);
    if (playingVideo) return playingVideo;

    // Fallback: pick candidate closest to screen center
    candidates.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      const aCenterDist = Math.abs((aRect.top + aRect.height / 2) - (window.innerHeight / 2));
      const bCenterDist = Math.abs((bRect.top + bRect.height / 2) - (window.innerHeight / 2));
      return aCenterDist - bCenterDist;
    });
    return candidates[0];
  }

  // Fallback to any video with valid dimensions
  return allVideos.find(v => v.videoWidth > 0) || allVideos[0];
}

// Function to trigger a heavy, smooth camera flash animation over the video window
function triggerFlashAnimation(video) {
  if (!video) return;

  const videoRect = video.getBoundingClientRect();
  if (videoRect.width === 0 || videoRect.height === 0) return;

  const flash = document.createElement('div');
  flash.className = 'yt-snappy-flash-overlay';

  flash.style.top = `${videoRect.top}px`;
  flash.style.left = `${videoRect.left}px`;
  flash.style.width = `${videoRect.width}px`;
  flash.style.height = `${videoRect.height}px`;

  // Inherit border radius if present (e.g. YouTube Shorts or player rounded corners)
  try {
    const videoStyle = window.getComputedStyle(video);
    if (videoStyle.borderRadius && videoStyle.borderRadius !== '0px') {
      flash.style.borderRadius = videoStyle.borderRadius;
    } else {
      const player = video.closest('.html5-video-player') || video.closest('ytd-reel-video-renderer');
      if (player) {
        const playerStyle = window.getComputedStyle(player);
        if (playerStyle.borderRadius && playerStyle.borderRadius !== '0px') {
          flash.style.borderRadius = playerStyle.borderRadius;
        }
      }
    }
  } catch (e) {
    // Ignore computed style errors
  }

  (document.body || document.documentElement).appendChild(flash);

  const cleanup = () => {
    if (flash.parentNode) {
      flash.parentNode.removeChild(flash);
    }
  };

  flash.addEventListener('animationend', cleanup);
  setTimeout(cleanup, 500);
}

// YouTube's quality names, keyed to the number in their "1080p"-style labels
const QUALITY_HEIGHTS = {
  highres: 4320,
  hd2880: 2880,
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720: 720,
  large: 480,
  medium: 360,
  small: 240,
  tiny: 144
};

let snappyCounter = 0;
let forcedCaptureRunning = false;

// Ask bridge.js (running inside YouTube's page) to drive the player's quality API
function askBridge(player, cmd, args = {}) {
  if (!player.dataset.snappyPlayer) {
    player.dataset.snappyPlayer = String(++snappyCounter);
  }
  const id = ++snappyCounter;

  return new Promise((resolve) => {
    const onResponse = (event) => {
      let response;
      try {
        response = JSON.parse(event.detail);
      } catch (e) {
        return;
      }
      if (response.id !== id) return;
      clearTimeout(timer);
      document.removeEventListener('snappy-response', onResponse);
      resolve(response.result);
    };
    const timer = setTimeout(() => {
      document.removeEventListener('snappy-response', onResponse);
      resolve(null);
    }, 1000);

    document.addEventListener('snappy-response', onResponse);
    document.dispatchEvent(new CustomEvent('snappy-request', {
      detail: JSON.stringify({ id, player: player.dataset.snappyPlayer, cmd, ...args })
    }));
  });
}

function grabFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  return canvas;
}

function waitFor(check, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (check()) return resolve(true);
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
}

// The highest quality YouTube offers within the limit, or null when it's no sharper than what's playing
function pickTargetQuality(info, resolution) {
  const limit = resolution === 'native' ? Infinity : parseInt(resolution, 10);
  const target = info.available
    .filter(q => QUALITY_HEIGHTS[q] && QUALITY_HEIGHTS[q] <= limit)
    .sort((a, b) => QUALITY_HEIGHTS[b] - QUALITY_HEIGHTS[a])[0];
  if (!target || QUALITY_HEIGHTS[target] <= (QUALITY_HEIGHTS[info.current] || 0)) return null;
  return target;
}

// The video's ID from a watch or Shorts URL
function getVideoId() {
  const url = new URL(location.href);
  if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
  return url.searchParams.get('v');
}

// Background capture: while the video keeps playing, a hidden muted copy of the page loads the sharper
// stream and grabs the same moment from it, so a slow connection never freezes the video being watched.
// Returns a canvas with the frame, or null when there's nothing higher to switch to.
async function grabInBackground(video, resolution) {
  const player = video.closest('.html5-video-player');
  if (!player || player.classList.contains('ad-showing')) return null;
  const videoId = getVideoId();
  if (!videoId) return null;

  const info = await askBridge(player, 'getQuality');
  if (!info || !Array.isArray(info.available)) return null;

  const target = pickTargetQuality(info, resolution);
  if (!target) return null;

  const frameTime = video.currentTime;
  const originalPixels = video.videoWidth * video.videoHeight;
  // The moment the user snapped, kept in case the sharper stream is too slow to arrive
  const originalFrame = grabFrame(video);
  const progress = showSnapProgress(player, `Snapping ${QUALITY_HEIGHTS[target]}p…`);

  const frame = document.createElement('iframe');
  frame.id = `snappy-copy-${++snappyCounter}`;
  frame.className = 'yt-snappy-copy';
  frame.src = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&t=${Math.floor(frameTime)}s`;
  // Keep the copy silent from its very first frame
  const muter = setInterval(() => {
    if (frame.contentDocument) frame.contentDocument.querySelectorAll('video').forEach(v => { v.muted = true; });
  }, 30);
  document.body.appendChild(frame);
  let copy = null;

  try {
    const loaded = await waitFor(() => {
      copy = frame.contentDocument && frame.contentDocument.querySelector('.html5-video-player');
      return !!copy;
    }, 15000);
    if (!loaded) return originalFrame;
    progress.set(0.2);

    // The copy's player API shows up a moment after its element does
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) {
      const copyInfo = await askBridge(copy, 'getQuality', { frame: frame.id });
      ready = !!copyInfo && Array.isArray(copyInfo.available) && copyInfo.available.includes(target);
      if (!ready) await new Promise(r => setTimeout(r, 200));
    }
    if (!ready) return originalFrame;
    await askBridge(copy, 'mute', { frame: frame.id });

    // An ad in the copy has to play out (muted and unseen) before the video itself loads
    if (!(await waitFor(() => !copy.classList.contains('ad-showing'), 30000))) return originalFrame;
    progress.set(0.4);

    // YouTube only loads another quality into a copy that has started playing
    await askBridge(copy, 'play', { frame: frame.id });
    await askBridge(copy, 'setQuality', { frame: frame.id, quality: target });
    await askBridge(copy, 'seekTo', { frame: frame.id, time: frameTime });

    const switched = await waitFor(() => {
      const v = copy.querySelector('video');
      return v && v.videoWidth * v.videoHeight > originalPixels && !v.seeking && v.readyState >= 2;
    }, 20000);
    const hiResVideo = copy.querySelector('video');
    if (!switched || !hiResVideo) return originalFrame;
    progress.set(0.9);

    // Settle the copy on the exact moment the user snapped
    await askBridge(copy, 'pause', { frame: frame.id });
    await askBridge(copy, 'seekTo', { frame: frame.id, time: frameTime });
    await waitFor(() => !hiResVideo.seeking && hiResVideo.readyState >= 2, 5000);
    if (Math.abs(hiResVideo.currentTime - frameTime) > 0.001) return originalFrame;

    return grabFrame(hiResVideo);
  } finally {
    clearInterval(muter);
    // The copy saves its quality as the user's default, just like the real player would
    if (copy) await askBridge(copy, 'restoreQuality', { frame: frame.id, preferred: info.preferred, stored: info.stored });
    frame.remove();
    progress.done();
  }
}

// Small "Snapping…" pill with a progress bar over the player while a background capture runs
function showSnapProgress(player, labelText) {
  const pill = document.createElement('div');
  pill.className = 'yt-snappy-progress';
  const label = document.createElement('span');
  label.textContent = labelText;
  const track = document.createElement('span');
  track.className = 'yt-snappy-progress-track';
  const fill = document.createElement('span');
  fill.className = 'yt-snappy-progress-fill';
  track.appendChild(fill);
  pill.append(label, track);
  player.appendChild(pill);

  let value = 0;
  const set = (next) => {
    value = Math.max(value, next);
    fill.style.width = `${value * 100}%`;
  };
  // YouTube doesn't say how much of the sharper stream has arrived, so the bar moves in steps
  // and creeps forward on its own while the download is pending
  const creep = setInterval(() => {
    if (value < 0.85) set(Math.min(0.85, value + 0.02));
  }, 400);

  return {
    set,
    done() {
      clearInterval(creep);
      set(1);
      pill.classList.add('fade-out');
      setTimeout(() => pill.remove(), 250);
    }
  };
}

// Force max limit: pause, bump YouTube to the highest quality within the limit, re-grab the exact
// same frame from the sharper stream, then put the user's quality back.
// Returns a canvas with the frame, or null when there's nothing higher to switch to.
async function grabAtForcedQuality(video, resolution) {
  const player = video.closest('.html5-video-player');
  if (!player || player.classList.contains('ad-showing')) return null;
  // Switching quality on the very last frame makes YouTube reload the video with nothing to show
  if (video.ended || video.currentTime >= video.duration - 0.1) return null;

  const info = await askBridge(player, 'getQuality');
  if (!info || !Array.isArray(info.available)) return null;

  const target = pickTargetQuality(info, resolution);
  if (!target) return null;

  const wasPlaying = !video.paused;
  // Pause through YouTube's player, not the <video> element: if YouTube still thinks it's playing,
  // the quality switch reloads the stream and carries on playing from a different spot
  await askBridge(player, 'pause');
  const frameTime = video.currentTime;
  const originalPixels = video.videoWidth * video.videoHeight;
  // Kept in case the sharper stream never shows up
  const originalFrame = grabFrame(video);
  const freeze = showFreezeFrame(player, video, originalFrame, `Snapping ${QUALITY_HEIGHTS[target]}p…`);

  try {
    // YouTube's own clock lags the video by a few frames, and every quality reload lands on that clock.
    // Seeking through the player syncs it to the exact paused frame, for both the switch and the restore.
    await askBridge(player, 'seekTo', { time: frameTime });
    await askBridge(player, 'setQuality', { quality: target });

    // YouTube reloads the paused video in the sharper stream, usually within a second or two
    const switched = await waitFor(() => {
      const v = player.querySelector('video');
      return v && v.videoWidth * v.videoHeight > originalPixels && !v.seeking && v.readyState >= 2;
    }, 10000);
    const hiResVideo = player.querySelector('video');
    if (!switched || !hiResVideo) return originalFrame;

    if (Math.abs(hiResVideo.currentTime - frameTime) > 0.001) {
      await askBridge(player, 'seekTo', { time: frameTime });
      await waitFor(() => !hiResVideo.seeking && hiResVideo.readyState >= 2, 5000);
    }
    if (Math.abs(hiResVideo.currentTime - frameTime) > 0.001) return originalFrame;

    return grabFrame(hiResVideo);
  } finally {
    await askBridge(player, 'restoreQuality', { preferred: info.preferred, stored: info.stored });
    // Keep the frozen frame up until the user's own quality has loaded back in, so the reloads stay hidden
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const v = player.querySelector('video');
      return v && v.videoWidth > 0 && !v.seeking && v.readyState >= 2;
    }, 5000);
    if (wasPlaying) await askBridge(player, 'play');
    freeze.classList.add('fade-out');
    setTimeout(() => freeze.remove(), 250);
  }
}

// Holds the paused frame over the player while Force max limit swaps YouTube's streams underneath,
// hiding the black reloads and loading spinner
function showFreezeFrame(player, video, frame, labelText) {
  const playerRect = player.getBoundingClientRect();
  const videoRect = video.getBoundingClientRect();

  const freeze = document.createElement('div');
  freeze.className = 'yt-snappy-freeze';
  freeze.style.left = `${videoRect.left - playerRect.left}px`;
  freeze.style.top = `${videoRect.top - playerRect.top}px`;
  freeze.style.width = `${videoRect.width}px`;
  freeze.style.height = `${videoRect.height}px`;

  // A copy, so the original frame stays untouched in case it's the one that gets saved
  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  canvas.getContext('2d').drawImage(frame, 0, 0);
  canvas.style.objectFit = window.getComputedStyle(video).objectFit;
  freeze.appendChild(canvas);

  const label = document.createElement('span');
  label.className = 'yt-snappy-freeze-label';
  label.textContent = labelText;
  freeze.appendChild(label);

  player.appendChild(freeze);
  return freeze;
}

// Core function to grab the raw frame data
function captureFrame(specificVideo = null) {
  const video = getActiveVideo(specificVideo);

  if (!video || video.videoWidth === 0) {
    console.error('Active YouTube video element with valid dimensions not found.');
    return;
  }
  // A Force max limit snap is still swapping qualities; let it finish first
  if (forcedCaptureRunning) return;

  // Animate the button SVG immediately for responsive feedback
  // (the button belonging to the captured video: its own Shorts reel, or the watch-page player)
  const activeReel = video.closest('ytd-reel-video-renderer');
  const activeBtn = activeReel
    ? activeReel.querySelector('.yt-shorts-capture-btn')
    : document.querySelector('#yt-native-capture-btn');

  const svg = activeBtn ? activeBtn.querySelector('svg') : null;
  if (svg) {
    if (!svg.classList.contains('rotated-180') && !svg.classList.contains('rotated-360')) {
      svg.classList.add('rotated-180');
    } else if (svg.classList.contains('rotated-180')) {
      svg.classList.remove('rotated-180');
      svg.classList.add('rotated-360');
    }
  }

  // Fetch preferences from browser storage (Defaults to JPEG, Native resolution and no forcing if unset)
  chrome.storage.local.get({ format: 'image/jpeg', resolution: 'native', forceMax: false }, async (settings) => {
    const frameTime = video.currentTime || 0;

    // Trigger camera flash animation over the active video window as the frame is taken
    triggerFlashAnimation(video);

    // The frame comes straight from the video, or from the sharper stream Force max limit switched to
    let source = video;
    if (settings.forceMax) {
      forcedCaptureRunning = true;
      try {
        // A playing video keeps playing while a hidden copy fetches the sharper frame; a paused one switches in place
        const grab = video.paused ? grabAtForcedQuality : grabInBackground;
        source = (await grab(video, settings.resolution)) || video;
      } catch (error) {
        console.error('Force max limit failed, snapping the frame as it is:', error);
      } finally {
        forcedCaptureRunning = false;
      }
    }
    const sourceWidth = source === video ? video.videoWidth : source.width;
    const sourceHeight = source === video ? video.videoHeight : source.height;

    try {
      let targetWidth = sourceWidth;
      let targetHeight = sourceHeight;

      // Calculate scaled downscaling proportions if a limit is active
      if (settings.resolution !== 'native') {
        const maxLongEdgeHeight = parseInt(settings.resolution, 10);

        if (sourceHeight > maxLongEdgeHeight) {
          const scaleFactor = maxLongEdgeHeight / sourceHeight;
          targetWidth = Math.round(sourceWidth * scaleFactor);
          targetHeight = maxLongEdgeHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      // The browser natively handles high-quality downsampling right here:
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      // Map matching file extension formats
      let fileExt = 'png';
      if (settings.format === 'image/jpeg') {
        fileExt = 'jpg';
      } else if (settings.format === 'image/webp') {
        fileExt = 'webp';
      }

      const isLossy = settings.format === 'image/jpeg' || settings.format === 'image/webp';
      // 0.92 gives excellent lossy compression without visible blocky artifacts
      const dataURL = canvas.toDataURL(settings.format, isLossy ? 0.92 : undefined);

      // Extract video title safely (handling watch vs shorts pages)
      let videoTitle = 'youtube-frame';
      if (window.location.href.includes('/shorts')) {
        // The Short's title under the video, falling back to the Shorts player's own (hidden) title bar
        const activeReel = video.closest('ytd-reel-video-renderer');
        const player = video.closest('.html5-video-player');
        const titleEl = (activeReel && (activeReel.querySelector('yt-shorts-video-title-view-model') ||
                                        activeReel.querySelector('h2.title'))) ||
                        (player && player.querySelector('.ytp-title-link'));
        if (titleEl) videoTitle = titleEl.innerText || titleEl.textContent;
      } else {
        const titleEl = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('#title h1');
        if (titleEl) videoTitle = titleEl.innerText || titleEl.textContent;
      }
      
      videoTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
      if (!videoTitle) videoTitle = 'youtube-frame';

      const currentTime = Math.floor(frameTime);
      const minutes = Math.floor(currentTime / 60);
      const seconds = currentTime % 60;
      const timestamp = `${minutes}m${seconds}s`;

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `${videoTitle}_${timestamp}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Frame capture failed:', error);
    }
  });
}

// Trigger Layer 1: Keyboard Shortcut (Shift + S)
document.addEventListener('keydown', (event) => {
  if (event.shiftKey && (event.code === 'KeyS' || (event.key && event.key.toLowerCase() === 's'))) {
    const activeEl = document.activeElement ? document.activeElement.tagName : '';
    if (activeEl !== 'INPUT' && activeEl !== 'TEXTAREA' && (!document.activeElement || !document.activeElement.isContentEditable)) {
      event.preventDefault();
      captureFrame();
    }
  }
});

// After a full 360° spin, snap the shutter icon back to 0° without animating so the next capture spins again
function enableSpinReset(svg) {
  if (!svg) return;
  svg.addEventListener('transitionend', () => {
    if (svg.classList.contains('rotated-360')) {
      svg.style.transition = 'none';
      svg.classList.remove('rotated-360');
      void svg.offsetWidth;
      svg.style.transition = '';
    }
  });
}

// Trigger Layer 2: UI Injection (Watch Page & Shorts)
function injectCaptureButton() {
  // 1. Inject into standard YouTube player controls
  const controlBars = document.querySelectorAll('.ytp-right-controls');
  controlBars.forEach((controlBar) => {
    if (controlBar.querySelector('#yt-native-capture-btn')) return;

    const button = document.createElement('button');
    button.id = 'yt-native-capture-btn';
    button.className = 'ytp-button';
    button.setAttribute('aria-label', 'Capture Frame (Shift+S)');

    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.minWidth = '46px';

    button.innerHTML = `
      <svg class="yt-capture-svg" viewBox="0 0 24 24" style="stroke: white; fill: none; width: 22px; height: 22px; opacity: 0.9; stroke-width: 1.8;">
        <circle cx="12" cy="12" r="10" />
        <path d="M 14.31 8 A 12 12 0 0 1 20.05 17.94" stroke-linecap="round" />
        <path d="M 9.69 8 A 12 12 0 0 1 21.17 8" stroke-linecap="round" />
        <path d="M 7.38 12 A 12 12 0 0 1 13.12 2.06" stroke-linecap="round" />
        <path d="M 9.69 16 A 12 12 0 0 1 3.95 6.06" stroke-linecap="round" />
        <path d="M 14.31 16 A 12 12 0 0 1 2.83 16" stroke-linecap="round" />
        <path d="M 16.62 12 A 12 12 0 0 1 10.88 21.94" stroke-linecap="round" />
      </svg>
    `;

    enableSpinReset(button.querySelector('svg'));

    // Hover Tooltip logic to mimic YouTube native tooltips
    let originalTransform = '';
    let tooltipInterval = null;

    function updateTooltipPosition() {
      const player = button.closest('.html5-video-player');
      if (!player) return;
      
      if (player.classList.contains('ytp-autohide')) {
        hideTooltip();
        return;
      }
      
      let tooltip = player.querySelector('.ytp-tooltip:not(.ytp-preview)');
      
      if (!tooltip) {
        const nativeButton = player.querySelector('.ytp-settings-button') || 
                             player.querySelector('.ytp-play-button') || 
                             player.querySelector('.ytp-button:not(#yt-native-capture-btn)');
        if (nativeButton) {
          nativeButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          nativeButton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
          nativeButton.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
          nativeButton.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
          tooltip = player.querySelector('.ytp-tooltip:not(.ytp-preview)');
        }
      }
      
      const tooltipText = tooltip ? tooltip.querySelector('.ytp-tooltip-text') : null;
      if (!tooltip || !tooltipText) return;

      if (tooltip.style.transform && tooltip.style.transform !== 'none' && !originalTransform) {
        originalTransform = tooltip.style.transform;
      }
      
      tooltipText.textContent = 'Capture Frame (Shift+S)';
      
      tooltip.style.display = 'block';
      tooltip.classList.add('ytp-show');
      tooltip.classList.remove('ytp-preview');
      tooltip.classList.remove('ytp-has-duration');
      tooltip.style.transform = 'none';

      const buttonRect = button.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      
      const left = (buttonRect.left - playerRect.left) + (buttonRect.width / 2);
      
      const progressBar = player.querySelector('.ytp-progress-bar-container');
      let topOffset = buttonRect.top - playerRect.top - tooltip.offsetHeight - 14;
      
      if (progressBar) {
        const progressRect = progressBar.getBoundingClientRect();
        topOffset = progressRect.top - playerRect.top - tooltip.offsetHeight - 8;
      }

      tooltip.style.left = (left - tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = topOffset + 'px';
    }

    function showTooltip() {
      if (tooltipInterval) clearInterval(tooltipInterval);
      updateTooltipPosition();
      tooltipInterval = setInterval(updateTooltipPosition, 30);
    }

    function hideTooltip() {
      if (tooltipInterval) {
        clearInterval(tooltipInterval);
        tooltipInterval = null;
      }
      
      const player = button.closest('.html5-video-player');
      if (!player) return;
      const tooltip = player.querySelector('.ytp-tooltip:not(.ytp-preview)');
      if (tooltip) {
        tooltip.classList.remove('ytp-show');
        // Undo the display:block from updateTooltipPosition; YouTube hides its tooltip with an inline display:none
        tooltip.style.display = 'none';
        if (originalTransform) {
          tooltip.style.transform = originalTransform;
          originalTransform = '';
        } else {
          tooltip.style.transform = '';
        }
      }
    }

    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);

    button.addEventListener('click', () => {
      const parentPlayer = button.closest('.html5-video-player');
      const associatedVideo = parentPlayer ? parentPlayer.querySelector('video') : null;
      captureFrame(associatedVideo);
      hideTooltip();
    });

    const settingsButton = controlBar.querySelector('.ytp-settings-button');
    if (settingsButton && settingsButton.parentNode) {
      settingsButton.parentNode.insertBefore(button, settingsButton);
    } else {
      controlBar.insertBefore(button, controlBar.firstChild);
    }
  });

  // 2. Inject into YouTube Shorts action bars (the like / comments / share / remix column)
  //    reel-action-bar-view-model is the current layout; the #actions selectors cover older ones
  const shortsActionBars = document.querySelectorAll('reel-action-bar-view-model, ytd-reel-player-overlay-renderer #actions, ytd-reel-video-renderer #actions');
  shortsActionBars.forEach((actionBar) => {
    if (actionBar.querySelector('.yt-shorts-capture-btn')) return;

    const button = document.createElement('div');
    button.className = 'yt-shorts-capture-btn';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', 'Capture Frame (Shift+S)');

    button.innerHTML = `
      <div class="yt-shorts-capture-circle">
        <svg class="yt-capture-svg" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M 14.31 8 A 12 12 0 0 1 20.05 17.94" stroke-linecap="round" />
          <path d="M 9.69 8 A 12 12 0 0 1 21.17 8" stroke-linecap="round" />
          <path d="M 7.38 12 A 12 12 0 0 1 13.12 2.06" stroke-linecap="round" />
          <path d="M 9.69 16 A 12 12 0 0 1 3.95 6.06" stroke-linecap="round" />
          <path d="M 14.31 16 A 12 12 0 0 1 2.83 16" stroke-linecap="round" />
          <path d="M 16.62 12 A 12 12 0 0 1 10.88 21.94" stroke-linecap="round" />
        </svg>
      </div>
      <span class="yt-shorts-capture-label">Snap!</span>
      <span class="yt-shorts-capture-tooltip">Capture Frame (Shift+S)</span>
    `;

    enableSpinReset(button.querySelector('svg'));

    const capture = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const reel = button.closest('ytd-reel-video-renderer');
      const video = reel ? reel.querySelector('video') : null;
      captureFrame(video);
    };
    button.addEventListener('click', capture);
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') capture(e);
    });

    // Sit right under Remix, keeping YouTube's sound/channel thumbnail at the bottom of the column
    const pivot = actionBar.querySelector(':scope > pivot-button-view-model');
    actionBar.insertBefore(button, pivot);
  });
}

// Dynamic triggers for SPA navigation and dynamic player loading
let playerObserver = null;
let shortsObserver = null;
let shortsRoot = null;
let injectionQueued = false;

// Coalesce bursts of DOM mutations into one injection pass per frame
function queueInjection() {
  if (injectionQueued) return;
  injectionQueued = true;
  requestAnimationFrame(() => {
    injectionQueued = false;
    injectCaptureButton();
  });
}

function ensureButtonInjected() {
  injectCaptureButton();

  const player = document.querySelector('.html5-video-player');
  if (player && !playerObserver) {
    playerObserver = new MutationObserver(queueInjection);
    playerObserver.observe(player, { childList: true, subtree: true });
  }

  // Shorts action bars live outside the video player and get re-rendered while scrolling between Shorts
  const shorts = document.querySelector('ytd-shorts');
  if (shorts && shorts !== shortsRoot) {
    if (shortsObserver) shortsObserver.disconnect();
    shortsRoot = shorts;
    shortsObserver = new MutationObserver(queueInjection);
    shortsObserver.observe(shorts, { childList: true, subtree: true });
  }
}

// Listen to YouTube's custom SPA navigation and page update events
document.addEventListener('yt-navigate-finish', ensureButtonInjected);
document.addEventListener('yt-page-data-updated', ensureButtonInjected);
document.addEventListener('spfdone', ensureButtonInjected);

// Safeguard: Watch for URL transitions (SPA route changes)
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    ensureButtonInjected();
  }
}, 500);

// Run initial injection check on load
ensureButtonInjected();

// Listen for messaging commands (e.g. from popup Manual download button)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'captureFrame') {
    captureFrame();
    sendResponse({ status: 'success' });
  }
  return true;
});