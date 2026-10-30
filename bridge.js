// Runs inside YouTube's own page (manifest "world": "MAIN") so it can reach the player's quality API,
// which content.js can't see from its isolated world. The two talk through DOM events carrying JSON strings.
document.addEventListener('snappy-request', (event) => {
  let request;
  try {
    request = JSON.parse(event.detail);
  } catch (e) {
    return;
  }

  const player = document.querySelector(`[data-snappy-player="${request.player}"]`);
  let result = null;

  try {
    if (player && typeof player.getAvailableQualityLevels === 'function') {
      if (request.cmd === 'getQuality') {
        result = {
          current: player.getPlaybackQuality(),
          preferred: player.getPreferredQuality ? player.getPreferredQuality() : 'auto',
          available: player.getAvailableQualityLevels(),
          // YouTube saves every quality change as the default for future videos, so remember what was there
          stored: localStorage.getItem('yt-player-quality')
        };
      } else if (request.cmd === 'pause') {
        player.pauseVideo();
        result = true;
      } else if (request.cmd === 'play') {
        player.playVideo();
        result = true;
      } else if (request.cmd === 'seekTo') {
        player.seekTo(request.time, true);
        result = true;
      } else if (request.cmd === 'setQuality') {
        player.setPlaybackQualityRange(request.quality, request.quality);
        result = true;
      } else if (request.cmd === 'restoreQuality') {
        player.setPlaybackQualityRange(request.preferred, request.preferred);
        // YouTube writes its saved default synchronously inside the call above, so put the user's own back now
        if (request.stored === null) {
          localStorage.removeItem('yt-player-quality');
        } else {
          localStorage.setItem('yt-player-quality', request.stored);
        }
        result = true;
      }
    }
  } catch (e) {
    result = null;
  }

  document.dispatchEvent(new CustomEvent('snappy-response', {
    detail: JSON.stringify({ id: request.id, result })
  }));
});
