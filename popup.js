document.addEventListener('DOMContentLoaded', () => {
  const formatSelect = document.getElementById('format-select');
  const resSelect = document.getElementById('resolution-select');

  // Helper to initialize and bind custom select logic
  function setupCustomSelect(selectEl, storageKey, defaultValue) {
    const trigger = selectEl.querySelector('.custom-select-trigger');
    const options = selectEl.querySelectorAll('.custom-option');

    // Toggle open state on trigger click
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Close other dropdowns first
      document.querySelectorAll('.custom-select').forEach((el) => {
        if (el !== selectEl) el.classList.remove('open');
      });

      selectEl.classList.toggle('open');
    });

    // Option selection logic
    options.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove selection style from other options and select this one
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Update trigger display text
        const textSpan = trigger.querySelector('.trigger-text');
        if (textSpan) {
          textSpan.textContent = option.textContent;
        } else {
          trigger.textContent = option.textContent;
        }
        
        // Save choice in local storage
        const val = option.getAttribute('data-value');
        chrome.storage.local.set({ [storageKey]: val });
        
        // Close menu
        selectEl.classList.remove('open');
      });
    });

    // Set initial value loaded from storage
    chrome.storage.local.get({ [storageKey]: defaultValue }, (items) => {
      const savedValue = items[storageKey];
      let selectedOption = selectEl.querySelector(`.custom-option[data-value="${savedValue}"]`);
      
      if (!selectedOption) {
        selectedOption = selectEl.querySelector(`.custom-option[data-value="${defaultValue}"]`);
        // The saved choice no longer exists (like the old 6k limit), so save the default content.js should use instead
        chrome.storage.local.set({ [storageKey]: defaultValue });
      }
      
      if (selectedOption) {
        options.forEach(opt => opt.classList.remove('selected'));
        selectedOption.classList.add('selected');
        
        const textSpan = trigger.querySelector('.trigger-text');
        if (textSpan) {
          textSpan.textContent = selectedOption.textContent;
        } else {
          trigger.textContent = selectedOption.textContent;
        }
      }
    });
  }

  // Setup both dropdown components
  setupCustomSelect(formatSelect, 'format', 'image/jpeg');
  setupCustomSelect(resSelect, 'resolution', 'native');

  // Force max limit toggle: content.js bumps YouTube's quality up to the limit for the frame being snapped
  const forceToggle = document.getElementById('force-max-toggle');
  chrome.storage.local.get({ forceMax: false }, (items) => {
    forceToggle.setAttribute('aria-checked', String(items.forceMax));
    requestAnimationFrame(() => forceToggle.classList.add('ready'));
  });
  forceToggle.addEventListener('click', () => {
    const on = forceToggle.getAttribute('aria-checked') !== 'true';
    forceToggle.setAttribute('aria-checked', String(on));
    chrome.storage.local.set({ forceMax: on });
  });

  // Close all open dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach((el) => {
      el.classList.remove('open');
    });
  });

  // Manual download button handler with pop-in / pop-out text swap
  const manualBtn = document.getElementById('manual-download-btn');
  if (manualBtn) {
    const contentWrap = manualBtn.querySelector('.btn-content-wrap') || manualBtn;
    const btnText = manualBtn.querySelector('.btn-text');

    function animateTextSwap(newText, revertAfterMs = 1500) {
      if (!btnText) return;
      const originalText = 'Manual download';

      // Phase 1: Pop Out & Swap
      contentWrap.classList.remove('pop-swap');
      void contentWrap.offsetWidth; // force reflow
      contentWrap.classList.add('pop-swap');

      setTimeout(() => {
        btnText.textContent = newText;
      }, 140);

      // Phase 2: Revert back to original text with Pop Out & Swap
      if (revertAfterMs) {
        setTimeout(() => {
          contentWrap.classList.remove('pop-swap');
          void contentWrap.offsetWidth;
          contentWrap.classList.add('pop-swap');

          setTimeout(() => {
            btnText.textContent = originalText;
          }, 140);

          setTimeout(() => {
            contentWrap.classList.remove('pop-swap');
          }, 350);
        }, revertAfterMs);
      }
    }

    manualBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'captureFrame' }, (response) => {
            if (chrome.runtime.lastError) {
              animateTextSwap('silly ur outside YT X333');
            } else {
              animateTextSwap('Snapped :3');
            }
          });
        }
      });
    });
  }
});