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

// Core function to grab the raw frame data
function captureFrame(specificVideo = null) {
  const video = getActiveVideo(specificVideo);

  if (!video || video.videoWidth === 0) {
    console.error('Active YouTube video element with valid dimensions not found.');
    return;
  }

  // Trigger camera flash animation immediately over the active video window
  triggerFlashAnimation(video);

  // Animate the button SVG immediately for responsive feedback
  const activeBtn = specificVideo 
    ? (specificVideo.closest('ytd-reel-video-renderer') ? specificVideo.closest('ytd-reel-video-renderer').querySelector('#yt-shorts-capture-btn') : null)
    : (document.querySelector('#yt-shorts-capture-btn') || document.querySelector('#yt-native-capture-btn'));
  
  const svg = activeBtn ? activeBtn.querySelector('svg') : document.querySelector('#yt-native-capture-btn svg');
  if (svg) {
    if (!svg.classList.contains('rotated-180') && !svg.classList.contains('rotated-360')) {
      svg.classList.add('rotated-180');
    } else if (svg.classList.contains('rotated-180')) {
      svg.classList.remove('rotated-180');
      svg.classList.add('rotated-360');
    }
  }

  // Fetch preferences from browser storage (Defaults to JPEG and Native resolution if unset)
  chrome.storage.local.get({ format: 'image/jpeg', resolution: 'native' }, (settings) => {
    try {
      let targetWidth = video.videoWidth;
      let targetHeight = video.videoHeight;

      // Calculate scaled downscaling proportions if a limit is active
      if (settings.resolution !== 'native') {
        const maxLongEdgeHeight = parseInt(settings.resolution, 10);

        if (video.videoHeight > maxLongEdgeHeight) {
          const scaleFactor = maxLongEdgeHeight / video.videoHeight;
          targetWidth = Math.round(video.videoWidth * scaleFactor);
          targetHeight = maxLongEdgeHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      // The browser natively handles high-quality downsampling right here:
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

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
        const activeReel = video.closest('ytd-reel-video-renderer');
        if (activeReel) {
          const titleEl = activeReel.querySelector('h2.title') || 
                          activeReel.querySelector('.ytd-reel-player-header') ||
                          activeReel.querySelector('#overlay-metadata h2') ||
                          activeReel.querySelector('yt-formatted-string.title');
          if (titleEl) videoTitle = titleEl.innerText || titleEl.textContent;
        }
      } else {
        const titleEl = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('#title h1');
        if (titleEl) videoTitle = titleEl.innerText || titleEl.textContent;
      }
      
      videoTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
      if (!videoTitle) videoTitle = 'youtube-frame';

      const currentTime = Math.floor(video.currentTime || 0);
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

    const svg = button.querySelector('svg');
    if (svg) {
      svg.addEventListener('transitionend', () => {
        if (svg.classList.contains('rotated-360')) {
          svg.style.transition = 'none';
          svg.classList.remove('rotated-360');
          void svg.offsetWidth;
          svg.style.transition = '';
        }
      });
    }

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

  // 2. Inject into YouTube Shorts action bar controls
  const shortsActionBars = document.querySelectorAll('ytd-reel-player-overlay-renderer #actions, ytd-reel-video-renderer #actions');
  shortsActionBars.forEach((actionBar) => {
    if (actionBar.querySelector('#yt-shorts-capture-btn')) return;

    const button = document.createElement('div');
    button.id = 'yt-shorts-capture-btn';
    button.className = 'yt-spec-button-shape-next';
    button.setAttribute('aria-label', 'Capture Frame (Shift+S)');
    button.style.cssText = 'cursor: pointer; margin-top: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;';

    button.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
        <svg class="yt-capture-svg" viewBox="0 0 24 24" style="stroke: white; fill: none; width: 26px; height: 26px; stroke-width: 1.8;">
          <circle cx="12" cy="12" r="10" />
          <path d="M 14.31 8 A 12 12 0 0 1 20.05 17.94" stroke-linecap="round" />
          <path d="M 9.69 8 A 12 12 0 0 1 21.17 8" stroke-linecap="round" />
          <path d="M 7.38 12 A 12 12 0 0 1 13.12 2.06" stroke-linecap="round" />
          <path d="M 9.69 16 A 12 12 0 0 1 3.95 6.06" stroke-linecap="round" />
          <path d="M 14.31 16 A 12 12 0 0 1 2.83 16" stroke-linecap="round" />
          <path d="M 16.62 12 A 12 12 0 0 1 10.88 21.94" stroke-linecap="round" />
        </svg>
      </div>
      <span style="color: white; font-size: 12px; margin-top: 6px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.6);">Capture</span>
    `;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const reel = button.closest('ytd-reel-video-renderer');
      const video = reel ? reel.querySelector('video') : null;
      captureFrame(video);
    });

    actionBar.appendChild(button);
  });
}

// Dynamic triggers for SPA navigation and dynamic player loading
let playerObserver = null;

function ensureButtonInjected() {
  injectCaptureButton();

  const player = document.querySelector('.html5-video-player') || document.querySelector('ytd-shorts');
  if (player && !playerObserver) {
    playerObserver = new MutationObserver(() => {
      injectCaptureButton();
    });
    playerObserver.observe(player, { childList: true, subtree: true });
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