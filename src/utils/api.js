/**
 * API utility functions for the survey application
 */

const API_URL = "https://tools.qrplus.ai/api/v1/survey/getTicket";
const VOTE_API_URL = "https://tools.qrplus.ai/api/v1/survey/registerVote";
const REGISTER_VOTER_URL = "https://tools.qrplus.ai/api/v1/survey/registerVoter";
const VOTE_PARAMS_URL = "https://tools.qrplus.ai/api/v1/survey/voteParams";
const DEFAULT_IMAGE = "/images/face.png";

/**
 * Registers a voter to start the survey
 * @param {string} voter_name - Name of the voter
 * @param {string} start_idx - Starting image index
 * @param {string} end_idx - Ending image index
 * @returns {Promise<Object>} - The API response with voter details
 */
export async function registerVoter(voter_name, start_idx, end_idx) {
  try {
    console.log(`Registering voter: ${voter_name}, range: ${start_idx}-${end_idx}`);
    
    const response = await fetch(REGISTER_VOTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "voter_name": voter_name,
        "start_idx": start_idx,
        "end_idx": end_idx
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Voter registered successfully:", data);
    return data;
  } catch (error) {
    console.error("Error registering voter:", error);
    throw error;
  }
}

/**
 * Fetches images from the API based on the provided parameters
 * @param {number} imageId - The ID of the image (must be between start_idx and end_idx-1)
 * @param {number} idx1 - The first variant index (between 0 and n_variants-1)
 * @param {number} idx2 - The second variant index (between 0 and n_variants-1)
 * @param {number|string} voter_id - The voter ID returned from registerVoter
 * @returns {Promise<Object>} - The API response with ticket ID and images
 */
export async function fetchSurveyImages(imageId, idx1, idx2, voter_id) {
  try {
    console.log(`Fetching images for voter: ${voter_id}`);
    
    // Make sure voter_id is a string for the API request
    const voterIdStr = String(voter_id);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_id: imageId.toString(),
        voter_id: voterIdStr,
        idx1: idx1.toString(),
        idx2: idx2.toString()
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw API response:", JSON.stringify(data).substring(0, 200) + "...");
    
    try {
      // Process the API response based on the documented structure
      const ticketId = data.ticket_id || null;
      const originalImage = data.image || DEFAULT_IMAGE;
      const variantImages = [
        data.qr1 || DEFAULT_IMAGE,
        data.qr2 || DEFAULT_IMAGE
      ];
      
      console.log("Processed getTicket response:", { 
        ticketId,
        voter_id: data.voter_id,
        hasOriginalImage: !!originalImage,
        hasVariant1: !!data.qr1,
        hasVariant2: !!data.qr2
      });
      
      return { ticketId, originalImage, variantImages };
      
    } catch (error) {
      console.error("Error processing API response:", error);
      return { 
        ticketId: null,
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
 * Generates random indices for variants
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
 * @param {number} vote - The variant index the user voted for (between 0 and n_variants-1)
 * @param {number|string} voter_id - The voter ID returned from registerVoter
 * @returns {Promise<Object>} - The API response
 */
export async function registerVote(ticketId, vote, voter_id) {
  try {
    console.log(`Registering vote for voter: ${voter_id}, ticket: ${ticketId}, vote: ${vote}`);
    
    const response = await fetch(VOTE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        vote: vote.toString(),
        voter_id: String(voter_id)
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Vote registered successfully:", data);
    return data;
  } catch (error) {
    console.error("Error registering vote:", error);
    throw error;
  }
}

/**
 * Fetches vote parameters for a specific voter
 * @param {number|string} voterId - The voter ID returned from registerVoter
 * @returns {Promise<Object>} - The API response with voter parameters
 */
export async function fetchVoteParams(voterId) {
  try {
    console.log(`Fetching vote parameters for voter: ${voterId}`);
    
    const response = await fetch(`${VOTE_PARAMS_URL}/${voterId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Vote parameters received:", data);
    
    return {
      voter_name: data.voter_name,
      n_variants: data.n_variants,
      start_idx: data.start_idx,
      end_idx: data.end_idx
    };
    
  } catch (error) {
    console.error("Error fetching vote parameters:", error);
    throw error;
  }
} 