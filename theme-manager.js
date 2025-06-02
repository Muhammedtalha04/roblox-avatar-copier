// Theme Manager for Roblox Avatar Copier
// Premium Theme System with Purchase Integration

class ThemeManager {
  constructor() {
    this.themes = {
      // Free themes
      'default': { nameKey: 'themeDefaultName', price: 0, free: true },
      'dark': { nameKey: 'themeDarkName', price: 0, free: true },
      
      // Premium themes - Only available in bundle for $3
      'cyberpunk': { nameKey: 'themeCyberpunk', descriptionKey: 'themeDescriptionCyberpunk', premium: true },
      'neon': { nameKey: 'themeNeon', descriptionKey: 'themeDescriptionNeon', premium: true },
      'galaxy': { nameKey: 'themeGalaxy', descriptionKey: 'themeDescriptionGalaxy', premium: true },
      'sunset': { nameKey: 'themeSunset', descriptionKey: 'themeDescriptionSunset', premium: true },
      'ocean': { nameKey: 'themeOcean', descriptionKey: 'themeDescriptionOcean', premium: true },
      'forest': { nameKey: 'themeForest', descriptionKey: 'themeDescriptionForest', premium: true },
      'love': { nameKey: 'themeLove', descriptionKey: 'themeDescriptionLove', premium: true },
      'fire': { nameKey: 'themeFire', descriptionKey: 'themeDescriptionFire', premium: true },
      'ice': { nameKey: 'themeIce', descriptionKey: 'themeDescriptionIce', premium: true },
      'aurora': { nameKey: 'themeAurora', descriptionKey: 'themeDescriptionAurora', premium: true },
      'numacher': { nameKey: 'themeNumacher', descriptionKey: 'themeDescriptionNumacher', premium: false, hidden: true, isYouTuberTheme: true } // YouTuber theme
    };
    
    this.currentTheme = 'default';
    this.purchasedThemes = ['default', 'dark']; // Start with free themes
    this.allThemesPrice = 3; // Bundle price for all premium themes
    this.isInitialized = false;
  }
  
  async init() {
    try {
      // Load purchased themes, current theme, and activated license from storage
      const data = await chrome.storage.local.get(['purchasedThemes', 'currentTheme', 'activatedLicense']);
      
      // Load purchased themes
      if (data.purchasedThemes && Array.isArray(data.purchasedThemes)) {
        this.purchasedThemes = data.purchasedThemes;
      }
      
      // Check if there's an activated license
      if (data.activatedLicense) {
        console.log('Found activated license:', data.activatedLicense);
        // Ensure all premium themes are unlocked
        const premiumThemes = Object.keys(this.themes).filter(id => this.themes[id].premium);
        premiumThemes.forEach(themeId => {
          if (!this.purchasedThemes.includes(themeId)) {
            this.purchasedThemes.push(themeId);
          }
        });
        
        // Save updated purchased themes
        await chrome.storage.local.set({ purchasedThemes: this.purchasedThemes });
      }
      
      // Load current theme
      if (data.currentTheme) {
        this.currentTheme = data.currentTheme;
      }
      
      // Security: Validate current theme ownership
      if (!this.isThemeOwned(this.currentTheme)) {
        console.warn('🚫 Security: Current theme not owned, reverting to default');
        this.currentTheme = 'default';
        await chrome.storage.local.set({ currentTheme: this.currentTheme });
      }
      
      // Apply the theme and set up the UI
      this.applyTheme(this.currentTheme);
      this.setupThemeSelector();
      
      // License status logging
      if (data.activatedLicense) {
        console.log('License status: Activated');
      } else {
        console.log('License status: Not activated (demo mode)');
      }
      
      this.isInitialized = true;
      
      console.log('ThemeManager initialized successfully');
      console.log('Current theme:', this.currentTheme);
      console.log('Purchased themes:', this.purchasedThemes);
    } catch (error) {
      console.error('ThemeManager initialization error:', error);
      // Fallback to defaults
      this.currentTheme = 'default';
      this.purchasedThemes = ['default', 'dark'];
      this.applyTheme(this.currentTheme);
      this.setupThemeSelector();
      this.isInitialized = true;
    }
  }
  
