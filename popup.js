// Enhanced Roblox Avatar Copier - Popup Script
// Modern ES2022+ features with improved error handling and performance

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Popup loading with enhanced features...');
  
  // Performance monitoring
  const performanceStart = performance.now();
  
  // Page elements references with null safety
  const elements = {
    profileIdInput: document.getElementById('profileId'),
    usernameDisplay: document.getElementById('username'),
    itemCountDisplay: document.getElementById('itemCount'),
    avatarImage: document.getElementById('avatarImage'),
    previewButton: document.getElementById('previewButton'),
    copyButton: document.getElementById('copyButton'),
    checkItemsButton: document.getElementById('checkItemsButton'),
    copyWithOwnedButton: document.getElementById('copyWithOwnedButton'),
    mainPanel: document.getElementById('mainPanel'),
    settingsPanel: document.getElementById('settingsPanel'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    contentWrapper: document.getElementById('contentWrapper'),
    avatarPageCheck: document.getElementById('avatarPageCheck'),
    status: document.getElementById('status'),
    pasteButton: document.getElementById('pasteButton'),
    languageSetting: document.getElementById('language'),
    settingsButton: document.getElementById('settingsButton'),
    backButton: document.getElementById('backButton'),
    autoPreviewSetting: document.getElementById('autoPreview'),
    confirmPurchaseSetting: document.getElementById('confirmPurchase'),
    batchSizeSetting: document.getElementById('batchSize'),
    goToAvatarPageButton: document.getElementById('goToAvatarPage'),
    missingItemsSection: document.getElementById('missingItemsSection'),
    missingItemsList: document.getElementById('missingItemsList'),
    missingItemCountContainer: document.getElementById('missingItemCount'),
    openAllItemsButton: document.getElementById('openAllItemsButton'),
    refreshMissingItemsButton: document.getElementById('refreshMissingItems'),
    // Robux Info Section Elements
    robuxInfoSection: document.getElementById('robuxInfoSection'),
    currentUserRobuxDisplay: document.getElementById('currentUserRobux'),
    missingItemsCostDisplay: document.getElementById('missingItemsCost'),
    remainingRobuxDisplay: document.getElementById('remainingRobux'),
    // Missing Items Count Display
    missingItemCountNumber: document.getElementById('missingItemCountNumber'),
    // Item Count Value Display
    itemCountValueDisplay: document.getElementById('itemCountValue'),
    // Özel kod sistemi elementleri
    secretCodeBtn: document.getElementById('applySecretCodeBtn'),
    secretCodeInput: document.getElementById('secretCodeInput'),
    secretCodeStatus: document.getElementById('secretCodeStatus')
  };

  // Global state management
  const state = {
    currentAvatarData: null,
    missingItems: [],
    ownedItems: [],
    isOnAvatarPage: false,
    lastUserInput: '',
    requestQueue: []
  };
  
  // Performance optimization: Debounced functions
  const debounce = (func, delay) => {
    let timeoutId;
    const debounced = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
    // Add a cancel method to the debounced function
    debounced.cancel = () => {
        clearTimeout(timeoutId);
    };
    return debounced;
  };
  
  // Enhanced settings management
  class SettingsManager {
    static async load() {
      try {
        const result = await chrome.storage.local.get([
          'autoPreview', 'confirmPurchase', 'batchSize',
          'lastProfileId', 'language', 'performanceStats'
        ]);
        
        // Apply settings with defaults and null checks
        if (elements.autoPreviewSetting) {
          elements.autoPreviewSetting.checked = result.autoPreview || false;
        }
        if (elements.confirmPurchaseSetting) {
          elements.confirmPurchaseSetting.checked = result.confirmPurchase !== false;
        }
        
        // Set dropdown values with null checks
        if (elements.batchSizeSetting && result.batchSize) {
          elements.batchSizeSetting.value = result.batchSize;
        }
        
        // Language settings with null checks
        if (elements.languageSetting && window.localization) {
          const targetLanguage = result.language && result.language !== 'auto' ? result.language : 'en';
          elements.languageSetting.value = targetLanguage;
        localization.setLanguage(targetLanguage);
        localization.updatePageTexts();
      }
      
        // Coffee notification with null checks
        if (typeof buyMeACoffeeNotification !== 'undefined' && buyMeACoffeeNotification.updateTexts) {
      buyMeACoffeeNotification.updateTexts();
        }
        
        // Restore last profile ID with null checks
        if (elements.profileIdInput && result.lastProfileId) {
          elements.profileIdInput.value = result.lastProfileId;
          console.log('Restored last profile ID:', result.lastProfileId);
          
          // Auto-preview if enabled and on avatar page
          if (result.autoPreview && state.isOnAvatarPage) {
            setTimeout(() => previewAvatar(), 1000);
          }
        }
        
        return result;
      } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Failed to load settings', 'error');
        return {};
      }
    }
    
    static async save() {
      try {
        const settings = {
          autoPreview: elements.autoPreviewSetting?.checked || false,
          confirmPurchase: elements.confirmPurchaseSetting?.checked !== false,
          batchSize: elements.batchSizeSetting?.value || '5',
          language: elements.languageSetting?.value || 'en',
          lastSaved: Date.now()
        };
        
        await chrome.storage.local.set(settings);
        console.log('Settings saved successfully');
      } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Failed to save settings', 'error');
      }
    }
  }
  
  // Enhanced page detection
  async function checkIfOnAvatarPage() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const currentUrl = tabs[0].url;
      state.isOnAvatarPage = currentUrl.includes('roblox.com/my/avatar');
      
      // Update UI based on page
      if (state.isOnAvatarPage) {
        elements.avatarPageCheck?.style.setProperty('display', 'none');
        elements.contentWrapper?.style.setProperty('display', 'block');
      } else {
        elements.avatarPageCheck?.style.setProperty('display', 'block');
        elements.contentWrapper?.style.setProperty('display', 'none');
      }
      
      // Auto-extract profile ID from URL
      const profileMatch = currentUrl.match(/\/users\/(\d+)/i);
      if (profileMatch && profileMatch[1] && elements.profileIdInput) {
        const userId = profileMatch[1];
        elements.profileIdInput.value = userId;
        
        // Auto-preview if enabled
        if (elements.autoPreviewSetting?.checked) {
          setTimeout(() => previewAvatar(), 500);
        }
      }
    } catch (error) {
      console.error('Error checking avatar page:', error);
    }
  }
  
  // Enhanced URL/ID extraction with better validation
  async function extractFromText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input text');
    }
    
    text = text.trim();
    
    try {
      // Direct ID check (numbers only)
      if (/^\d+$/.test(text) && text.length >= 5 && text.length <= 12) {
        return { type: 'id', value: text };
      }
      
      // URL patterns for Roblox profiles
      const urlPatterns = [
        /roblox\.com\/users\/(\d+)/i,
        /roblox\.com\/profile\/(\d+)/i,
        /ro\.blox\.com\/Robux\?id=(\d+)/i
      ];
      
      for (const pattern of urlPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return { type: 'url', value: match[1] };
        }
      }
      
      // Username check (alphanumeric with underscores, 3-20 chars)
      if (/^[a-zA-Z0-9_]{3,20}$/.test(text)) {
        return { type: 'username', value: text };
      }
      
      throw new Error('No valid Roblox profile URL, ID, or username found');
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }
  
  // Enhanced event listeners with error handling
  function setupEventListeners() {
    // Settings navigation
    elements.settingsButton?.addEventListener('click', () => {
      elements.mainPanel.style.display = 'none';
      elements.settingsPanel.style.display = 'block';
      SettingsManager.save();
    });
    
    elements.backButton?.addEventListener('click', () => {
      elements.settingsPanel.style.display = 'none';
      elements.mainPanel.style.display = 'block';
    });
    
    // Main actions
    elements.previewButton?.addEventListener('click', previewAvatar);
    elements.copyButton?.addEventListener('click', copyAvatar);
    elements.checkItemsButton?.addEventListener('click', checkItems);
    elements.copyWithOwnedButton?.addEventListener('click', copyWithOwnedItems);
    elements.goToAvatarPageButton?.addEventListener('click', navigateToAvatarPage);
    elements.openAllItemsButton?.addEventListener('click', openAllItemsInNewTab);
    elements.refreshMissingItemsButton?.addEventListener('click', checkItems);
    
    // Enhanced paste/extract button with multiple input methods
    elements.pasteButton?.addEventListener('click', async () => {
      try {
        const inputValue = elements.profileIdInput.value.trim();
        console.log('Processing input:', inputValue);
        
        // Method 1: Process existing input
        if (inputValue) {
          const result = await extractFromText(inputValue);
          if (result) {
            elements.profileIdInput.value = result.value;
            if (result.type === 'username') {
              showStatus(`Searching for username: ${result.value}`, 'info');
              const userId = await getUserIdByUsername(result.value);
              if (userId) {
                elements.profileIdInput.value = userId;
                showStatus(`Found user ID: ${userId}`, 'success');
              }
            }
            
            // Auto-preview if enabled
            if (elements.autoPreviewSetting?.checked) {
              setTimeout(() => previewAvatar(), 300);
        }
        return;
      }
        }
        
        // Method 2: Try clipboard
        const clipboardText = await navigator.clipboard.readText();
        console.log('Clipboard text:', clipboardText);
        
        const result = await extractFromText(clipboardText);
        if (result) {
          elements.profileIdInput.value = result.value;
          
          if (result.type === 'username') {
            showStatus(`Searching for username: ${result.value}`, 'info');
            const userId = await getUserIdByUsername(result.value);
            if (userId) {
              elements.profileIdInput.value = userId;
              showStatus(`Found user ID: ${userId}`, 'success');
      }
    } else {
            showStatus(`Extracted ${result.type}: ${result.value}`, 'success');
          }
          
          // Auto-preview if enabled
          if (elements.autoPreviewSetting?.checked) {
            setTimeout(() => previewAvatar(), 300);
          }
          }
        } catch (error) {
        console.error('Paste/extract error:', error);
        showStatus(`Error: ${error.message}`, 'error');
      }
    });
    
    // Profile ID input with debounced auto-preview
    const debouncedAutoPreview = debounce(() => {
      // Check if auto preview is enabled and input is not empty AND it's not the secret code again
      if (elements.autoPreviewSetting?.checked && 
          elements.profileIdInput.value.trim() && 
          state.lastUserInput.toLowerCase() !== 'robloxavatarcopiertiktok') { // Double check here
        previewAvatar();
      }
    }, 1500);
    
    elements.profileIdInput?.addEventListener('input', async (e) => {
      const value = e.target.value.trim();
      state.lastUserInput = value;

      // Save last input
      chrome.storage.local.set({ lastProfileId: value });

      // Auto-preview with debounce (TikTok kod kontrolü kaldırıldı)
      debouncedAutoPreview();
    });
    
    // Theme and settings changes
    elements.autoPreviewSetting?.addEventListener('change', SettingsManager.save);
    elements.confirmPurchaseSetting?.addEventListener('change', SettingsManager.save);
    elements.batchSizeSetting?.addEventListener('change', SettingsManager.save);
    
    // Özel kod sistemi event listener'ı
    const secretCodeBtn = document.getElementById('applySecretCodeBtn');
    const secretCodeInput = document.getElementById('secretCodeInput');
    const secretCodeStatus = document.getElementById('secretCodeStatus');
    
    // Placeholder'ı dil dosyasına göre ayarla
    if (secretCodeInput && window.localization) {
      secretCodeInput.placeholder = window.localization.getMessage('secretCodePlaceholder') || 'Enter special code...';
    }

    secretCodeBtn?.addEventListener('click', async () => {
      const code = secretCodeInput.value.trim();
      if (!code) {
        showSecretCodeStatus(window.localization.getMessage('secretCodeEnterCode'), 'error');
        return;
      }
      
      // Loading state
      secretCodeBtn.disabled = true;
      secretCodeBtn.innerHTML = `⏳ ${window.localization.getMessage('secretCodeChecking')}`;
      showSecretCodeStatus(window.localization.getMessage('secretCodeChecking'), 'info');
      
      try {
        // checkSecretCode fonksiyonunu çağır
        if (window.themeManager && typeof window.themeManager.checkSecretCode === 'function') {
          const result = await window.themeManager.checkSecretCode(code);
          
          if (result.success) {
            // Temanın adını lokalize et
            let themeDisplayName = result.themeId;
            if (window.localization && window.themeManager.themes[result.themeId] && window.themeManager.themes[result.themeId].nameKey) {
              themeDisplayName = window.localization.getMessage(window.themeManager.themes[result.themeId].nameKey) || result.themeId;
            }
            showSecretCodeStatus(window.localization.getMessage('secretCodeSuccess', {themeName: themeDisplayName}), 'success');
            secretCodeInput.value = ''; // Kodu temizle
          } else {
            showSecretCodeStatus(window.localization.getMessage('secretCodeInvalid'), 'error');
          }
    } else {
          showSecretCodeStatus(window.localization.getMessage('themeManagerNotFound'), 'error');
        }
      } catch (error) {
        console.error('Secret code error:', error);
        showSecretCodeStatus(window.localization.getMessage('secretCodeError'), 'error');
      } finally {
        // Reset button state
        secretCodeBtn.disabled = false;
        secretCodeBtn.innerHTML = `🚀 ${window.localization.getMessage('applySecretCodeButton') || 'Apply'}`;
      }
    });
    
    // Enter tuşu ile kod uygulama
    secretCodeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        secretCodeBtn.click();
      }
    });
    
    function showSecretCodeStatus(message, type) {
      secretCodeStatus.textContent = message;
      secretCodeStatus.style.display = 'block';
      secretCodeStatus.className = `secret-code-status ${type}`;
      
      // Renk ayarları
      switch(type) {
        case 'success':
          secretCodeStatus.style.color = 'var(--success)';
          break;
        case 'error':
          secretCodeStatus.style.color = 'var(--error)';
          break;
        case 'info':
          secretCodeStatus.style.color = 'var(--info)';
          break;
      }
      
      // 5 saniye sonra durumu gizle (error ve info için)
      if (type !== 'success') {
        setTimeout(() => {
          secretCodeStatus.style.display = 'none';
        }, 5000);
      }
    }
    
    elements.languageSetting?.addEventListener('change', function() {
    const selectedLanguage = this.value;
    localization.setLanguage(selectedLanguage);
    localization.updatePageTexts();
    
      // ThemeManager ve diğer bileşenlerin güncellenmesi için olayı tetikle
      // Bu, localization.updatePageTexts() çağrısından sonra olmalı
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { newLanguage: selectedLanguage }
      }));
      
      if (typeof buyMeACoffeeNotification !== 'undefined' && buyMeACoffeeNotification.updateTexts) {
        buyMeACoffeeNotification.updateTexts();
      }
      
      SettingsManager.save();
    });
  }
  
  // Navigate to avatar page
  function navigateToAvatarPage() {
    chrome.tabs.create({
      url: 'https://www.roblox.com/my/avatar',
      active: true // Yeni sekme aktif olarak açılır
    });
  }
  
  // Enhanced preview avatar function
  async function previewAvatar() {
    const inputValue = elements.profileIdInput.value.trim();
    if (!inputValue) {
      showStatus('enterValidId', 'error');
      return;
    }
    
      showLoading(true);
    resetUI();
    
    try {
      let userId = inputValue;
      
      // Validate and process input
      const extractResult = await extractFromText(inputValue);
      if (extractResult.type === 'username') {
        showStatus('searchingUsername', 'info');
        const foundUserId = await getUserIdByUsername(extractResult.value);
        if (!foundUserId) {
          showStatus('usernameNotFound', 'error');
          showLoading(false);
          return;
        }
        userId = foundUserId;
      } else {
        userId = extractResult.value;
      }
      
      // Update input with final user ID
      elements.profileIdInput.value = userId;
      
      // Save profile ID
      chrome.storage.local.set({ lastProfileId: userId });
      showStatus('idSaved', 'success');
      
      if (!state.isOnAvatarPage) {
      showStatus('notOnAvatarPage', 'error');
        showLoading(false);
      return;
    }
    
      // Fetch avatar data
      const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
          { action: 'getAvatarDetails', userId: userId },
          resolve
        );
      });
          
          if (response && response.success) {
            const data = response.data;
            
            // Update UI with user data - Always show the unique username prefixed with @
            const uniqueUsername = data.userData.name; // This is the unique username like 'lollol12398f'
            const displayNameToShow = '@' + uniqueUsername;
            elements.usernameDisplay.textContent = displayNameToShow;
            
            // Save avatar data
            state.currentAvatarData = data.avatarData;
            const itemCount = data.avatarData.assets.length;
            elements.itemCountValueDisplay.textContent = itemCount;
            
            // Load avatar thumbnail
            try {
              const thumbnailUrl = await fetchAvatarThumbnail(userId);
              if (thumbnailUrl) {
                elements.avatarImage.src = thumbnailUrl;
              } else {
                // Fallback to direct Roblox URL
                elements.avatarImage.src = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
              }
            } catch (thumbnailError) {
              console.error('Avatar thumbnail error:', thumbnailError);
              elements.avatarImage.src = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
            }
            
            // Enable action buttons
            elements.copyButton.disabled = false;
            elements.checkItemsButton.disabled = false;
            
            showStatus('previewSuccess', 'success');
            
            // Auto-check items if enabled
            if (elements.autoPreviewSetting?.checked) {
              setTimeout(checkItems, 500);
            }
          } else {
            showStatus('Hata: ' + (response ? response.error : 'Bilinmeyen hata'), 'error');
          }
    } catch (error) {
      console.error('Error in preview:', error);
      showStatus('errorOccurred', 'error', {message: error.message});
    } finally {
      showLoading(false);
    }
  }
  
  // Enhanced copy avatar function
  async function copyAvatar() {
    if (!state.currentAvatarData) {
      showStatus('previewFirst', 'error');
      return;
    }
    
    showLoading(true);
    
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'applyAvatarChanges', avatarData: state.currentAvatarData },
          resolve
        );
      });
      
      if (response && response.success) {
        showStatus('avatarCopySuccess', 'success');
        elements.missingItemsSection.style.display = 'none';
      } else {
        showStatus('Hata: ' + response.error, 'error');
        
        // Auto-check missing items if copy failed
        if (response.error && response.error.includes('sahip değilsiniz')) {
          setTimeout(checkItems, 1000);
        }
      }
    } catch (error) {
      console.error('Error in copy:', error);
      showStatus('errorOccurred', 'error', {message: error.message});
    } finally {
      showLoading(false);
    }
  }
  
  // Enhanced copy with owned items function
  async function copyWithOwnedItems() {
    if (!state.currentAvatarData || state.ownedItems.length === 0) {
      showStatus('noItemData', 'error');
      return;
    }
    
    showLoading(true);
    
    try {
      // Create filtered avatar data with only owned items
      const filteredAvatarData = {...state.currentAvatarData};
      filteredAvatarData.assets = state.ownedItems.map(item => ({
        id: item.id,
        assetType: item.assetType
      }));
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'applyAvatarChanges', avatarData: filteredAvatarData },
          resolve
        );
      });
      
      if (response && response.success) {
        showStatus('avatarCopyWithOwned', 'success');
        } else {
        showStatus('Hata: ' + (response ? response.error : 'Bilinmeyen hata'), 'error');
      }
    } catch (error) {
      console.error('Error in copy with owned items:', error);
      showStatus('errorOccurred', 'error', {message: error.message});
    } finally {
      showLoading(false);
    }
  }
  
  // Tüm eksik eşyaları yeni sekmede aç
  function openAllItemsInNewTab() {
    if (state.missingItems.length === 0) {
      showStatus('noMissingItems', 'error');
      return;
    }
    
    // Her eşya için bir sekme aç ve kullanıcıya bilgi ver
    const itemCount = state.missingItems.length;
    if (itemCount > 5) {
      const confirmMessage = localization.getMessage('confirmOpenTabs', {count: itemCount});
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    
    state.missingItems.forEach(item => {
      chrome.tabs.create({
        url: `https://www.roblox.com/catalog/${item.id}`,
        active: false
      });
    });
    
    showStatus('tabsOpened', 'success', {count: itemCount});
  }
  
  // Check items function
  async function checkItems() {
    if (!state.currentAvatarData) {
      showStatus('previewFirst', 'error');
      return;
    }
    
    showLoading(true);
    elements.missingItemsList.innerHTML = '';
    elements.missingItemsSection.style.display = 'none';
    
    try {
      console.log('Eşya kontrolü başlatılıyor:', state.currentAvatarData);
      
      // Eşya kontrol ayarlarını güncelle
      state.currentAvatarData.batchSize = parseInt(elements.batchSizeSetting.value) || 5;
      
      // Son kullanıcı ID'sini kaydet
      if (elements.profileIdInput && elements.profileIdInput.value) {
        chrome.storage.local.set({ 'lastProfileId': elements.profileIdInput.value });
      }
      
      showStatus('checkingItems', 'info');
      
      // Background script'e mesaj gönder
      chrome.runtime.sendMessage(
        { 
          action: 'checkOwnedItems', 
          avatarData: state.currentAvatarData 
        }, 
        function(response) {
          showLoading(false);
          console.log('Eşya kontrolü yanıtı:', response);
          
          if (response && response.success) {
            const resultData = response.data;
            processItemResults(resultData);
          } else {
            showStatus('errorGeneric', 'error', {message: (response && response.error ? response.error : localization.getMessage('unknownError'))});
          }
        }
      );
    } catch (error) {
      console.error('Error checking items:', error);
      showStatus('errorOccurred', 'error', {message: error.message});
      showLoading(false);
    }
  }
  
  // Yanıt işleme fonksiyonu (kod tekrarını azaltır)
  function processItemResults(resultData) {
    const totalItems = resultData.totalItems || 0;
    const ownedCount = resultData.ownedCount || 0;
    const missingCount = resultData.missingCount || 0;
    
    // Eksik eşyaları ve sahip olunan eşyaları kaydet
    state.missingItems = resultData.missingItems || [];
    state.ownedItems = resultData.ownedItems || [];
    
    console.log(`Toplam ${totalItems} eşya, ${ownedCount} tanesi mevcut, ${missingCount} tanesi eksik.`);
    
    // Update UI - Doğru DOM referanslarını kullan
    // Önceki missingItemCountSpan ve missingItemCountElem yerine güncellenmiş seçicileri kullan
    elements.itemCountValueDisplay.textContent = totalItems;
    elements.missingItemCountContainer.style.display = 'block';
    
    // Missing items sayısını güncelle
    if (elements.missingItemCountNumber) {
      elements.missingItemCountNumber.textContent = missingCount;
    }
    
    if (missingCount > 0) {
      displayMissingItems(state.missingItems);
      elements.missingItemsSection.style.display = 'block';
      elements.copyWithOwnedButton.style.display = 'block';
      elements.openAllItemsButton.style.display = 'block';
      showStatus('missingItemsCount', 'error', {count: missingCount});
    } else {
      showStatus('allItemsOwned', 'success');
      elements.copyWithOwnedButton.style.display = 'none';
      elements.openAllItemsButton.style.display = 'none';
      elements.missingItemsSection.style.display = 'none';
    }

    // Fetch and display Robux info after processing items
    fetchAndDisplayRobuxInfo();
  }
  
  // Display missing items in UI
  function displayMissingItems(items) {
    elements.missingItemsList.innerHTML = '';
    
    items.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = 'item-card';
      
      // Item image
      const itemImage = document.createElement('img');
      itemImage.className = 'item-image';
      itemImage.alt = item.name;
      
      // Add loading state to container
      const imageContainer = document.createElement('div');
      imageContainer.className = 'item-image loading';
      
      // Enhanced image loading with fallback
      const setImageSrc = (src) => {
        if (src && src.trim() && !src.includes('undefined')) {
          itemImage.src = src;
        } else {
          // Use default image if no thumbnail
          itemImage.src = 'images/default-avatar.png';
        }
      };
      
      // Add error handler for failed image loads
      itemImage.addEventListener('error', () => {
        console.warn(`Failed to load thumbnail for item ${item.id}, using default`);
        itemImage.className = 'error';
        imageContainer.className = 'item-image loaded';
        itemImage.src = 'images/default-avatar.png';
      });
      
      // Add loading handler
      itemImage.addEventListener('load', () => {
        console.log(`Successfully loaded thumbnail for item ${item.id}`);
        itemImage.className = 'loaded';
        imageContainer.className = 'item-image loaded';
      });
      
      // Set initial image source
      setImageSrc(item.thumbnail);
      
      // Append image to container
      imageContainer.appendChild(itemImage);
      
      // If thumbnail failed and we have item ID, try alternative thumbnail URLs
      if (!item.thumbnail || item.thumbnail.includes('placeholder')) {
        console.log(`Trying alternative thumbnail for item ${item.id}`);
        
        // Use background script to fetch thumbnail (to avoid CORS)
        chrome.runtime.sendMessage({
          action: 'getThumbnail',
          assetId: item.id
        }, (response) => {
          if (response && response.success && response.thumbnailUrl) {
            setImageSrc(response.thumbnailUrl);
            console.log(`✅ Got fallback thumbnail for item ${item.id}`);
          } else {
            console.warn(`Fallback thumbnail failed for item ${item.id}`);
          }
        });
      }
      
      // Item name
      const itemName = document.createElement('div');
      itemName.className = 'item-name';
      itemName.textContent = item.name;
      itemName.title = item.name; // For tooltip on hover
      
      // Item price
      const itemPrice = document.createElement('div');
      itemPrice.className = 'item-price';
      itemPrice.textContent = item.price;
      
      // Buy button - Çeviri desteği ekliyoruz
      const buyButton = document.createElement('button');
      buyButton.className = 'item-buy';
      // 'buyButton' anahtarını locale.js'ye ekleyelim ve doğrudan çevirisini kullanalım
      buyButton.textContent = localization.getMessage('buyButton');
      buyButton.dataset.itemId = item.id; // Store item ID for reference
      
      // Satın al butonu için click event listener
      buyButton.addEventListener('click', function(event) {
        event.preventDefault();
        const itemId = this.dataset.itemId;
        
        // Onay istemeden direkt olarak eşyayı açalım
        openItemInNewTab(itemId);
      });
      
      // Add elements to card
      itemCard.appendChild(imageContainer);
      itemCard.appendChild(itemName);
      itemCard.appendChild(itemPrice);
      itemCard.appendChild(buyButton);
      
      // Add card to list
      elements.missingItemsList.appendChild(itemCard);
    });
  }
  
  // Eşyayı yeni sekmede aç
  function openItemInNewTab(itemId) {
    chrome.tabs.create({
      url: `https://www.roblox.com/catalog/${itemId}`,
      active: false // Arka planda aç, eklentiyi kapatma
    });
  }
  
  // Helper functions
  async function fetchUserInfo(userId) {
    try {
      const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
  
  async function fetchAvatarData(userId) {
    try {
      const response = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching avatar data:', error);
      return null;
    }
  }
  
  async function fetchAvatarThumbnail(userId) {
    try {
      const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Error fetching avatar thumbnail:', error);
      return null;
    }
  }
  
  // Kullanıcı adından ID'ıyi çözen gelişmiş fonksiyon
  async function getUserIdByUsername(username) {
    try {
      // @ işaretini temizle (eğer varsa)
      let cleanUsername = username;
      if (cleanUsername.startsWith('@')) {
        cleanUsername = cleanUsername.substring(1);
      }
      
      console.log('Temizlenmiş kullanıcı adı ile arama yapılıyor:', cleanUsername);
      
      // Yöntem 1: Standart arama API'si
      const searchResponse = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(cleanUsername)}&limit=10`);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Kullanıcı arama sonuçları (Yöntem 1):', searchData);
        
        // Eşleşen kullanıcı var mı kontrol et
        if (searchData.data && searchData.data.length > 0) {
          // Tam eşleşme arıyoruz
          const exactMatch = searchData.data.find(user => 
            user.name.toLowerCase() === cleanUsername.toLowerCase() || 
            user.displayName.toLowerCase() === cleanUsername.toLowerCase()
          );
          
          if (exactMatch) {
            console.log('Tam eşleşme bulundu:', exactMatch.name, exactMatch.id);
            return exactMatch.id;
          }
          
          // Tam eşleşme yoksa ilk sonucu döndür
          console.log('Yakın eşleşme kullanılıyor:', searchData.data[0].name, searchData.data[0].id);
          return searchData.data[0].id;
        }
      }
      
      // Yöntem 2: Username-to-ID API'si (alternatif)
      try {
        console.log('Alternatif API kullanılıyor...');
        const usernameResponse = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(cleanUsername)}`);
        
        if (usernameResponse.ok) {
          const userData = await usernameResponse.json();
          console.log('Kullanıcı arama sonuçları (Yöntem 2):', userData);
          
          if (userData && userData.Id) {
            return userData.Id.toString();
          } else if (userData && userData.id) {
            return userData.id.toString();
          }
        }
      } catch (altError) {
        console.error('Alternatif API hatası:', altError);
        // Bu hata önemli değil, devam ediyoruz
      }
      
      console.log('Kullanıcı bulunamadı:', cleanUsername);
      return null;
    } catch (error) {
      console.error('Kullanıcı adı arama hatası:', error);
      return null;
    }
  }
  
  function showStatus(message, type, replacements = {}) {
    // Çeviriyi kontrol et - eğer bir çeviri anahtarı ise çevirisini göster
    let displayMessage = message;
    
    if (localization && localization.translations && localization.currentLanguage && localization.translations[localization.currentLanguage] && localization.translations[localization.currentLanguage][message]) {
      displayMessage = localization.getMessage(message, replacements);
    } else if (localization && localization.translations && localization.translations["en"] && localization.translations["en"][message]) {
      // Geçerli dilde çeviri yoksa İngilizce'yi dene
       displayMessage = localization.getMessage(message, replacements);
    } else {
      // Hiçbir çeviri bulunamazsa mesaj anahtarını göster ve konsola uyarı yazdır
      console.warn(`Çeviri anahtarı bulunamadı: ${message}`);
      displayMessage = message;
    }

    elements.status.textContent = displayMessage;
    elements.status.className = 'status ' + type;
    elements.status.style.display = 'block';
    
    // Make status clickable to close
    elements.status.style.cursor = 'pointer';
    elements.status.title = 'Kapatmak için tıklayın';
    
    // Add click listener to close manually
    const closeHandler = () => {
      elements.status.style.display = 'none';
      elements.status.removeEventListener('click', closeHandler);
    };
    elements.status.addEventListener('click', closeHandler);
    
    // Auto-hide with longer delays based on message type and importance
    const hideDelays = {
      'success': type === 'success' && (message === 'allItemsOwned' || displayMessage.includes('sahipsiniz') || displayMessage.includes('own all items')) ? 15000 : 8000, // Important success messages stay 15 seconds, others 8 seconds
      'info': 6000,
      'warning': 10000,
      'error': 12000 // Errors stay longer so user can read
    };
    
    const delay = hideDelays[type] || 5000;
    
      setTimeout(() => {
      if (elements.status.style.display !== 'none') {
        elements.status.style.display = 'none';
        elements.status.removeEventListener('click', closeHandler);
    }
    }, delay);
  }
  
  function showLoading(show) {
    elements.loadingSpinner.style.display = show ? 'flex' : 'none';
  }
  
  function resetUI() {
    elements.avatarImage.src = 'images/default-avatar.png';
    // Doğru değişken isimlerini kullanarak içeriği güncelle
    elements.usernameDisplay.textContent = '-';
    elements.itemCountValueDisplay.textContent = '-';
    elements.status.style.display = 'none';
    elements.copyButton.disabled = true;
    elements.checkItemsButton.disabled = true;
    
    // Eksik eşyalar alanını gizle ve reset et
    elements.missingItemCountContainer.style.display = 'none';
    if (elements.missingItemCountNumber) {
      elements.missingItemCountNumber.textContent = '-';
    }
    
    elements.missingItemsSection.style.display = 'none';
    state.missingItems = [];
    state.ownedItems = [];

    // Hide Robux info section
    if (elements.robuxInfoSection) {
      elements.robuxInfoSection.style.display = 'none';
    }
    
    // Çevirilerin doğru gösterilmesini sağlayalım
    if (window.localization) {
      localization.updatePageTexts();
    }
  }
  
  // Buy Me a Coffee bildirimi sistemi
  const buyMeACoffeeNotification = {
    lastShown: 0,
    interval: 30 * 60 * 1000, // 30 dakika (milisaniye cinsinden)
    
    init: function() {
      try {
      // DOM elemanlarını al
      this.notification = document.getElementById('buyMeACoffee');
        
        if (!this.notification) {
          console.warn('Coffee notification element not found');
          return;
        }
      
      // Bildirim metinlerini güncelle
      this.updateTexts();
      
      // Popup açıldığında çeviriyi uygula
        if (window.localization && localization.updatePageTexts) {
      localization.updatePageTexts();
        }

      // En son gösterme zamanını kontrol et
      chrome.storage.local.get(['lastCoffeeNotification'], (result) => {
        if (result.lastCoffeeNotification) {
          this.lastShown = result.lastCoffeeNotification;
        }
        
        // Başlangıç kontrollerini yap
        this.checkAndShow();
      });
      
      // Düğme event listenerları
      const closeButton = this.notification.querySelector('#closeCoffeeBtn');
      const coffeeButton = this.notification.querySelector('.coffee-button');

      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideNotification();
        });
      }

      if (coffeeButton) {
        coffeeButton.addEventListener('click', (event) => {
          event.preventDefault(); // Varsayılan link açma davranışını durdur
          this.hideNotification();
          window.open('https://buymeacoffee.com/mtktalha', '_blank');
        });
        }
      } catch (error) {
        console.error('Coffee notification init failed:', error);
      }
    },
    
    // Bildirim metinlerini lokalizasyona göre güncelle
    updateTexts: function() {
      try {
        if (!this.notification) return;
        
        // Coffee notification başlığını güncelle
        const titleElement = this.notification.querySelector('h3');
        if (titleElement) {
          titleElement.textContent = localization.getMessage('coffeeNotificationTitle');
        }
        
        // Coffee text güncelle
        const coffeeTextP = this.notification.querySelector('.coffee-text p');
        if (coffeeTextP) {
          coffeeTextP.textContent = localization.getMessage('coffeeNotificationText');
        }
        
        // Coffee button text'ini güncelle
        const coffeeButton = this.notification.querySelector('.coffee-button');
        if (coffeeButton) {
          coffeeButton.textContent = localization.getMessage('coffeeNotificationButton');
        }
        
        // Close button güncelle
        const closeButton = this.notification.querySelector('#closeCoffeeBtn');
        if (closeButton) {
          closeButton.textContent = localization.getMessage('coffeeNotificationClose');
        }
      } catch (error) {
        console.error('Error updating coffee notification texts:', error);
      }
    },

    checkAndShow: function() {
      const now = Date.now();
      const timeSinceLastShow = now - this.lastShown;
      
      // 30 dakikadan fazla zaman geçmişse bildirimi göster
      if (timeSinceLastShow >= this.interval) {
        setTimeout(() => {
          this.showNotification();
        }, 3000); // 3 saniye gecikmeyle göster (kullanıcı deneyimini iyileştirmek için)
      }
      
      // Periyodik kontrol için zamanlayıcı ayarla
      setTimeout(() => {
        this.checkAndShow();
      }, 60000); // Her dakika kontrol et
    },
    
    showNotification: function() {
      if (this.notification) {
        this.notification.style.display = 'block';
        this.lastShown = Date.now();
        
        // Son gösterim zamanını kaydet
        chrome.storage.local.set({ 'lastCoffeeNotification': this.lastShown });
      }
    },
    
    hideNotification: function() {
      if (this.notification) {
        this.notification.style.display = 'none';
      }
    }
  };
  
  // Buy Me a Coffee sistemini başlat
  buyMeACoffeeNotification.init();

  // --- Robux Info Feature Functions ---
  async function fetchAndDisplayRobuxInfo() {
    try {
      console.log('Fetching Robux info...');
      
      // Show loading state
      elements.currentUserRobuxDisplay.textContent = 'Loading...';
      elements.missingItemsCostDisplay.textContent = 'Calculating...';
      elements.remainingRobuxDisplay.textContent = 'Calculating...';
      elements.robuxInfoSection.style.display = 'block';
      
      // Get current user's Robux balance
      const response = await chrome.runtime.sendMessage({
        action: 'getCurrentUserRobux'
      });
      
      if (!response.success) {
        console.error('Failed to get Robux balance:', response.error);
        
        // Hide the section if we can't get Robux info
        elements.robuxInfoSection.style.display = 'none';
        
        // Show a subtle warning to user
        if (response.error.includes('log in')) {
          showStatus('Robux balance requires login to Roblox website', 'warning');
        } else {
          console.warn('Robux balance unavailable:', response.error);
        }
        return;
      }
      
      const currentRobux = response.data;
      console.log('Current Robux balance:', currentRobux);
      
      // Calculate missing items cost
      let totalCost = 0;
      if (state.missingItems && state.missingItems.length > 0) {
        totalCost = state.missingItems.reduce((sum, item) => {
          return sum + (item.price || 0);
        }, 0);
      }
      
      // Calculate remaining Robux
      const remainingRobux = currentRobux - totalCost;
      
      // Update display
      elements.currentUserRobuxDisplay.textContent = currentRobux.toLocaleString();
      elements.missingItemsCostDisplay.textContent = totalCost.toLocaleString();
      elements.remainingRobuxDisplay.textContent = remainingRobux.toLocaleString();
      
      // Update styling based on affordability
      if (remainingRobux < 0) {
        elements.remainingRobuxDisplay.style.color = 'var(--error-color)';
        elements.remainingRobuxDisplay.title = 'Insufficient Robux';
      } else if (remainingRobux < currentRobux * 0.1) { // Less than 10% remaining
        elements.remainingRobuxDisplay.style.color = 'var(--warning-color)';
        elements.remainingRobuxDisplay.title = 'Low Robux remaining';
      } else {
        elements.remainingRobuxDisplay.style.color = 'var(--success-color)';
        elements.remainingRobuxDisplay.title = 'Sufficient Robux';
      }
      
      console.log(`Robux info updated: ${currentRobux} - ${totalCost} = ${remainingRobux}`);
      
    } catch (error) {
      console.error('Error fetching Robux info:', error);
      
      // Hide the section on error
      elements.robuxInfoSection.style.display = 'none';
    }
  }
  // --- End Robux Info Feature ---

  // Initialize the popup
  async function initialize() {
    console.log('Initializing popup...');
    
    try {
      // Load settings first with error handling
      try {
        await SettingsManager.load();
      } catch (settingsError) {
        console.error('Settings loading failed:', settingsError);
        showStatus('Settings loading failed, using defaults', 'warning');
      }
      
      // Check if on avatar page with error handling
      try {
        await checkIfOnAvatarPage();
      } catch (pageError) {
        console.error('Page check failed:', pageError);
      }
      
      // Setup event listeners with error handling
      try {
        setupEventListeners();
      } catch (listenerError) {
        console.error('Event listener setup failed:', listenerError);
      }
      
      // Performance measurement
      const loadTime = performance.now() - performanceStart;
      console.log(`Popup loaded in ${loadTime.toFixed(2)}ms`);
      
      // Save performance stats with error handling
      try {
        chrome.storage.local.set({
          performanceStats: {
            lastLoadTime: loadTime,
            timestamp: Date.now()
          }
        });
      } catch (storageError) {
        console.error('Performance stats save failed:', storageError);
      }
      
    } catch (error) {
      console.error('Initialization error:', error);
      showStatus('Failed to initialize extension', 'error');
    }
  }
  
  // Start initialization
  initialize();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      console.log('Popup received message:', message);
      
      if (message.action === 'notifyPopup') {
        if (message.type === 'autoRedrawResult') {
          const data = message.data;
          
          // 'refreshManually' mesajını gösterme
          if (data.message === 'refreshManually') {
            console.log("Skipping 'refreshManually' notification as requested.");
          } else if (data.success) {
            showStatus(data.message, 'success');
          } else {
            showStatus(data.message, 'warning');
          }
        }
        
        sendResponse({ success: true });
        return;
      }
      
      sendResponse({ success: false, error: 'Unknown action' });
    } catch (error) {
      console.error('Error handling popup message:', error);
      sendResponse({ success: false, error: error.message });
    }
  });
});
