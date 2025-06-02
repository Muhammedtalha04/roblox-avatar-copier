// Enhanced Roblox Avatar Copier - Content Script (Minimal Version)
// Only auto-redraw functionality

(function() {
  'use strict';
  
  // Enhanced error handling and logging
  class Logger {
    static log(message, data = null) {
      console.log(`[Roblox Avatar Copier] ${message}`, data || '');
    }
    
    static warn(message, data = null) {
      console.warn(`[Roblox Avatar Copier] ${message}`, data || '');
    }
    
    static error(message, error = null) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          console.error(`[Roblox Avatar Copier] ${message}`, error || '');
        } else {
          console.error(`[Roblox Avatar Copier] ${message}`, error || '');
        }
      } catch (e) {
        console.error(`[Roblox Avatar Copier] ${message}`, error || '');
      }
    }
  }
  
  // Utility functions
  const utils = {
    // Check if element is visible
    isElementVisible(element) {
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.opacity !== '0'
      );
    }
  };
  
  // Auto redraw avatar functionality
  const autoRedraw = {
    // Auto redraw avatar after successful copy
    async autoRedrawAvatar() {
      try {
        Logger.log('Attempting to auto-redraw avatar...');
        
        // First, try to activate the page aggressively
        await this.forcePageActivation();
        
        // Redraw button selectors (updated for AngularJS)
        const redrawSelectors = [
          'a[ng-click*="redrawThumbnail"]', // Primary AngularJS selector
          'a[ng-click*="redraw" i]',
          'button[ng-click*="redrawThumbnail"]',
          'button[ng-click*="redraw" i]',
          'a.text-link[ng-click*="redraw" i]',
          '[ng-click*="redrawThumbnail"]',
          'button[aria-label*="redraw" i]',
          'button[title*="redraw" i]',
          'button:contains("Redraw")',
          'button[class*="redraw" i]',
          '[data-testid*="redraw" i]',
          '.redraw-button',
          '#redraw-button',
          'button[onclick*="redraw" i]'
        ];
        
        // Function to find button by text content
        const findButtonByText = () => {
          const buttons = document.querySelectorAll('button, input[type="button"], a[role="button"], a.text-link');
          for (const button of buttons) {
            const text = button.textContent || button.innerText || button.value || '';
            if (text.toLowerCase().includes('redraw') || 
                text.toLowerCase().includes('refresh') ||
                text.toLowerCase().includes('reload')) {
              return button;
            }
          }
          return null;
        };
        
        let redrawButton = null;
        
        // Try all selectors first
        for (const selector of redrawSelectors) {
          try {
            redrawButton = document.querySelector(selector);
            if (redrawButton && utils.isElementVisible(redrawButton)) {
              Logger.log(`Found redraw button with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Invalid selector, continue
          }
        }
        
        // If not found by selector, try finding by text
        if (!redrawButton) {
          redrawButton = findButtonByText();
          if (redrawButton) {
            Logger.log('Found redraw button by text content');
          }
        }
        
        // If still not found, wait a bit and try again
        if (!redrawButton) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          for (const selector of redrawSelectors) {
            try {
              redrawButton = document.querySelector(selector);
              if (redrawButton && utils.isElementVisible(redrawButton)) {
                Logger.log(`Found redraw button after wait with selector: ${selector}`);
                break;
              }
            } catch (e) {
              // Continue
            }
          }
          
          if (!redrawButton) {
            redrawButton = findButtonByText();
          }
        }
        
        if (redrawButton && utils.isElementVisible(redrawButton)) {
          Logger.log('Clicking redraw button...');
          
          // Check if button is disabled (flood protection)
          const isDisabled = redrawButton.hasAttribute('ng-disabled') && 
                           redrawButton.getAttribute('ng-disabled') === 'redrawFloodchecked';
    
          if (isDisabled) {
            Logger.warn('Redraw button is disabled due to flood protection');
            // Try to wait and retry
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          // Force page activation again before clicking
          await this.forcePageActivation();
          
          // Try AngularJS-specific click first
          const angularSuccess = await this.clickAngularJSButton(redrawButton);
          
          if (angularSuccess) {
            Logger.log('✅ AngularJS redraw button clicked successfully');
            return true;
          }
          
          // Fallback to aggressive click methods
          const clickSuccess = await this.aggressiveClick(redrawButton);
          
          if (clickSuccess) {
            Logger.log('✅ Redraw button clicked successfully');
            return true;
          } else {
            Logger.warn('All click methods failed, trying script injection...');
            return await this.scriptInjectionClick(redrawButton);
          }
    } else {
          Logger.warn('Redraw button not found or not visible');
          return false;
        }
        
      } catch (error) {
        Logger.error('Error in autoRedrawAvatar:', error);
        return false;
      }
    },
    
    // AngularJS-specific click method
    async clickAngularJSButton(button) {
      try {
        Logger.log('Attempting AngularJS click...');
        
        // Method 1: Try to find and execute Angular scope
        try {
          // Get Angular element
          const angularElement = angular?.element ? angular.element(button) : null;
          
          if (angularElement && angularElement.scope) {
            const scope = angularElement.scope();
            if (scope && scope.redrawThumbnail && typeof scope.redrawThumbnail === 'function') {
              Logger.log('Found AngularJS scope with redrawThumbnail function');
              
              // Execute the function
              scope.redrawThumbnail();
              
              // Apply scope changes
              if (scope.$apply) {
                scope.$apply();
    }
    
              Logger.log('✅ AngularJS redrawThumbnail() executed successfully');
    return true;
  }
          }
        } catch (angularError) {
          Logger.warn('AngularJS scope method failed:', angularError);
        }
        
        // Method 2: Try to trigger ng-click directly
        try {
          const ngClick = button.getAttribute('ng-click');
          if (ngClick && ngClick.includes('redrawThumbnail')) {
            Logger.log('Attempting to trigger ng-click directive...');
            
            // Force user activation first
            await this.forcePageActivation();
            
            // Create a custom click event that AngularJS should pick up
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: 0,
              clientY: 0,
              button: 0,
              buttons: 1,
              isTrusted: false // AngularJS sometimes handles untrusted events differently
            });
            
            // Dispatch the event
            button.dispatchEvent(clickEvent);
            
            Logger.log('✅ ng-click event dispatched');
            
            // Wait a bit and try trusted event
            setTimeout(() => {
              const trustedEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                isTrusted: true
              });
              button.dispatchEvent(trustedEvent);
            }, 100);
            
            return true;
  }
        } catch (directError) {
          Logger.warn('Direct ng-click trigger failed:', directError);
        }
        
        // Method 3: Script injection for AngularJS
        try {
          const script = document.createElement('script');
          script.textContent = `
            (function() {
              try {
                // Find the button
                const button = document.querySelector('a[ng-click*="redrawThumbnail"], button[ng-click*="redrawThumbnail"]');
                if (button) {
                  console.log('Script injection: Found AngularJS redraw button');
                  
                  // Method 1: Try Angular scope
                  if (typeof angular !== 'undefined' && angular.element) {
                    const element = angular.element(button);
                    const scope = element.scope();
                    if (scope && scope.redrawThumbnail) {
                      scope.redrawThumbnail();
                      if (scope.$apply) scope.$apply();
                      console.log('Script injection: AngularJS scope method executed');
                      window.__avatarCopierRedrawSuccess = true;
    return;
  }
                  }
  
                  // Method 2: Simulate click events
                  const events = ['mousedown', 'mouseup', 'click'];
                  events.forEach(eventType => {
                    const event = new MouseEvent(eventType, {
                      view: window,
                      bubbles: true,
                      cancelable: true
                    });
                    button.dispatchEvent(event);
                  });
                  
                  console.log('Script injection: Click events dispatched');
                  window.__avatarCopierRedrawSuccess = true;
                } else {
                  console.warn('Script injection: AngularJS redraw button not found');
                  window.__avatarCopierRedrawSuccess = false;
                }
              } catch (error) {
                console.error('Script injection error:', error);
                window.__avatarCopierRedrawSuccess = false;
              }
            })();
          `;
          
          document.head.appendChild(script);
          document.head.removeChild(script);
          
          // Check result
          await new Promise(resolve => setTimeout(resolve, 1000));
          const success = window.__avatarCopierRedrawSuccess;
          delete window.__avatarCopierRedrawSuccess;
          
          if (success) {
            Logger.log('✅ AngularJS script injection successful');
            return true;
          }
        } catch (scriptError) {
          Logger.warn('AngularJS script injection failed:', scriptError);
        }
        
        return false;
      } catch (error) {
        Logger.error('AngularJS click method failed:', error);
        return false;
      }
    },
    
    // Force page activation with multiple methods
    async forcePageActivation() {
      try {
        Logger.log('Forcing page activation...');
        
        // Method 1: Focus the window
        window.focus();
        
        // Method 2: Focus the document
        if (document.hasFocus && !document.hasFocus()) {
          document.body.focus();
        }
        
        // Method 3: Simulate multiple user interactions
        const activationMethods = [
          () => {
            // Click somewhere safe on the page
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              detail: 1
            });
            document.body.dispatchEvent(clickEvent);
          },
          () => {
            // Keyboard interaction
            const keyEvent = new KeyboardEvent('keydown', {
              key: 'Tab',
              code: 'Tab',
              bubbles: true
            });
            document.dispatchEvent(keyEvent);
          },
          () => {
            // Mouse movement
            const moveEvent = new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: window.innerWidth / 2,
              clientY: window.innerHeight / 2
            });
            document.dispatchEvent(moveEvent);
          },
          () => {
            // Touch events for mobile compatibility
            if ('ontouchstart' in window) {
              const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true
              });
              document.body.dispatchEvent(touchEvent);
            }
          }
        ];
        
        // Execute all activation methods
        for (const method of activationMethods) {
          try {
            method();
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (e) {
            Logger.warn('Activation method failed:', e);
  }
        }
        
        // Wait a bit for activation to take effect
        await new Promise(resolve => setTimeout(resolve, 200));
        
        Logger.log('Page activation completed');
      } catch (error) {
        Logger.warn('Page activation failed:', error);
      }
    },
    
    // Aggressive click with multiple methods
    async aggressiveClick(button) {
      const clickMethods = [
        // Method 1: Standard click
        () => {
          button.focus();
          button.click();
        },
        
        // Method 2: Mouse event simulation
        () => {
          const rect = button.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const events = ['mousedown', 'mouseup', 'click'];
          events.forEach(eventType => {
            const event = new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window,
              detail: 1,
              screenX: centerX + window.screenX,
              screenY: centerY + window.screenY,
              clientX: centerX,
              clientY: centerY,
              button: 0,
              buttons: 1
            });
            button.dispatchEvent(event);
          });
        },
        
        // Method 3: Keyboard activation
        () => {
          button.focus();
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          button.dispatchEvent(enterEvent);
          
          const spaceEvent = new KeyboardEvent('keydown', {
            key: ' ',
            code: 'Space',
            keyCode: 32,
            which: 32,
            bubbles: true,
            cancelable: true
          });
          button.dispatchEvent(spaceEvent);
        }
      ];
      
      for (let i = 0; i < clickMethods.length; i++) {
        try {
          Logger.log(`Trying click method ${i + 1}...`);
          
          // Force activation before each attempt
          await this.forcePageActivation();
          
          clickMethods[i]();
          
          // Wait and check if it worked
          await new Promise(resolve => setTimeout(resolve, 500));
          
          Logger.log(`Click method ${i + 1} executed`);
          return true; // Assume success for now
          
        } catch (error) {
          Logger.warn(`Click method ${i + 1} failed:`, error);
        }
      }
      
      return false;
    },
    
    // Last resort: script injection
    async scriptInjectionClick(button) {
      try {
        Logger.log('Attempting script injection click...');
        
        // Create a more comprehensive script
        const script = document.createElement('script');
        script.textContent = `
          (function() {
            try {
              // First, try to activate the page
              window.focus();
              document.body.focus();
              
              // Find the button again
              const redrawButton = document.querySelector('a[ng-click*="redrawThumbnail"], button[ng-click*="redrawThumbnail"], [ng-click*="redraw"]');
              if (redrawButton) {
                console.log('Script injection: Found redraw button');
                
                // Multiple click attempts in sequence
                const clickMethods = [
                  () => redrawButton.click(),
                  () => {
                    const event = new MouseEvent('click', {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    });
                    redrawButton.dispatchEvent(event);
                  },
                  () => {
                    redrawButton.focus();
                    const enterEvent = new KeyboardEvent('keydown', {
                      key: 'Enter',
                      keyCode: 13,
                      bubbles: true
                    });
                    redrawButton.dispatchEvent(enterEvent);
  }
                ];
                
                // Try each method with small delays
                clickMethods.forEach((method, index) => {
                  setTimeout(() => {
                    try {
                      method();
                      console.log('Script injection: Click method', index + 1, 'executed');
                    } catch (e) {
                      console.warn('Script injection: Click method', index + 1, 'failed:', e);
                    }
                  }, index * 100);
                });
                
                // Mark as successful
                window.__avatarCopierRedrawSuccess = true;
              } else {
                console.warn('Script injection: Redraw button not found');
                window.__avatarCopierRedrawSuccess = false;
              }
            } catch (error) {
              console.error('Script injection error:', error);
              window.__avatarCopierRedrawSuccess = false;
            }
          })();
        `;
        
        document.head.appendChild(script);
        document.head.removeChild(script);
        
        // Check if injection was successful
        await new Promise(resolve => setTimeout(resolve, 1000));
        const success = window.__avatarCopierRedrawSuccess;
        delete window.__avatarCopierRedrawSuccess;
        
        if (success) {
          Logger.log('✅ Script injection click successful');
        } else {
          Logger.warn('Script injection click failed');
        }
        
        return success;
        
      } catch (error) {
        Logger.error('Script injection failed:', error);
        return false;
      }
    }
  };
  
  // Message listener for commands from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      Logger.log('Received message:', message);
      
      if (message.action === 'autoRedrawAvatar') {
        // Call the auto redraw function
        autoRedraw.autoRedrawAvatar()
          .then(result => {
            sendResponse({ success: true, result: result });
          })
          .catch(error => {
            Logger.error('Auto redraw failed:', error);
            sendResponse({ success: false, error: error.message });
});

        // Return true to indicate we will send response asynchronously
        return true;
      }
      
      // Handle other potential messages
      sendResponse({ success: false, error: 'Unknown action: ' + message.action });
      
    } catch (error) {
      Logger.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  });
  
  Logger.log('Avatar Copier content script loaded (minimal version)');
  
})();