  setupThemeSelector() {
    const themeContainer = document.getElementById('themeSelector');
    if (!themeContainer) return;
    
    themeContainer.innerHTML = '';
    
    // Create theme grid
    const themeGrid = document.createElement('div');
    themeGrid.className = 'theme-selector';
    
    Object.entries(this.themes).forEach(([themeId, theme]) => {
      // Gizli temaları ve YouTuber temalarını normal listelemede gösterme
      if (theme.hidden || theme.isYouTuberTheme) {
        // ANCAK, eğer tema unlock edilmişse (satın alınmışsa), o zaman göster
        if (!this.isThemeOwned(themeId)) {
          return; // Unlock edilmemiş gizli temalar gösterilmez
        }
        // Unlock edilmiş gizli temalar aşağıdaki normal akışla devam eder
      }
      const themeOption = this.createThemeOption(themeId, theme);
      themeGrid.appendChild(themeOption);
    });
    
    // Add "Buy All Themes" button
    const buyAllButton = this.createBuyAllButton();
    
    themeContainer.appendChild(themeGrid);
    themeContainer.appendChild(buyAllButton);
  }
  
  createThemeOption(themeId, theme) {
    const themeOption = document.createElement('div');
    themeOption.className = 'theme-option';
    
    const isOwned = this.isThemeOwned(themeId);
    const isSelected = this.currentTheme === themeId;
    const isPremium = theme.premium || false;
    
    if (!isOwned) {
      themeOption.classList.add('locked');
    }
    
    if (isSelected) {
      themeOption.classList.add('selected');
    }
    
    // Theme preview
    const preview = document.createElement('div');
    preview.className = `theme-preview ${themeId}`;
    
    // Theme name
    const name = document.createElement('div');
    name.className = 'theme-name';
    let localizedThemeName = window.localization.getMessage(theme.nameKey);
    // Fallback to a title-cased version of the themeId if localization fails or returns the key itself
    if (!localizedThemeName || localizedThemeName === theme.nameKey) {
        localizedThemeName = themeId.charAt(0).toUpperCase() + themeId.slice(1).toLowerCase();
    }
    name.textContent = localizedThemeName;
    
    // Theme status
    const status = document.createElement('div');
    status.className = 'theme-price';
    
    if (theme.free || isOwned) {
      let statusKey = theme.free ? 'themeStatusFree' : (isSelected ? 'themeStatusActive' : 'themeStatusOwned');
      status.textContent = window.localization.getMessage(statusKey);
    } else if (isPremium) {
      status.textContent = window.localization.getMessage('themeStatusPremium');
      status.style.color = 'var(--warning)';
    }
    
    themeOption.appendChild(preview);
    themeOption.appendChild(name);
    themeOption.appendChild(status);
    
    // Click handler
    themeOption.addEventListener('click', () => {
      if (isOwned) {
        this.selectTheme(themeId);
      } else if (isPremium) {
        this.showPremiumRequiredDialog(themeId, theme);
      }
    });
    
    return themeOption;
  }
  
  createBuyAllButton() {
    const container = document.createElement('div');
    container.style.cssText = 'text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);';
    
    // Check if user already owns all premium themes
    const premiumThemes = Object.keys(this.themes).filter(id => this.themes[id].premium);
    const ownedPremiumThemes = premiumThemes.filter(id => this.isThemeOwned(id));
    
    if (ownedPremiumThemes.length === premiumThemes.length) {
      container.innerHTML = `
        <div style="color: var(--success); font-weight: 600; font-size: 0.9rem;">
          🎉 ${window.localization.getMessage('ownPremiumBundleMessage')}
        </div>
        <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">
          ${window.localization.getMessage('activatedWithGumroadLicense')}
        </div>
      `;
      return container;
    }
    
    const remainingThemes = premiumThemes.length - ownedPremiumThemes.length;
    
    const buyAllButton = document.createElement('button');
    buyAllButton.className = 'button primary';
    buyAllButton.style.cssText = 'min-width: 200px; background: linear-gradient(45deg, #ff6b35, #f7931e); font-size: 0.9rem; font-weight: 600;';
    buyAllButton.innerHTML = `
      🎨 ${window.localization.getMessage('premiumBundleButtonText')}<br>
      <small style="opacity: 0.9;">$2.50+ (${remainingThemes} ${window.localization.getMessage('themesCountSuffix')})</small>
    `;
    
    buyAllButton.addEventListener('click', () => {
      this.showBuyAllDialog();
    });
    
    container.appendChild(buyAllButton);
    return container;
  }
  
