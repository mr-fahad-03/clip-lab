const API_KEYS = [
  'AIzaSyBvrVT4liKsXAGGEM5CLU-yUK4GRMdkp_k',
  'AIzaSyAMJZ1gzKQmRtvBJOEP3fjbJgR510kcp4Q',
  'AIzaSyAJMtmo9hlTVSBP05gyjetMxHrWchtZ5dE',
  'AIzaSyCOBPnvFree3lv01u5vnDtbNa3footJXz4',
  'AIzaSyBomsQsmCLTL-Xbf8WZOBKEb1QeIigRvNM'
];

let currentKeyIndex = 0;
let quotaExceededKeys = new Set();

export const getNextApiKey = () => {
  // If all keys have exceeded quota, reset the exceeded keys set
  if (quotaExceededKeys.size === API_KEYS.length) {
    quotaExceededKeys.clear();
  }

  // Find the next available key that hasn't exceeded quota
  let attempts = 0;
  while (attempts < API_KEYS.length) {
    if (!quotaExceededKeys.has(currentKeyIndex)) {
      return API_KEYS[currentKeyIndex];
    }
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    attempts++;
  }

  // If no keys are available, return the first key
  return API_KEYS[0];
};

export const markKeyAsExceeded = (apiKey) => {
  const keyIndex = API_KEYS.indexOf(apiKey);
  if (keyIndex !== -1) {
    quotaExceededKeys.add(keyIndex);
    currentKeyIndex = (keyIndex + 1) % API_KEYS.length;
  }
};

export const fetchYoutubeApi = async (endpoint, params) => {
  let attempts = 0;
  const maxAttempts = API_KEYS.length;

  while (attempts < maxAttempts) {
    const apiKey = getNextApiKey();
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/${endpoint}?key=${apiKey}&${params}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if the error is due to quota exceeded
        if (errorData.error && (
          errorData.error.message.includes('quota') || 
          errorData.error.message.includes('Quota')
        )) {
          markKeyAsExceeded(apiKey);
          attempts++;
          continue; // Try with next API key
        }

        throw new Error(errorData.error.message || `API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempts === maxAttempts - 1) {
        throw error; // Throw error if all keys have been tried
      }
      attempts++;
    }
  }

  throw new Error('All API keys have exceeded their quota');
}; 