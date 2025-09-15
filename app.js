// app.js - Language selector functionality and app initialization
(function() {
  'use strict';

  // Available languages configuration
  const LANGUAGES = {
    'tr': { name: 'Türkçe', flag: '🇹🇷' },
    'en': { name: 'English', flag: '🇺🇸' }
  };

  const DEFAULT_LANGUAGE = 'tr';

  /**
   * Populates the language selector with available languages
   * Makes it robust and accessible
   */
  function populateLanguageSelector() {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect) {
      console.warn('Language selector element not found');
      return;
    }

    // Clear existing options
    langSelect.innerHTML = '';

    // Get current language from localStorage or use default
    const currentLang = localStorage.getItem('selectedLanguage') || DEFAULT_LANGUAGE;

    // Populate options
    Object.entries(LANGUAGES).forEach(([code, config]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${config.flag} ${config.name}`;
      option.selected = code === currentLang;
      
      // Add accessibility attributes
      option.setAttribute('lang', code);
      option.setAttribute('aria-label', `${config.name} dilini seç`);
      
      langSelect.appendChild(option);
    });

    // Add change event listener for language switching
    langSelect.addEventListener('change', handleLanguageChange);

    // Set proper accessibility attributes
    langSelect.setAttribute('aria-label', 'Dil seçimi');
    langSelect.setAttribute('title', 'Site dilini değiştir');

    // Apply initial language if not already set
    if (currentLang) {
      loadLanguage(currentLang);
    }
  }

  /**
   * Handles language change events
   * @param {Event} event - The change event
   */
  function handleLanguageChange(event) {
    const selectedLang = event.target.value;
    if (!selectedLang || !LANGUAGES[selectedLang]) {
      console.error('Invalid language selected:', selectedLang);
      return;
    }

    // Save to localStorage
    localStorage.setItem('selectedLanguage', selectedLang);

    // Load the new language
    loadLanguage(selectedLang);

    // Update document language attribute
    document.documentElement.lang = selectedLang;

    // Show feedback to user
    showLanguageChangeNotification(LANGUAGES[selectedLang].name);
  }

  /**
   * Loads and applies language translations
   * @param {string} langCode - Language code to load
   */
  async function loadLanguage(langCode) {
    try {
      const response = await fetch(`/locales/${langCode}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${response.status}`);
      }
      
      const translations = await response.json();
      applyTranslations(translations, langCode);
      
      console.log(`Language loaded successfully: ${langCode}`);
    } catch (error) {
      console.error('Error loading language:', error);
      // Fallback to default language if not already trying it
      if (langCode !== DEFAULT_LANGUAGE) {
        console.log(`Falling back to default language: ${DEFAULT_LANGUAGE}`);
        loadLanguage(DEFAULT_LANGUAGE);
      }
    }
  }

  /**
   * Applies translations to elements with data-i18n attributes
   * @param {Object} translations - Translation object
   * @param {string} langCode - Language code being applied
   */
  function applyTranslations(translations, langCode) {
    // Handle elements with data-i18n attributes (newer convention)
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[key]) {
        if (element.tagName === 'INPUT' && element.type === 'search') {
          element.placeholder = translations[key];
        } else {
          element.textContent = translations[key];
        }
      }
    });

    // Handle elements with data-i18n-key attributes (legacy support)
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
      const key = element.getAttribute('data-i18n-key');
      if (translations[key]) {
        if (element.placeholder !== undefined && element.tagName === 'INPUT') {
          element.placeholder = translations[key];
        } else {
          element.textContent = translations[key];
        }
      }
    });

    // Store current translations globally for other scripts
    window.currentTranslations = translations;
    window.currentLanguage = langCode;
  }

  /**
   * Shows a brief notification when language changes
   * @param {string} languageName - Name of the selected language
   */
  function showLanguageChangeNotification(languageName) {
    // Try to use existing toast system if available
    if (window.ilansite && window.ilansite.showToast) {
      window.ilansite.showToast(`Dil değiştirildi: ${languageName}`, 'success', 2000);
      return;
    }

    // Fallback: create simple notification
    const notification = document.createElement('div');
    notification.textContent = `Dil değiştirildi: ${languageName}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.style.opacity = '1', 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  }

  /**
   * Initializes keyboard navigation for the language selector
   */
  function initKeyboardNavigation() {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect) return;

    langSelect.addEventListener('keydown', (event) => {
      // Handle Enter and Space keys for better accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        langSelect.focus();
        langSelect.click();
      }
    });
  }

  /**
   * Detects browser language and sets it if not already set
   */
  function detectAndSetBrowserLanguage() {
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) return; // User has already made a choice

    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.startsWith('tr') ? 'tr' : 'en';
    
    if (LANGUAGES[langCode]) {
      localStorage.setItem('selectedLanguage', langCode);
      console.log(`Auto-detected language: ${langCode}`);
    }
  }

  /**
   * Main initialization function
   */
  function initializeApp() {
    console.log('Initializing app...');
    
    // Detect browser language if needed
    detectAndSetBrowserLanguage();
    
    // Initialize language selector
    populateLanguageSelector();
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
    
    console.log('App initialization complete');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

  // Expose functions globally for external use
  window.appLanguage = {
    populateLanguageSelector,
    loadLanguage,
    getCurrentLanguage: () => localStorage.getItem('selectedLanguage') || DEFAULT_LANGUAGE,
    getAvailableLanguages: () => LANGUAGES
  };

})();