  async selectTheme(themeId) {
    if (!this.isThemeOwned(themeId)) {
      let localizedThemeNameToBuy = window.localization.getMessage(this.themes[themeId].nameKey);
      if (!localizedThemeNameToBuy || localizedThemeNameToBuy === this.themes[themeId].nameKey) {
        localizedThemeNameToBuy = themeId.charAt(0).toUpperCase() + themeId.slice(1).toLowerCase();
      }
      console.log(window.localization.getMessage('themePurchaseRequiredToUse', {themeName: localizedThemeNameToBuy }));
      return;
    }
    
    // Security: Verify license for premium themes
    if (this.themes[themeId].premium) {
      const isValidLicense = await this.verifyActiveLicense();
      if (!isValidLicense) {
        console.warn('🚫 Security: Premium theme access revoked - invalid license');
        this.showLicenseError(window.localization.getMessage('licenseExpiredOrInvalid') || 'License expired or invalid');
        return;
      }
    }
    
    this.currentTheme = themeId;
    await chrome.storage.local.set({ currentTheme: themeId });
    
    this.applyTheme(themeId);
    this.setupThemeSelector(); // Refresh to show selection
    
    let localizedThemeNameApplied = window.localization.getMessage(this.themes[themeId].nameKey);
    if (!localizedThemeNameApplied || localizedThemeNameApplied === this.themes[themeId].nameKey) {
        localizedThemeNameApplied = themeId.charAt(0).toUpperCase() + themeId.slice(1).toLowerCase();
    }
    console.log(window.localization.getMessage('themeAppliedLog', {themeName: localizedThemeNameApplied }));
  }
  
