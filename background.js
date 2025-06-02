// Roblox Avatar Copier - Background Script (ES Module)
// Performance optimized service worker

// Global rate limiting için değişkenler
const MAX_CONCURRENT_REQUESTS = 2;
const REQUEST_QUEUE = [];
let activeRequests = 0;

// Request queue manager
async function queueRequest(requestFn) {
  return new Promise((resolve, reject) => {
    REQUEST_QUEUE.push({ requestFn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || REQUEST_QUEUE.length === 0) {
    return;
  }
  
  const { requestFn, resolve, reject } = REQUEST_QUEUE.shift();
  activeRequests++;
  
  try {
    const result = await requestFn();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    activeRequests--;
    // Process next request after a small delay
    setTimeout(processQueue, 100);
  }
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background script received message:', request);
  
  const handlers = {
    'getAvatarDetails': () => getAvatarDetails(request.userId),
    'applyAvatarChanges': () => applyAvatarChanges(request.avatarData),
    'checkOwnedItems': () => checkOwnedItems(request.avatarData),
    'getThumbnail': () => getThumbnail(request.assetId),
    'getCurrentUserId': () => getCurrentUserId(),
    'getPerformanceStats': () => getPerformanceStats(),
    'getCurrentUserRobux': () => getCurrentUserRobux()
  };
  
  const handler = handlers[request.action];
  if (!handler) {
    sendResponse({ success: false, error: 'Unknown action: ' + request.action });
    return false;
  }
  
  handler()
      .then(data => {
      console.log(`${request.action} completed successfully`);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
      console.error(`${request.action} error:`, error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        errorType: error.name || 'Error'
      });
      });
    
    return true; // Keep the message channel open for async response
});

// Performance monitoring
function getPerformanceStats() {
  return {
    activeRequests: activeRequests,
    queueSize: REQUEST_QUEUE.length,
    timestamp: Date.now()
  };
}

// Get the CSRF token from Roblox cookies
async function getCSRFToken() {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({
      url: 'https://www.roblox.com',
      name: '.ROBLOSECURITY'
    }, async function(cookie) {
      if (!cookie) {
        reject(new Error('Roblox session not found. Please log in to Roblox website.'));
        return;
      }
      
      try {
        const response = await queueRequest(async () => {
          return fetch('https://auth.roblox.com/v1/authentication-ticket', {
          method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
          });
        });
        
        const csrfToken = response.headers.get('x-csrf-token');
        
        if (!csrfToken) {
          reject(new Error('Failed to retrieve CSRF token'));
          return;
        }
        
        console.log('CSRF token retrieved successfully');
        resolve(csrfToken);
      } catch (error) {
        console.error('CSRF token error:', error);
        reject(new Error('Failed to retrieve CSRF token: ' + error.message));
      }
    });
  });
}

// Enhanced sleep function with jitter to prevent thundering herd
const sleep = (ms) => {
  const jitter = Math.random() * 200; // Add up to 200ms random delay
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
};

// Enhanced fetch function with better error handling
async function fetchWithRetry(url, options = {}, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry ${attempt}/${maxRetries}: ${url}`);
        await sleep(delay * Math.pow(2, attempt));
      }
      
      const response = await queueRequest(async () => {
        // Create manual timeout for broader browser support (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
          const fetchResponse = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return fetchResponse;
        } catch (error) {
          clearTimeout(timeoutId);
          // Better error handling for common fetch errors
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after 15 seconds: ${url}`);
          }
          
          // Handle network errors specifically
          if (error.message.includes('Failed to fetch')) {
            throw new Error(`Network error accessing ${url}. This might be due to:\n• CORS policy restrictions\n• Network connectivity issues\n• Roblox API being temporarily unavailable`);
          }
          
          throw error;
        }
      });
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, attempt);
        console.warn(`Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed for ${url}. Please log in to Roblox and try again.`);
      }
      
      // Clone the response to prevent "body stream already read" errors
      return response.clone();
    } catch (error) {
      lastError = error;
      console.warn(`Fetch error (${attempt + 1}/${maxRetries}):`, error.message);
      
      // Don't retry on certain errors
      if (error.name === 'AbortError' || 
          error.message.includes('Authentication failed') ||
          error.message.includes('CORS policy') ||
          (error.message.includes('Failed to fetch') && attempt >= 1)) { // Only retry Failed to fetch once
        break;
      }
    }
  }
  
  throw lastError || new Error('API request failed after retries');
}

