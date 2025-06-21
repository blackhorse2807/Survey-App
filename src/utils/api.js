/**
 * API utility functions for the survey application
 */

const API_URL = "https://tools.qrplus.ai/api/v1/survey/getTicket";
const VOTE_API_URL = "https://tools.qrplus.ai/api/v1/survey/registerVote";
const DEFAULT_IMAGE = "/images/face.png";
const USER_ID_KEY = "survey_app_user_id";

/**
 * Generates or retrieves a unique user ID
 * @returns {string} - The user ID
 */
export function getUserId() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'server-side';
  }
  
  // Try to get existing user ID from localStorage
  let userId = localStorage.getItem(USER_ID_KEY);
  
  // If no user ID exists, generate a new one
  if (!userId) {
    userId = generateUniqueId();
    localStorage.setItem(USER_ID_KEY, userId);
    console.log(`New user ID generated: ${userId}`);
  } else {
    console.log(`Existing user ID found: ${userId}`);
  }
  
  return userId;
}

/**
 * Generates a unique ID
 * @returns {string} - A unique ID
 */
function generateUniqueId() {
  // Generate a random string + timestamp for uniqueness
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
}

/**
 * Fetches images from the API based on the provided parameters
 * @param {number} imageId - The ID of the image (0-99)
 * @param {number} idx1 - The first variant index (0-4)
 * @param {number} idx2 - The second variant index (0-4)
 * @returns {Promise<Object>} - The API response with ticket ID and images
 */
export async function fetchSurveyImages(imageId, idx1, idx2) {
  try {
    const userId = getUserId();
    console.log(`Fetching images for user: ${userId}`);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_id: imageId.toString(),
        idx1: idx1.toString(),
        idx2: idx2.toString(),
        user_id: userId // Include user ID in the request
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    try {
      // Process the API response
      let ticketId = null;
      let originalImage = DEFAULT_IMAGE;
      let variantImages = [DEFAULT_IMAGE, DEFAULT_IMAGE];
      
      // Extract ticket ID
      if (data && typeof data === 'object' && data.ticket) {
        ticketId = String(data.ticket);
        
        // Extract original image
        if (data.image) {
          originalImage = data.image;
        }
        
        // Extract variant images
        if (data.qr1 && data.qr2) {
          variantImages = [data.qr1, data.qr2];
        }
      } else if (typeof data === 'string') {
        // If data is just a string (ticket ID)
        ticketId = data;
      }
      
      console.log("API response processed:", { ticketId, hasOriginalImage: !!originalImage, hasVariantImages: variantImages.length === 2 });
      return { ticketId, originalImage, variantImages };
      
    } catch (error) {
      console.error("Error processing API response:", error);
      return { 
        ticketId: `ticket-${imageId}-${idx1}-${idx2}`,
        originalImage: DEFAULT_IMAGE,
        variantImages: [DEFAULT_IMAGE, DEFAULT_IMAGE]
      };
    }
  } catch (error) {
    console.error("Error fetching survey images:", error);
    throw error;
  }
}

/**
 * Generates a URL for the original image
 * @param {number} imageId - The ID of the image (0-99)
 * @returns {string} - The URL of the original image
 */

/**
 * Generates a URL for a variant image
 * @param {number} imageId - The ID of the image (0-99)
 * @param {number} variantIdx - The variant index (0-4)
 * @returns {string} - The URL of the variant image

/**
 * Generates a random index pair for variants
 * @returns {Array<number>} - Array containing two different random indices between 0 and 4
 */
export function getRandomVariantIndices() {
  let idx1 = Math.floor(Math.random() * 5);
  let idx2;
  
  do {
    idx2 = Math.floor(Math.random() * 5);
  } while (idx1 === idx2);
  
  return [idx1, idx2];
}

/**
 * Ensures image ID stays within the valid range (0-99)
 * @param {number} id - The image ID to normalize
 * @returns {number} - The normalized image ID
 */
export function normalizeImageId(id) {
  if (id < 0) return 99;
  if (id > 99) return 0;
  return id;
}

/**
 * Registers a user's vote with the API
 * @param {string} ticketId - The ticket ID from the getTicket API call
 * @param {number} vote - The variant index the user voted for (0-4)
 * @returns {Promise<Object>} - The API response
 */
export async function registerVote(ticketId, vote) {
  try {
    const userId = getUserId();
    console.log(`Registering vote for user: ${userId}`);
    
    const response = await fetch(VOTE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        vote: vote.toString(),
        user_id: userId // Include user ID in the request
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error registering vote:", error);
    throw error;
  }
} 