  // Security: Verify active license periodically
  async verifyActiveLicense() {
    try {
      const licenseData = await chrome.storage.local.get(['activatedLicense', 'activationDate']);
      
      if (!licenseData.activatedLicense) {
        return false;
      }
      
      // Development mode always passes
      if (this.isDevelopmentMode()) {
        return true;
      }
      
      // Check if license is still valid (optional: add expiration check)
      const daysSinceActivation = (Date.now() - (licenseData.activationDate || 0)) / (1000 * 60 * 60 * 24);
      if (daysSinceActivation > 365) { // 1 year validity
        console.warn('🚫 License expired after 1 year');
        return false;
      }
      
      // Verify with Gumroad API (rate limited)
      const lastVerification = await chrome.storage.local.get(['lastLicenseVerification']);
      const hoursSinceLastCheck = (Date.now() - (lastVerification.lastLicenseVerification || 0)) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheck > 24) { // Check every 24 hours
        console.log('🔍 Performing periodic license verification...');
        const validation = await validateGumroadLicense(licenseData.activatedLicense);
        
        if (!validation.success) {
          console.warn('🚫 License verification failed during periodic check');
          // Don't immediately revoke, but log the issue
          await chrome.storage.local.set({ 
            licenseVerificationFailed: true,
            lastFailedVerification: Date.now()
          });
          return false;
        }
        
        await chrome.storage.local.set({ 
          lastLicenseVerification: Date.now(),
          licenseVerificationFailed: false
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('🔥 License verification error:', error);
      return false; // Fail secure
    }
  }
  
  applyTheme(themeId) {
    // Remove all existing theme classes
    const html = document.documentElement;
    Object.keys(this.themes).forEach(id => {
      html.classList.remove(`theme-${id}`);
    });
    
    // Remove dark-theme class
    html.classList.remove('dark-theme');
    
    // Apply new theme
    if (themeId === 'dark') {
      html.classList.add('dark-theme');
    } else if (themeId !== 'default') {
      html.classList.add(`theme-${themeId}`);
    }
    
    console.log(`Theme applied: ${themeId}`);
  }
  
  isThemeOwned(themeId) {
    return this.purchasedThemes.includes(themeId);
  }
  
  async checkSecretCode(code) {
    // NOTE: Secret codes are configured separately for security
    // This is a demo implementation - actual codes are configured server-side
    const secretCodes = {
      // Demo codes for public repository
      'DEMO_NEON': 'neon',
      'DEMO_GALAXY': 'galaxy',
      'PUBLIC_THEME_CODE': 'cyberpunk'
      // Production codes are loaded from secure configuration
    };
    
    // In production, this would validate against a secure endpoint
    const themeId = secretCodes[code.toUpperCase()];
    if (themeId && this.themes[themeId]) {
      console.log(`Demo secret code '${code}' confirmed. Unlocking ${themeId} theme.`);
      
      if (!this.purchasedThemes.includes(themeId)) {
        this.purchasedThemes.push(themeId);
        await chrome.storage.local.set({ purchasedThemes: this.purchasedThemes });
      }
      
      // Temayı otomatik olarak uygula ve tema seçiciyi yenile
      await this.selectTheme(themeId);
      this.setupThemeSelector(); // Tema seçiciyi yenile ki tema görünür olsun
      
      return { success: true, themeId: themeId };
    }
    
    return { success: false, themeId: null };
  }
  
  async checkNumacherStatus(userId) {
    // Bu fonksiyon artık deprecated, checkSecretCode kullanılacak
    console.warn('checkNumacherStatus is deprecated. Use checkSecretCode instead.');
    return false;
  }
  
  showPremiumRequiredDialog(themeId, theme) {
    const overlay = document.createElement('div');
    overlay.className = 'purchase-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'purchase-dialog';
    dialog.style.cssText = `
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      box-shadow: var(--shadow-lg);
      text-align: center;
    `;
    
    const themeName = window.localization.getMessage(theme.nameKey) || (themeId.charAt(0).toUpperCase() + themeId.slice(1).toLowerCase());
    const themeDescription = theme.descriptionKey ? window.localization.getMessage(theme.descriptionKey) : '';

    dialog.innerHTML = `
      <h3 style="color: var(--primary); margin-bottom: 1rem;">🎨 ${window.localization.getMessage('themeNameDisplay', {themeName: themeName})}</h3>
      <div class="theme-preview ${themeId}" style="width: 100%; height: 60px; border-radius: var(--border-radius); margin-bottom: 1rem;"></div>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.4;">${themeDescription}</p>
      <div style="background: var(--warning-bg); border: 1px solid var(--warning); border-radius: var(--border-radius); padding: 1rem; margin-bottom: 1.5rem;">
        <div style="color: var(--warning); font-weight: 600;">💎 ${window.localization.getMessage('premiumThemeLabel')}</div>
        <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">${window.localization.getMessage('premiumThemeBundleOnly')}</div>
      </div>
      <div style="display: flex; gap: 1rem;">
        <button id="closePremiumDialogBtn" class="button secondary" style="flex: 1;">${window.localization.getMessage('closeButton')}</button>
        <button id="showBuyAllDialogBtn" class="button primary" style="flex: 1;">${window.localization.getMessage('buyPremiumButton')}</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Add event listeners for buttons
    dialog.querySelector('#closePremiumDialogBtn').addEventListener('click', () => {
      overlay.remove();
    });

    dialog.querySelector('#showBuyAllDialogBtn').addEventListener('click', () => {
      overlay.remove();
      this.showBuyAllDialog();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
  
  async purchaseAllThemes() {
    try {
      const premiumThemes = Object.keys(this.themes).filter(id => this.themes[id].premium && !this.isThemeOwned(id));
      
      if (premiumThemes.length === 0) {
        this.showLicenseSuccess(window.localization.getMessage('alreadyOwnAllPremiumThemes'));
        return true;
      }
      
      const success = await this.processPurchase('premium-theme-bundle', this.allThemesPrice);
      
      if (success) {
        // Add all premium themes to purchased
        premiumThemes.forEach(themeId => {
          if (!this.purchasedThemes.includes(themeId)) {
            this.purchasedThemes.push(themeId);
          }
        });
        
        await chrome.storage.local.set({ purchasedThemes: this.purchasedThemes });
        this.setupThemeSelector();
        
        this.showLicenseSuccess(window.localization.getMessage('premiumBundlePurchaseSuccess', {count: premiumThemes.length}));
        return true;
      }
    } catch (error) {
      console.error('Purchase premium theme bundle error:', error);
      this.showLicenseError(window.localization.getMessage('purchaseErrorPleaseTryAgain'));
    }
    
    return false;
  }
  
  async processPurchase(itemId, price) {
    // This would integrate with PayPal, Stripe, or similar payment processor
    // For now, we'll simulate the process
    
    return new Promise((resolve) => {
      // Simulate payment processing
      setTimeout(() => {
        // In a real implementation, this would:
        // 1. Open payment gateway (PayPal, Stripe, etc.)
        // 2. Process payment
        // 3. Verify transaction
        // 4. Return success/failure
        
        // For demo purposes, we'll just show a confirmation
        const confirmed = confirm(window.localization.getMessage('confirmPurchaseSimulation', {itemId: itemId, price: price}));
        resolve(confirmed);
      }, 1000);
    });
  }
  
  showBuyAllDialog() {
    const premiumThemes = Object.keys(this.themes).filter(id => this.themes[id].premium);
    const ownedPremiumThemes = premiumThemes.filter(id => this.isThemeOwned(id));
    const remainingThemes = premiumThemes.filter(id => !this.isThemeOwned(id));
    
    const overlay = document.createElement('div');
    overlay.className = 'purchase-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'purchase-dialog';
    dialog.style.cssText = `
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: var(--shadow-lg);
      text-align: center;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    const themeList = remainingThemes.map(id => {
        let localizedName = window.localization.getMessage(this.themes[id].nameKey);
        if (!localizedName || localizedName === this.themes[id].nameKey) {
            localizedName = id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
        }
        return `• ${localizedName}`;
    }).join('<br>');
    
    dialog.innerHTML = `
      <h3 style="color: var(--primary); margin-bottom: 1rem;">🎨 ${window.localization.getMessage('premiumThemeBundleTitle')}</h3>
      <div style="margin-bottom: 1rem;">
        <div style="color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">
          ${window.localization.getMessage('purchaseNPremiumThemes', {count: remainingThemes.length})}
        </div>
        <div style="color: var(--text-primary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem;">
          ${themeList}
        </div>
      </div>
      
      <!-- License Key Section -->
      <div style="background: var(--info-bg); border: 1px solid var(--info); border-radius: var(--border-radius); padding: 1rem; margin-bottom: 1.5rem;">
        <div style="color: var(--info); font-weight: 600; margin-bottom: 0.5rem;">🔑 ${window.localization.getMessage('haveLicenseKeyPrompt')}</div>
        <input type="text" id="licenseKeyInput" placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" 
               style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); 
                      background: var(--bg-secondary); color: var(--text-primary); font-family: monospace; text-align: center; 
                      margin-bottom: 0.5rem; font-size: 0.9rem;" 
               maxlength="35">
        <button id="validateLicenseBtn" class="button secondary" style="width: 100%; margin-bottom: 0.5rem;">
          🔓 ${window.localization.getMessage('validateLicenseButton')}
        </button>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">
          ${window.localization.getMessage('enterGumroadLicense')}
        </div>
      </div>
      
      <div style="background: var(--success-bg); border: 1px solid var(--success); border-radius: var(--border-radius); padding: 1rem; margin-bottom: 1.5rem;">
        <div style="color: var(--success); font-weight: 600;">💎 ${window.localization.getMessage('premiumThemes')}</div>
        <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">${window.localization.getMessage('allThemesInOneBundle')}</div>
      </div>
      <div style="font-size: 1.8rem; font-weight: 600; color: var(--primary); margin-bottom: 1.5rem;">$2.50+</div>
      <div style="display: flex; gap: 1rem;">
        <button id="cancelBuyAllBtn" class="button secondary" style="flex: 1;">${window.localization.getMessage('cancelButton')}</button>
        <button id="buyOnGumroadBtn" class="button primary" style="flex: 1;">${window.localization.getMessage('buyOnGumroadButton')}</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Add event listeners for buttons
    dialog.querySelector('#cancelBuyAllBtn').addEventListener('click', () => {
      overlay.remove();
    });

    dialog.querySelector('#buyOnGumroadBtn').addEventListener('click', () => {
      this.openPurchasePage();
    });
    
    // License validation event listener
    const validateBtn = dialog.querySelector('#validateLicenseBtn');
    const licenseInput = dialog.querySelector('#licenseKeyInput');
    
    validateBtn.addEventListener('click', async () => {
      const licenseKey = licenseInput.value.trim();
      if (licenseKey) {
        await this.validateLicenseKey(licenseKey, overlay);
      } else {
        this.showLicenseError(window.localization.getMessage('pleaseEnterLicenseKey'));
      }
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
  
  showStatus(message, type) {
    // Sadece console'a log yaz
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
  
  async validateLicenseKey(licenseKey, overlay) {
    try {
      // Show loading state
      const validateBtn = overlay.querySelector('#validateLicenseBtn');
      const originalText = validateBtn.innerHTML;
      validateBtn.innerHTML = `🔄 ${window.localization.getMessage('validatingLicense')}`;
      validateBtn.disabled = true;
      
      // Format license key (remove spaces and convert to uppercase)
      const formattedKey = licenseKey.replace(/\s+/g, '').toUpperCase();
      
      // Validate format first
      if (!this.isValidLicenseFormat(formattedKey)) {
        this.showLicenseError(window.localization.getMessage('invalidLicenseFormat'));
        validateBtn.innerHTML = originalText;
        validateBtn.disabled = false;
        return;
      }
      
      // Check if already activated
      const storedLicense = await chrome.storage.local.get(['activatedLicense']);
      if (storedLicense.activatedLicense === formattedKey) {
        this.showLicenseSuccess(window.localization.getMessage('licenseAlreadyActivated'));
        overlay.remove();
        return;
      }
      
      // Validate with Gumroad API or offline validation
      const isValid = await this.validateWithGumroad(formattedKey);
      
      if (isValid) {
        // Activate all premium themes
        await this.activatePremiumThemes(formattedKey);
        this.showLicenseSuccess(window.localization.getMessage('themesActivatedSuccess'));
        overlay.remove();
      } else {
        this.showLicenseError(window.localization.getMessage('invalidLicenseKey'));
      }
      
      validateBtn.innerHTML = originalText;
      validateBtn.disabled = false;
      
    } catch (error) {
      console.error('License validation error:', error);
      this.showLicenseError(window.localization.getMessage('validationErrorPleaseTryAgain'));
    }
  }
  
  isValidLicenseFormat(licenseKey) {
    // Gumroad license key format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
    // Normalize the key first (remove all spaces and convert to uppercase)
    const normalizedKey = licenseKey.replace(/\s+/g, '').toUpperCase();
    
    // Check various dash patterns that might occur
    const patterns = [
      /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/,  // Standard: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
      /^[A-F0-9]{8}-[A-F0-9]{4}[A-F0-9]{4}-[A-F0-9]{4}[A-F0-9]{4}-[A-F0-9]{8}$/,  // Variant: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
      /^[A-F0-9]{32}$/  // No dashes: 32 hex characters
    ];
    
    // Test against any of the patterns
    const isValid = patterns.some(pattern => pattern.test(normalizedKey));
    
    // Also check if it can be converted to standard format
    if (!isValid && normalizedKey.length >= 32) {
      // Try to extract 32 hex characters and format them
      const hexOnly = normalizedKey.replace(/[^A-F0-9]/g, '');
      if (hexOnly.length === 32) {
        return true; // Valid if we can extract exactly 32 hex chars
      }
    }
    
    return isValid;
  }
  
  async validateWithGumroad(licenseKey) {
    try {
      // Güvenlik: Hardcoded test anahtarları kaldırıldı
      // Sadece gerçek Gumroad API doğrulaması yapılır
      
      if (!this.isValidLicenseFormat(licenseKey)) {
        return false;
      }
      
      // Gerçek Gumroad API doğrulaması
      // Not: Bu işlem backend üzerinden yapılmalı, güvenlik için
      const response = await this.validateLicenseSecurely(licenseKey);
      
      return response;
      
    } catch (error) {
      console.error('License validation error:', error);
      return false; // Güvenlik için default false
    }
  }
  
  async validateLicenseSecurely(licenseKey) {
    try {
      // Development mode kontrolü
      if (this.isDevelopmentMode()) {
        console.warn('Development mode: License validation bypassed');
        return this.isValidLicenseFormat(licenseKey);
      }
      
      // Direkt Gumroad API ile doğrulama
      const result = await validateGumroadLicense(licenseKey);
      
      if (result.success) {
        console.log('✅ License validated successfully with Gumroad API');
        if (result.uses_remaining !== undefined) {
          console.log(`🎯 Uses remaining: ${result.uses_remaining}`);
        }
        return true;
      } else {
        console.log('❌ License validation failed:', result.error);
        return false;
      }
      
    } catch (error) {
      console.error('🔥 License validation error:', error);
      return false;
    }
  }
  
  async activatePremiumThemes(licenseKey) {
    console.log('🎯 Activating premium themes with license:', licenseKey);
    
    if (!licenseKey || licenseKey.trim() === '') {
        throw new Error(window.localization.getMessage('licenseKeyRequired') || 'License key required');
    }
    
    console.log('🔍 Validating license key...');
    
    try {
        // Validate with Gumroad
        const validation = await validateGumroadLicense(licenseKey.trim());
        
        if (!validation.success) {
            throw new Error(validation.error || 'License validation failed');
        }
        
        console.log('✅ License validated successfully!');
        
        // Unlock all premium themes
        const premiumThemes = Object.keys(this.themes).filter(id => this.themes[id].premium);
        premiumThemes.forEach(themeId => {
          if (!this.purchasedThemes.includes(themeId)) {
            this.purchasedThemes.push(themeId);
          }
        });
        
        // Save to storage
        await chrome.storage.local.set({
            purchasedThemes: this.purchasedThemes,
            activatedLicense: licenseKey.trim(),
            activationDate: Date.now(),
            licenseInfo: {
              uses_remaining: validation.uses_remaining,
              purchase_info: validation.purchase_info
            }
        });
        
        console.log('💾 Premium themes data saved');
        
        // Refresh theme selector
        this.setupThemeSelector();
        
        console.log('✅ Premium themes activated successfully');
        
        return {
            success: true,
            message: 'Premium themes activated!',
            usesRemaining: validation.uses_remaining
        };
        
    } catch (error) {
        console.error('❌ Premium activation failed:', error);
        throw error;
    }
  }
  
  showLicenseError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--error-bg);
      border: 1px solid var(--error);
      color: var(--error);
      padding: 1rem;
      border-radius: var(--border-radius);
      z-index: 10001;
      max-width: 300px;
      box-shadow: var(--shadow-lg);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
  
  showLicenseSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-bg);
      border: 1px solid var(--success);
      color: var(--success);
      padding: 1rem;
      border-radius: var(--border-radius);
      z-index: 10001;
      max-width: 300px;
      box-shadow: var(--shadow-lg);
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }
  
  // Security: Remove public developer functions in production
  // Developer functions for testing (PRODUCTION: REMOVE OR SECURE)
  unlockAllThemes() {
    if (!this.isDevelopmentMode()) {
      console.warn('🚫 Security: Developer functions disabled in production');
      return false;
    }
    const allThemes = Object.keys(this.themes);
    this.purchasedThemes = allThemes;
    chrome.storage.local.set({ purchasedThemes: this.purchasedThemes });
    this.setupThemeSelector();
    console.log(window.localization.getMessage('allThemesUnlockedLog'));
    return true;
  }
  
  resetPurchases() {
    if (!this.isDevelopmentMode()) {
      console.warn('🚫 Security: Developer functions disabled in production');
      return false;
    }
    this.purchasedThemes = ['default', 'dark'];
    chrome.storage.local.set({ purchasedThemes: this.purchasedThemes });
    // Clear activated license as well
    chrome.storage.local.remove(['activatedLicense', 'activationDate', 'licenseInfo']);
    this.selectTheme('dark'); // Default to dark
    this.setupThemeSelector();
    console.log(window.localization.getMessage('purchasesResetLog'));
    return true;
  }
  
  // Security: Add license validation before theme unlock
  async unlockSpecificTheme(themeId) {
    if (this.themes[themeId] && !this.isThemeOwned(themeId)) {
      // Security check: Verify license before unlocking
      const licenseData = await chrome.storage.local.get(['activatedLicense']);
      if (!licenseData.activatedLicense && this.themes[themeId].premium) {
        console.warn('🚫 Security: Cannot unlock premium theme without valid license');
        return false;
      }
      
      this.purchasedThemes.push(themeId);
      await chrome.storage.local.set({ purchasedThemes: this.purchasedThemes });
      this.setupThemeSelector(); // Refresh UI
      
      let localizedThemeName = window.localization.getMessage(this.themes[themeId].nameKey);
      if (!localizedThemeName || localizedThemeName === this.themes[themeId].nameKey) {
          localizedThemeName = themeId.charAt(0).toUpperCase() + themeId.slice(1).toLowerCase();
      }
      console.log(`${localizedThemeName} theme unlocked via secret code.`);
      return true;
    }
    console.log(`Theme ${themeId} not found or already owned when trying to unlock via secret code.`);
    return false;
  }
  
  // Security: Add development mode detection as instance method
  isDevelopmentMode() {
    return !('update_url' in chrome.runtime.getManifest());
  }
  
  // Dil güncellemesi için tema arayüzünü yeniden oluştur
  refreshTranslations() {
    if (this.isInitialized) {
      this.setupThemeSelector();
      console.log('ThemeManager: Translations refreshed for themes.');
    } else {
      console.warn('ThemeManager: refreshTranslations called before init.');
    }
  }

  openPurchasePage() {
    // Updated purchase link for public release
    window.open('https://mtalham.gumroad.com/l/unlockthemes', '_blank');
  }
}

// Global theme manager instance
let themeManagerInstance;

function initializeThemeManager() {
  if (!themeManagerInstance) { // Singleton pattern
    themeManagerInstance = new ThemeManager();
    themeManagerInstance.init(); // Call init here
  }
  
  // Security: Only expose globally in development mode
  if (themeManagerInstance.isDevelopmentMode()) {
    window.themeManager = themeManagerInstance; // Make it globally accessible for development
    console.log('🚧 Development mode: Global themeManager access enabled');
  } else {
    // Production: Hide global access
    Object.defineProperty(window, 'themeManager', {
      get: () => {
        console.warn('🚫 Security: Direct theme manager access is restricted in production');
        return undefined;
      },
      set: () => {
        console.warn('🚫 Security: Cannot override theme manager in production');
        return false;
      },
      configurable: false
    });
  }
  
  return themeManagerInstance;
}

// Initialize when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeThemeManager);
} else {
  initializeThemeManager();
}

// Dil değişimi olayını dinle
window.addEventListener('languageChanged', () => {
  // Ensure themeManagerInstance is initialized and has the method
  if (window.themeManager && typeof window.themeManager.refreshTranslations === 'function') {
    window.themeManager.refreshTranslations();
  } else {
    console.error('ThemeManager not ready or refreshTranslations not available for languageChanged event.');
  }
});

// Export for use in other scripts (if needed, e.g., for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}

// Security-enhanced Gumroad License Validation
async function validateGumroadLicense(licenseKey) {
    console.log('🔍 Validating Gumroad license:', licenseKey?.slice(0, 8) + '...');
    
    // Security: Input validation
    if (!licenseKey || typeof licenseKey !== 'string') {
        console.error('🚫 Invalid license key format');
        return { success: false, error: 'Invalid license key format' };
    }
    
    // Development mode bypass
    if (!('update_url' in chrome.runtime.getManifest())) {
        console.log('🚧 Development mode - bypassing license validation');
        return {
            success: true,
            message: 'Development mode active',
            license_key: licenseKey,
            uses_remaining: 999
        };
    }
    
    // Security: Rate limiting check
    const lastRequest = await chrome.storage.local.get(['lastLicenseRequest']);
    const timeSinceLastRequest = Date.now() - (lastRequest.lastLicenseRequest || 0);
    
    if (timeSinceLastRequest < 5000) { // 5 second cooldown
        console.warn('🚫 Rate limit: Please wait before trying again');
        return { 
            success: false, 
            error: 'Rate limit exceeded. Please wait a moment.' 
        };
    }
    
    try {
        // Update last request time
        await chrome.storage.local.set({ lastLicenseRequest: Date.now() });
        
        // NOTE: For security, the actual product ID is configured server-side
        // This is a demo implementation for the public repository
        const GUMROAD_PRODUCT_ID = getGumroadProductId();
        
        // Gumroad license validation endpoint
        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': `RobloxAvatarCopier/${chrome.runtime.getManifest().version}`
            },
            body: new URLSearchParams({
                'product_id': GUMROAD_PRODUCT_ID,
                'license_key': licenseKey.trim(),
                'increment_uses_count': 'true' // Track usage
            })
        });
        
        console.log('📡 Gumroad API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Gumroad API response received');
        
        if (result.success) {
            console.log('✅ License validation successful');
            console.log('🎯 Uses remaining:', result.uses);
            
            // Security: Validate response structure
            if (!result.purchase || !result.license_key) {
                console.warn('⚠️ Suspicious API response structure');
            }
            
            return {
                success: true,
                message: 'License validated successfully',
                license_key: licenseKey,
                uses_remaining: result.uses || 0,
                purchase_info: result.purchase
            };
        } else {
            console.log('❌ License validation failed:', result.message);
            return {
                success: false,
                error: result.message || 'License validation failed'
            };
        }
        
    } catch (error) {
        console.error('🔥 License validation error:', error);
        return {
            success: false,
            error: 'Network error during license validation'
        };
    }
}

// Security: Product ID configuration
// In production, this would be loaded from secure configuration
function getGumroadProductId() {
    // For security, actual product ID is not exposed in public repository
    // This returns a demo/placeholder ID
    if (!('update_url' in chrome.runtime.getManifest())) {
        return 'DEMO_PRODUCT_ID_FOR_DEVELOPMENT';
    }
    
    // In production, this would fetch from secure endpoint or environment
    return 'YOUR_GUMROAD_PRODUCT_ID_HERE';
} 