// Enhanced avatar details function
async function getAvatarDetails(userId) {
  try {
    console.log(`Fetching avatar details for user ID: ${userId}`);
    
    // Parallel requests for better performance
    const [userResponse, outfitResponse] = await Promise.all([
      fetchWithRetry(`https://users.roblox.com/v1/users/${userId}`, {
      method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetchWithRetry(`https://avatar.roblox.com/v1/users/${userId}/avatar`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
    ]);
    
    if (!userResponse.ok) {
      throw new Error(userResponse.status === 404 
        ? `User not found: No Roblox user exists with ID ${userId}`
        : `Failed to fetch user info: HTTP ${userResponse.status}`
      );
    }
    
    if (!outfitResponse.ok) {
      throw new Error(outfitResponse.status === 404
        ? `Avatar not found: User's avatar info is unavailable or private`
        : `Failed to fetch avatar info: HTTP ${outfitResponse.status}`
      );
    }
    
    const [userData, outfitData] = await Promise.all([
      userResponse.json(),
      outfitResponse.json()
    ]);
    
    console.log('Avatar details retrieved successfully:', userData.name);
    
    return {
      userData: userData,
      avatarData: outfitData
    };
  } catch (error) {
    console.error('Get avatar details error:', error);
    
    // Return user-friendly error messages
    if (error.message.includes('User not found') || 
        error.message.includes('Avatar not found')) {
      throw error;
    } else {
      throw new Error(`Failed to fetch avatar details: ${error.message}`);
    }
  }
}

// Enhanced ownership checking with multiple fallback methods
async function checkOwnedItems(avatarData) {
  try {
    console.log('Starting item ownership check:', avatarData);
    const csrfToken = await getCSRFToken();
    
    const batchSize = Math.min(avatarData.batchSize || 5, 10); // Max 10 for safety
    
    // Get current user ID
    const currentUserResponse = await fetchWithRetry('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      }
    });
    
    if (!currentUserResponse.ok) {
      throw new Error('Cannot retrieve user information. Please log in to Roblox.');
    }
    
    const userData = await currentUserResponse.json();
    const userId = userData.id;
    
    console.log('User ID:', userId);
    
    // Get avatar items
    const allItems = avatarData.assets || [];
    console.log('Total items to check:', allItems.length);
    
    if (allItems.length === 0) {
      return {
        success: true,
        missingItems: [],
        ownedItems: [],
        totalItems: 0,
        ownedCount: 0,
        missingCount: 0
      };
    }
    
    const missingItems = [];
    const ownedItems = [];
    
    // Process items in optimized batches
    const batches = [];
    for (let i = 0; i < allItems.length; i += batchSize) {
      batches.push(allItems.slice(i, i + batchSize));
    }
    
    console.log(`Processing ${batches.length} batches with max ${batchSize} items each...`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);
      
      // Process batch items in parallel with limited concurrency
      const batchResults = await Promise.allSettled(
        batch.map(async (asset, index) => {
          // Add staggered delay to prevent rate limiting
          await sleep(index * 200);
          return checkAssetOwnership(asset, userId, csrfToken);
        })
      );
      
      // Process batch results
      batchResults.forEach((result, index) => {
        const asset = batch[index];
        if (result.status === 'fulfilled') {
          const { isOwned, itemDetails } = result.value;
          
          if (isOwned) {
            ownedItems.push({
              id: asset.id,
              name: itemDetails.name || 'Unknown Item',
              assetType: asset.assetType,
              meta: asset.meta || {}
            });
          } else {
            missingItems.push({
              id: asset.id,
              name: itemDetails.name || 'Unknown Item',
              assetType: asset.assetType,
              price: itemDetails.price || 0,
              thumbnail: itemDetails.thumbnail || '',
              url: `https://www.roblox.com/catalog/${asset.id}`,
              meta: asset.meta || {}
            });
          }
        } else {
          console.warn(`Failed to check asset ${asset.id}:`, result.reason);
          // Treat as missing if we can't determine ownership
          missingItems.push({
            id: asset.id,
            name: 'Unknown Item',
            assetType: asset.assetType,
            price: 0,
            thumbnail: '',
            url: `https://www.roblox.com/catalog/${asset.id}`,
            error: result.reason.message,
            meta: asset.meta || {}
          });
        }
      });
          
      // Add delay between batches
      if (batchIndex < batches.length - 1) {
        await sleep(1000);
      }
    }
    
    const result = {
      success: true,
      missingItems: missingItems,
      ownedItems: ownedItems,
      totalItems: allItems.length,
      ownedCount: ownedItems.length,
      missingCount: missingItems.length
    };
    
    console.log(`Ownership check completed: ${ownedItems.length}/${allItems.length} items owned`);
    return result;
    
  } catch (error) {
    console.error('Error checking item ownership:', error);
    throw new Error(`Failed to check item ownership: ${error.message}`);
  }
}

// Helper function to check individual asset ownership
async function checkAssetOwnership(asset, userId, csrfToken) {
  const assetId = asset.id;
          let isOwned = false;
  let itemDetails = {
    name: 'Unknown Item',
    price: 0,
    thumbnail: ''
  };
  
  try {
    // Method 1: Check inventory (most reliable)
          try {
      const inventoryResponse = await fetchWithRetry(
        `https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}`,
        {
              method: 'GET',
              credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        },
        2, 1000
      );
            
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              if (inventoryData.data && inventoryData.data.length > 0) {
                isOwned = true;
          console.log(`✅ Asset ${assetId} found in inventory`);
              }
            }
          } catch (inventoryError) {
      console.warn(`Inventory check failed for ${assetId}:`, inventoryError.message);
          }
          
    // Method 2: If not owned, try avatar API
          if (!isOwned) {
            try {
        const avatarCheckResponse = await fetchWithRetry(
          `https://avatar.roblox.com/v1/avatar/assets/${assetId}/is-owned`,
          {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken
                }
          },
          2, 800
        );
              
              if (avatarCheckResponse.ok) {
                const ownedStatus = await avatarCheckResponse.json();
          isOwned = Boolean(ownedStatus.isOwned || ownedStatus);
                
                if (isOwned) {
            console.log(`✅ Asset ${assetId} ownership confirmed via avatar API`);
                }
              }
            } catch (avatarError) {
        console.warn(`Avatar API check failed for ${assetId}:`, avatarError.message);
            }
          }
          
    // Get item details for both owned and missing items
            try {
      // Method 1: Try newer catalog API first
      const catalogResponse = await fetchWithRetry(
        `https://catalog.roblox.com/v1/catalog/items/details`,
        {
          method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken
          },
          body: JSON.stringify({
            items: [{ itemType: 'Asset', id: assetId }]
          })
        },
        2, 800
      );
              
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json();
        if (catalogData.data && catalogData.data.length > 0) {
          const item = catalogData.data[0];
          itemDetails = {
            name: item.name || 'Unknown Item',
            price: item.price || 0,
            thumbnail: item.imageUrl || ''
          };
          console.log(`✅ Got item details from catalog API for ${assetId}:`, itemDetails.name);
          
          // NEW: Only check bundles if item is NOT free and is not already owned
          // Check if item is genuinely free (price explicitly 0 or null) vs just not found
          const isExplicitlyFree = item.hasOwnProperty('price') && (item.price === 0 || item.price === null);
          const isForSale = item.hasOwnProperty('isForSale') ? item.isForSale : true;
          
          // Additional checks for free items
          const priceStatus = item.priceStatus || '';
          const isOffSale = priceStatus === 'Off Sale' || !isForSale;
          const hasMarketplaceInfo = item.hasOwnProperty('lowestPrice') || item.hasOwnProperty('lowestResalePrice');
          
          // Check for marketplace pricing (Limited/Limited U items)
          if (item.lowestPrice && item.lowestPrice > 0) {
            itemDetails.price = item.lowestPrice;
            console.log(`💰 Using marketplace price for ${assetId}: ${item.lowestPrice} Robux`);
          } else if (item.lowestResalePrice && item.lowestResalePrice > 0) {
            itemDetails.price = item.lowestResalePrice;
            console.log(`💰 Using resale price for ${assetId}: ${item.lowestResalePrice} Robux`);
          } else if (item.price && item.price > 0) {
            itemDetails.price = item.price;
            console.log(`💰 Using direct price for ${assetId}: ${item.price} Robux`);
                }
          
          // If item is explicitly free or off sale, set price to 0
          if (isExplicitlyFree || isOffSale) {
            console.log(`✅ Asset ${assetId} is free/off-sale (price: ${item.price}, forSale: ${isForSale}, status: ${priceStatus})`);
            itemDetails.price = 0;
          } else if (!isOwned && itemDetails.price === 0 && !hasMarketplaceInfo) {
            // Item has no price info - treat as free
            console.log(`✅ Asset ${assetId} has no price info, treating as free item`);
            itemDetails.price = 0;
          }
        }
      } else {
        // Method 2: Fallback to economy API
        const detailsResponse = await fetchWithRetry(
          `https://economy.roblox.com/v2/assets/${assetId}/details`,
          {
                method: 'GET',
                credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          },
          2, 800
        );
              
        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          itemDetails = {
            name: details.Name || 'Unknown Item',
            price: details.PriceInRobux || 0,
            thumbnail: details.IconImageAssetId 
              ? `https://assetdelivery.roblox.com/v1/asset/?id=${details.IconImageAssetId}`
              : ''
          };
          console.log(`✅ Got item details from economy API for ${assetId}:`, itemDetails.name);
          
          // NEW: Only check bundles if item is NOT free and is not already owned
          // Economy API gives more reliable free item detection
          const isExplicitlyFree = details.hasOwnProperty('PriceInRobux') && (details.PriceInRobux === 0 || details.PriceInRobux === null);
          const isForSale = details.hasOwnProperty('IsForSale') ? details.IsForSale : true;
          
          // Additional checks for free items
          const priceStatus = details.priceStatus || '';
          const isOffSale = priceStatus === 'Off Sale' || !isForSale;
          const hasMarketplaceInfo = details.hasOwnProperty('lowestPrice') || details.hasOwnProperty('lowestResalePrice');
          
          // Check for marketplace pricing (Limited/Limited U items)
          if (details.lowestPrice && details.lowestPrice > 0) {
            itemDetails.price = details.lowestPrice;
            console.log(`💰 Using marketplace price for ${assetId}: ${details.lowestPrice} Robux`);
          } else if (details.lowestResalePrice && details.lowestResalePrice > 0) {
            itemDetails.price = details.lowestResalePrice;
            console.log(`💰 Using resale price for ${assetId}: ${details.lowestResalePrice} Robux`);
          } else if (details.price && details.price > 0) {
            itemDetails.price = details.price;
            console.log(`💰 Using direct price for ${assetId}: ${details.price} Robux`);
                }
          
          // If item is explicitly free or off sale, set price to 0
          if (isExplicitlyFree || isOffSale) {
            console.log(`✅ Asset ${assetId} is free/off-sale (price: ${details.PriceInRobux}, forSale: ${isForSale}, status: ${priceStatus})`);
            itemDetails.price = 0;
          } else if (!isOwned && itemDetails.price === 0 && !hasMarketplaceInfo) {
            // Item has no price info - treat as free
            console.log(`✅ Asset ${assetId} has no price info, treating as free item`);
            itemDetails.price = 0;
          }
        }
      }
      
      // Method 3: If no thumbnail yet, try thumbnail API
      if (!itemDetails.thumbnail) {
            try {
          const thumbnailResponse = await fetchWithRetry(
            `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=150x150&format=Png&isCircular=false`,
            {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            },
            2, 600
          );
              
          if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            if (thumbnailData.data && thumbnailData.data.length > 0) {
              const thumbnailUrl = thumbnailData.data[0].imageUrl;
              if (thumbnailUrl && !thumbnailUrl.includes('placeholder')) {
                itemDetails.thumbnail = thumbnailUrl;
                console.log(`✅ Got thumbnail from thumbnail API for ${assetId}`);
              }
            }
                  }
          } catch (thumbnailError) {
          console.warn(`Thumbnail API failed for ${assetId}:`, thumbnailError.message);
                }
              }
      
    } catch (detailsError) {
      console.warn(`Failed to get details for asset ${assetId}:`, detailsError.message);
          
      // Last resort: try direct asset info API
            try {
        const assetInfoResponse = await fetchWithRetry(
          `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`,
          {
            method: 'HEAD',
            credentials: 'include'
          },
          1, 500
        );
        
        if (assetInfoResponse.ok) {
          itemDetails.thumbnail = `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`;
          console.log(`✅ Using direct asset URL for thumbnail: ${assetId}`);
        }
      } catch (finalError) {
        console.warn(`All thumbnail methods failed for ${assetId}`);
      }
    }
    
    return { isOwned, itemDetails };
    
  } catch (error) {
    console.error(`Error checking ownership for asset ${assetId}:`, error.message);
    // Return default values instead of throwing to prevent cascade failures
    return {
      isOwned: false,
      itemDetails: {
        name: `Asset ${assetId} (Check Failed)`,
        price: 0,
        thumbnail: '',
        error: error.message
      }
    };
            }
          }
          
