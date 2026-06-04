// Inject custom styles for the button transition
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
`;
(document.head || document.documentElement).appendChild(style);

// Core function to grab the raw frame data
function captureFrame(specificVideo = null) {
  const video = specificVideo || 
                (window.location.href.includes('/shorts') ? document.querySelector('ytd-reel-video-renderer[is-active] video') : null) ||
                document.querySelector('video.html5-main-video') || 
                document.querySelector('video');

  if (!video) {
    console.error('YouTube video element not found.');
    return;
  }

  // Animate the button SVG immediately for responsive feedback
  // (Try both watch page button and active Shorts page button)
  const activeBtn = specificVideo 
    ? (specificVideo.closest('ytd-reel-video-renderer') ? specificVideo.closest('ytd-reel-video-renderer').querySelector('#yt-shorts-capture-btn') : null)
    : document.querySelector('#yt-native-capture-btn');
  
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
                          activeReel.querySelector('#overlay-metadata h2');
          if (titleEl) videoTitle = titleEl.innerText;
        }
      } else {
        const titleEl = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('#title h1');
        if (titleEl) videoTitle = titleEl.innerText;
      }
      
      videoTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);

      const currentTime = Math.floor(video.currentTime);
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
  if (event.shiftKey && event.code === 'KeyS') {
    const activeEl = document.activeElement.tagName;
    if (activeEl !== 'INPUT' && activeEl !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
      event.preventDefault();
      captureFrame();
    }
  }
});

// Trigger Layer 2: UI Injection
function injectCaptureButton() {
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
          // Force reflow
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
      
      // If the player controls are auto-hidden (overlay faded), immediately hide/clear the tooltip interval
      if (player.classList.contains('ytp-autohide')) {
        hideTooltip();
        return;
      }
      
      // Specifically target the button text tooltip and ignore the progress bar preview thumbnail tooltip
      let tooltip = player.querySelector('.ytp-tooltip:not(.ytp-preview)');
      
      // Force native tooltip creation if YouTube has not initialized it yet
      if (!tooltip) {
        const nativeButton = player.querySelector('.ytp-settings-button') || 
                             player.querySelector('.ytp-play-button') || 
                             player.querySelector('.ytp-button:not(#yt-native-capture-btn)');
        if (nativeButton) {
          // Dispatch both bubbling (mouseover/mouseout) and non-bubbling events to trigger delegated listeners
          nativeButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          nativeButton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
          nativeButton.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
          nativeButton.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
          tooltip = player.querySelector('.ytp-tooltip:not(.ytp-preview)');
        }
      }
      
      const tooltipText = tooltip ? tooltip.querySelector('.ytp-tooltip-text') : null;
      if (!tooltip || !tooltipText) return;

      // Only capture original transform if it is present and not overridden yet
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
      
      // Dynamically calculate top relative to the progress bar to adapt to screen scale
      const progressBar = player.querySelector('.ytp-progress-bar-container');
      let topOffset = buttonRect.top - playerRect.top - tooltip.offsetHeight - 14; // Fallback
      
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
}

// Reliable, zero-overhead triggers for SPA navigation and dynamic player loading
let playerObserver = null;

function ensureButtonInjected() {
  const controlBar = document.querySelector('.ytp-right-controls');
  if (controlBar && controlBar.querySelector('#yt-native-capture-btn')) {
    // Already successfully injected! Disconnect the observer to free up CPU resources.
    if (playerObserver) {
      playerObserver.disconnect();
      playerObserver = null;
    }
    return;
  }

  // Attempt to inject immediately
  injectCaptureButton();

  // If still not injected (because the video player is rendering), observe mutations inside the player only
  const player = document.querySelector('.html5-video-player');
  if (player && !playerObserver) {
    playerObserver = new MutationObserver(() => {
      injectCaptureButton();
      // Disconnect immediately once the button is injected to ensure 0% CPU overhead during playback
      if (document.querySelector('#yt-native-capture-btn')) {
        playerObserver.disconnect();
        playerObserver = null;
      }
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