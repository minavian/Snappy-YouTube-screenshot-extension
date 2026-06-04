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
        trigger.textContent = option.textContent;
        
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
      }
      
      if (selectedOption) {
        options.forEach(opt => opt.classList.remove('selected'));
        selectedOption.classList.add('selected');
        trigger.textContent = selectedOption.textContent;
      }
    });
  }

  // Setup both dropdown components
  setupCustomSelect(formatSelect, 'format', 'image/jpeg');
  setupCustomSelect(resSelect, 'resolution', 'native');

  // Close all open dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach((el) => {
      el.classList.remove('open');
    });
  });
});