// Enhanced avatar application with improved reliability and error handling
async function applyAvatarChanges(avatarData) {
            try {
    console.log('Starting avatar application process:', avatarData);
    const csrfToken = await getCSRFToken();
    
    // Validate avatar data
    if (!avatarData || !avatarData.assets) {
      throw new Error('Invalid avatar data provided');
    }
    
    const steps = [
      { name: 'Set Avatar Type', func: () => setAvatarType(avatarData, csrfToken) },
      { name: 'Clear Current Avatar', func: () => clearCurrentAvatar(csrfToken) },
      { name: 'Set Body Colors', func: () => setBodyColors(avatarData, csrfToken) },
      { name: 'Set Body Scales', func: () => setBodyScales(avatarData, csrfToken) },
      { name: 'Apply Assets', func: () => applyAvatarAssets(avatarData, csrfToken) },
      { name: 'Set Default Clothing', func: () => setDefaultClothing(avatarData, csrfToken) }
    ];
    
    const results = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`Step ${i + 1}/${steps.length}: ${step.name}`);
      
      try {
        const result = await step.func();
        results.push({ step: step.name, success: true, result });
          
        // Add delay between steps to prevent rate limiting
        if (i < steps.length - 1) {
          await sleep(300);
          }
      } catch (stepError) {
        console.warn(`Step "${step.name}" failed:`, stepError);
        results.push({ 
          step: step.name, 
          success: false, 
          error: stepError.message 
        });
        
        // Continue with other steps even if one fails
        await sleep(500);
        }
    }
    
    // Check final results
    const successfulSteps = results.filter(r => r.success).length;
    const totalSteps = results.length;
    
    console.log(`Avatar application completed: ${successfulSteps}/${totalSteps} steps successful`);
    
    const isSuccessful = successfulSteps > totalSteps / 2; // Consider successful if more than half steps worked
    
    // If avatar application was successful, trigger automatic redraw
    if (isSuccessful) {
  try {
        console.log('Avatar application successful, triggering auto-redraw with delay...');
    
        // Add delay to allow user to close popup and interact with page if needed
        setTimeout(async () => {
          let redrawSuccessCount = 0;
          let redrawFailCount = 0;
          
          // Send message to all Roblox tabs to auto-redraw avatar
          chrome.tabs.query({ url: "*://*.roblox.com/*" }, (tabs) => {
            const tabPromises = tabs.map(tab => {
              return new Promise((resolve) => {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'autoRedrawAvatar'
                }, (response) => {
                  if (chrome.runtime.lastError) {
                    console.log(`Could not send redraw message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                    redrawFailCount++;
                    resolve(false);
                  } else if (response && response.success) {
                    console.log(`✅ Auto-redraw successful on tab ${tab.id}`);
                    redrawSuccessCount++;
                    resolve(true);
      } else {
                    console.log(`⚠️ Auto-redraw failed on tab ${tab.id}:`, response?.error || 'Unknown error');
                    redrawFailCount++;
                    resolve(false);
                  }
                });
              });
            });
        
            // Wait for all redraw attempts to complete, then notify popup
            Promise.allSettled(tabPromises).then(() => {
              // Send notification to popup
              chrome.runtime.sendMessage({
                action: 'notifyPopup',
                type: 'autoRedrawResult',
                data: {
                  success: redrawSuccessCount > 0,
                  successCount: redrawSuccessCount,
                  failCount: redrawFailCount,
                  totalTabs: tabs.length,
                  message: redrawSuccessCount > 0 
                    ? 'autoRedrawSuccess'
                    : 'refreshManually'
                }
              }).catch(err => {
                console.log('Could not notify popup:', err);
              });
            });
          });
        }, 2000); // 2 second delay
        
      } catch (redrawError) {
        console.warn('Failed to trigger auto-redraw:', redrawError);
        // Send error notification to popup
        chrome.runtime.sendMessage({
          action: 'notifyPopup',
          type: 'autoRedrawResult',
          data: {
            success: false,
            message: 'autoRedrawError'
          }
        }).catch(err => {
          console.log('Could not notify popup:', err);
        });
      }
    }
    
    return { 
      success: isSuccessful,
      message: `Avatar applied successfully (${successfulSteps}/${totalSteps} steps completed)`,
      details: results,
      avatarData: avatarData
    };
    
  } catch (error) {
    console.error('Avatar application failed:', error);
    throw new Error(`Failed to apply avatar changes: ${error.message}`);
  }
}

// Helper function to set avatar type
async function setAvatarType(avatarData, csrfToken) {
  if (!avatarData.playerAvatarType) {
    return { skipped: 'No avatar type specified' };
  }
  
  const response = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-player-avatar-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          playerAvatarType: avatarData.playerAvatarType
        })
  }, 2, 1000);
      
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to set avatar type: ${errorData}`);
      }
      
  return { success: `Avatar type set to: ${avatarData.playerAvatarType}` };
    }
    
// Helper function to clear current avatar
async function clearCurrentAvatar(csrfToken) {
  const response = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-wearing-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ assetIds: [] })
  }, 2, 1000);
      
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to clear avatar: ${errorData}`);
  }
  
  return { success: 'Avatar cleared successfully' };
      }
      
// Helper function to set body colors
async function setBodyColors(avatarData, csrfToken) {
  if (!avatarData.bodyColors) {
    return { skipped: 'No body colors specified' };
  }
  
  const bodyColors = {
      headColorId: avatarData.bodyColors.headColorId,
      torsoColorId: avatarData.bodyColors.torsoColorId,
      rightArmColorId: avatarData.bodyColors.rightArmColorId,
      leftArmColorId: avatarData.bodyColors.leftArmColorId,
      rightLegColorId: avatarData.bodyColors.rightLegColorId,
      leftLegColorId: avatarData.bodyColors.leftLegColorId
    };
      
  // Try primary body colors API
    try {
    const response = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-body-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
      body: JSON.stringify(bodyColors)
    }, 2, 1000);
      
    if (response.ok) {
      return { success: 'Body colors set successfully (primary API)' };
    }
  } catch (primaryError) {
    console.warn('Primary body colors API failed, trying fallback');
  }
        
  // Try fallback API
  const fallbackResponse = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-colors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken
            },
            credentials: 'include',
    body: JSON.stringify(bodyColors)
  }, 2, 1000);
          
  if (!fallbackResponse.ok) {
    const errorData = await fallbackResponse.text();
    throw new Error(`Failed to set body colors: ${errorData}`);
        }
  
  return { success: 'Body colors set successfully (fallback API)' };
    }
    
// Helper function to set body scales
async function setBodyScales(avatarData, csrfToken) {
  if (!avatarData.scales) {
    return { skipped: 'No body scales specified' };
  }
  
  const scales = {
        height: avatarData.scales.height,
        width: avatarData.scales.width,
        head: avatarData.scales.head,
        depth: avatarData.scales.depth,
        proportion: avatarData.scales.proportion,
        bodyType: avatarData.scales.bodyType
      };
      
  const response = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-scales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
    body: JSON.stringify(scales)
  }, 2, 1000);
      
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to set body scales: ${errorData}`);
  }
  
  return { success: 'Body scales set successfully' };
    }
    
// Helper function to apply avatar assets with improved reliability
async function applyAvatarAssets(avatarData, csrfToken) {
  if (!avatarData.assets || avatarData.assets.length === 0) {
    return { skipped: 'No assets to apply' };
  }
  
      const assetIds = avatarData.assets.map(asset => asset.id);
  console.log('Applying assets:', assetIds);
      
  // Method 1: Try bulk application first (fastest)
        try {
    const bulkResponse = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-wearing-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken
            },
        credentials: 'include',
      body: JSON.stringify({ assetIds: assetIds })
    }, 2, 1000);
          
    if (bulkResponse.ok) {
      return { success: `All ${assetIds.length} assets applied successfully (bulk method)` };
    }
    
    console.warn('Bulk asset application failed, trying individual method');
  } catch (bulkError) {
    console.warn('Bulk asset application error:', bulkError);
          }
          
  // Method 2: Apply assets individually (more reliable)
  const individualResults = [];
  const batchSize = 3; // Process in small batches to avoid rate limiting
  
  for (let i = 0; i < assetIds.length; i += batchSize) {
    const batch = assetIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (assetId, index) => {
      try {
        // Stagger requests within batch
        await sleep(index * 300);
        
        const response = await fetchWithRetry(`https://avatar.roblox.com/v1/avatar/assets/${assetId}/wear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
            credentials: 'include'
        }, 2, 1000);
        
        if (response.ok) {
          return { assetId, success: true };
        } else {
          const errorText = await response.text();
          return { assetId, success: false, error: errorText };
        }
      } catch (error) {
        return { assetId, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        individualResults.push(result.value);
      } else {
        individualResults.push({ assetId: 'unknown', success: false, error: result.reason.message });
      }
    });
    
    // Wait between batches
    if (i + batchSize < assetIds.length) {
      await sleep(1000);
      }
  }
  
  const successCount = individualResults.filter(r => r.success).length;
  
  if (successCount === 0) {
    throw new Error('Failed to apply any assets');
    }
    
  return { 
    success: `${successCount}/${assetIds.length} assets applied successfully (individual method)`,
    details: individualResults
  };
}

// Helper function to set default clothing options
async function setDefaultClothing(avatarData, csrfToken) {
  if (avatarData.defaultShirtApplied === undefined && avatarData.defaultPantsApplied === undefined) {
    return { skipped: 'No default clothing settings specified' };
  }
  
  const response = await fetchWithRetry('https://avatar.roblox.com/v1/avatar/set-default-clothing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({
            defaultShirtApplied: avatarData.defaultShirtApplied || false,
            defaultPantsApplied: avatarData.defaultPantsApplied || false
          })
  }, 2, 1000);
        
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to set default clothing: ${errorData}`);
  }
  
  return { success: 'Default clothing settings applied successfully' };
}

// Get thumbnail for an asset
async function getThumbnail(assetId) {
  try {
    console.log(`Fetching thumbnail for asset ID: ${assetId}`);
    
    // Method 1: Try Roblox thumbnail API
    const thumbnailResponse = await fetchWithRetry(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=150x150&format=Png&isCircular=false`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      },
      2, 800
    );
    
    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json();
      if (thumbnailData.data && thumbnailData.data.length > 0) {
        const thumbnailUrl = thumbnailData.data[0].imageUrl;
        if (thumbnailUrl && !thumbnailUrl.includes('placeholder')) {
          console.log(`✅ Got thumbnail for asset ${assetId}`);
          return { thumbnailUrl: thumbnailUrl };
        }
      }
    }
    
    // Method 2: Try asset delivery API as fallback
    try {
      const assetResponse = await fetchWithRetry(
        `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`,
        {
          method: 'HEAD',
          credentials: 'include'
        },
        1, 500
      );
      
      if (assetResponse.ok) {
        const directUrl = `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`;
        console.log(`✅ Using direct asset URL for thumbnail: ${assetId}`);
        return { thumbnailUrl: directUrl };
      }
    } catch (fallbackError) {
      console.warn(`Fallback thumbnail method failed for ${assetId}:`, fallbackError.message);
    }
    
    // No thumbnail found
    console.warn(`No thumbnail found for asset ${assetId}`);
    return { thumbnailUrl: null };
    
  } catch (error) {
    console.error(`Error getting thumbnail for asset ${assetId}:`, error);
    throw new Error(`Failed to get thumbnail: ${error.message}`);
  }
    }
    
// Get current authenticated user ID
async function getCurrentUserId() {
  try {
    console.log('Fetching current authenticated user ID...');
    
    const csrfToken = await getCSRFToken();
    
    const response = await fetchWithRetry('https://users.roblox.com/v1/users/authenticated', {
        method: 'GET',
      credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
      }
    }, 2, 1000);
      
    if (!response.ok) {
      throw new Error('Cannot retrieve current user information. Please log in to Roblox.');
    }
    
    const userData = await response.json();
    const userId = userData.id;
    
    if (!userId) {
      throw new Error('User ID not found in response');
    }
    
    console.log(`✅ Current user ID: ${userId}`);
    return userId;
    
  } catch (error) {
    console.error('Error getting current user ID:', error);
    throw new Error(`Failed to get current user ID: ${error.message}`);
  }
}

// Function to get the current user's Robux balance
async function getCurrentUserRobux() {
  console.log('Fetching current user Robux balance...');
  
  try {
    // First check if user is logged in by checking cookies
    const roblosecurityCookie = await new Promise((resolve) => {
      chrome.cookies.get({
        url: 'https://www.roblox.com',
        name: '.ROBLOSECURITY'
      }, (cookie) => {
        resolve(cookie);
      });
      });
      
    if (!roblosecurityCookie) {
      throw new Error('Please log in to Roblox website first.');
    }
    
    console.log('✅ User is logged in to Roblox');
    
    let csrfToken;
    try {
      csrfToken = await getCSRFToken(); // Get CSRF token
    } catch (csrfError) {
      console.warn('Could not get CSRF token:', csrfError.message);
      // Continue without CSRF token for GET requests
    }
    
    // Method 1: Try users authenticated endpoint first (most reliable)
    try {
      console.log('Trying users.roblox.com/v1/users/authenticated...');
      const userResponse = await fetchWithRetry('https://users.roblox.com/v1/users/authenticated', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 1, 1000); // Single retry with longer delay

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(`✅ Got authenticated user info: ${userData.name} (ID: ${userData.id})`);
        
        // Try to get currency for this user using economy API
        try {
          console.log(`Trying economy.roblox.com/v2/users/${userData.id}/currency...`);
          const headers = {
            'Content-Type': 'application/json'
          };
          if (csrfToken) {
            headers['x-csrf-token'] = csrfToken;
          }
          
          const currencyResponse = await fetchWithRetry(`https://economy.roblox.com/v2/users/${userData.id}/currency`, {
            method: 'GET',
            credentials: 'include',
            headers: headers
          }, 1, 1000);

          if (currencyResponse.ok) {
            const currencyData = await currencyResponse.json();
            if (typeof currencyData.robux === 'number') {
              console.log('✅ Robux balance fetched successfully via economy API:', currencyData.robux);
              return currencyData.robux;
            }
          }
        } catch (economyError) {
          console.warn('Economy API failed:', economyError.message);
        }
      }
    } catch (method1Error) {
      console.warn('Method 1 (authenticated user) failed:', method1Error.message);
    }
    
    // Method 2: Try economy API without user ID
    try {
      console.log('Trying economy.roblox.com/v1/user/currency...');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
      
      const response2 = await fetchWithRetry('https://economy.roblox.com/v1/user/currency', {
        method: 'GET',
        credentials: 'include',
        headers: headers
      }, 1, 1000);

      if (response2.ok) {
        const data = await response2.json();
        if (typeof data.robux === 'number') {
          console.log('✅ Robux balance fetched successfully via economy v1 API:', data.robux);
          return data.robux;
        }
      } else {
        console.warn(`Economy v1 API response not OK: ${response2.status} ${response2.statusText}`);
      }
    } catch (method2Error) {
      console.warn('Method 2 (economy v1) failed:', method2Error.message);
    }
    
    // Method 3: Try the original API endpoint (may be deprecated)
    try {
      console.log('Trying api.roblox.com/currency/balance...');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
      
      const response3 = await fetchWithRetry('https://api.roblox.com/currency/balance', {
        method: 'GET',
        credentials: 'include',
        headers: headers
      }, 1, 1000);

      if (response3.ok) {
        const data = await response3.json();
        if (typeof data.robux === 'number') {
          console.log('✅ Robux balance fetched successfully via api.roblox.com:', data.robux);
          return data.robux;
        }
      } else {
        console.warn(`API response not OK: ${response3.status} ${response3.statusText}`);
      }
    } catch (method3Error) {
      console.warn('Method 3 (api.roblox.com) failed:', method3Error.message);
    }
    
    // If all methods fail, provide helpful error message
    console.error('❌ All Robux balance methods failed');
    throw new Error('Unable to retrieve Robux balance. This might be due to:\n• Roblox API changes\n• Network connectivity issues\n• Need to refresh the page and try again');
    
  } catch (error) {
    console.error('Error in getCurrentUserRobux:', error);
    
    // Return more user-friendly error messages
    if (error.message.includes('session not found') || error.message.includes('log in')) {
      throw new Error('Please log in to Roblox website first.');
    } else if (error.message.includes('CSRF token')) {
      throw new Error('Authentication error. Please refresh the page and try again.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error(error.message || 'Could not retrieve Robux balance. Please try again later.');
    }
  }
}
