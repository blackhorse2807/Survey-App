"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchSurveyImages, getRandomVariantIndices, normalizeImageId, registerVote, getUserId } from "../utils/api";
import ImageSelector from "../components/ImageSelector";
import { Toaster, toast } from "react-hot-toast";
import useWindowSize from "@/hooks/useWindowSize";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showText, setShowText] = useState(false);
  const [imageId, setImageId] = useState(0);
  const [idx1, setIdx1] = useState(Math.floor(Math.random() * 5));
  const [idx2, setIdx2] = useState(Math.floor(Math.random() * 5));
  const [originalImage, setOriginalImage] = useState("/images/face.png");
  const [variantImages, setVariantImages] = useState(["/images/face.png", "/images/face.png"]);
  const [loading, setLoading] = useState(false);
  const [votingHistory, setVotingHistory] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [shownPairs, setShownPairs] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const windowSize = useWindowSize();
  
  // Total possible pairs for each image (combinations of 5 choose 2)
  const TOTAL_POSSIBLE_PAIRS = 10;

  useEffect(() => {
    // Initialize user ID
    const id = getUserId();
    setUserId(id);
    console.log("User ID initialized:", id);
    
    // Show first screen with no text
    setTimeout(() => {
      // Show text after 1 second
      setShowText(true);
      
      // Move to screen 3 after 3 seconds
      setTimeout(() => {
        setCurrentScreen(3);
        fetchImages();
      }, 3000);
    }, 1000);
  }, []);

  // Reset shown pairs when image ID changes
  useEffect(() => {
    setShownPairs(new Set());
  }, [imageId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await fetchSurveyImages(imageId, idx1, idx2);
      
      // Set the ticket ID from the response
      if (data.ticketId) {
        setTicketId(data.ticketId);
      }
      
      // Set the original image from the response
      if (data.originalImage) {
        setOriginalImage(data.originalImage);
        console.log("Original image received, length:", 
          typeof data.originalImage === 'string' ? data.originalImage.substring(0, 20) + '...' : 'not a string');
      }
      
      // Set the variant images from the response
      if (data.variantImages && Array.isArray(data.variantImages) && 
          data.variantImages.length === 2) {
        setVariantImages(data.variantImages);
        console.log("Variant images received:", 
          data.variantImages.map(img => typeof img === 'string' ? img.substring(0, 20) + '...' : 'not a string'));
      }
      
      console.log(`Fetched images with image_id: ${imageId}, idx1: ${idx1}, idx2: ${idx2}, ticket: ${data.ticketId}`);
      
      // Add this pair to the shown pairs set
      const pairKey = [idx1, idx2].sort().join('-');
      setShownPairs(prev => {
        const newSet = new Set(prev);
        newSet.add(pairKey);
        console.log(`Added pair ${pairKey} to shown pairs. Total: ${newSet.size}/${TOTAL_POSSIBLE_PAIRS}`);
        return newSet;
      });
      
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to fetch images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to change to the next original image
  const moveToNextOriginalImage = () => {
    setImageId((prevId) => {
      const newId = prevId + 1;
      return normalizeImageId(newId);
    });
    
    // Reset shown pairs for the new image
    setShownPairs(new Set());
    
    // Get new random variants for the new image
    const [newIdx1, newIdx2] = getRandomVariantIndices();
    setIdx1(newIdx1);
    setIdx2(newIdx2);
    
    toast.success("Moving to next original image!");
    fetchImages();
  };

  // Function to get a new random pair that hasn't been shown yet
  const getNewRandomPair = () => {
    // If we've shown all possible pairs, move to next original image
    if (shownPairs.size >= TOTAL_POSSIBLE_PAIRS) {
      console.log("All pairs shown, moving to next original image");
      moveToNextOriginalImage();
      return;
    }
    
    // Try to find a pair that hasn't been shown yet
    let attempts = 0;
    let newIdx1, newIdx2, pairKey;
    let foundNewPair = false;
    
    do {
      // Get random indices
      newIdx1 = Math.floor(Math.random() * 5);
      newIdx2 = Math.floor(Math.random() * 5);
      
      // Make sure they're different
      if (newIdx1 === newIdx2) {
        continue;
      }
      
      // Create a unique key for this pair (order doesn't matter)
      pairKey = [newIdx1, newIdx2].sort().join('-');
      attempts++;
      
      // Check if this pair has already been shown
      if (!shownPairs.has(pairKey)) {
        foundNewPair = true;
        break;
      }
      
      // If we've tried too many times, just use any pair
      if (attempts > 20) {
        console.log("Too many attempts to find a new pair, using any pair");
        break;
      }
    } while (!foundNewPair && attempts < 20);
    
    console.log(`Selected new pair: ${newIdx1}, ${newIdx2} (${pairKey})`);
    setIdx1(newIdx1);
    setIdx2(newIdx2);
    fetchImages();
  };

  // Function to handle changing variants (called by timer or manually)
  const handleChangeVariants = () => {
    if (!loading) {
      console.log("Changing variants");
      getNewRandomPair();
    }
  };

  const handleSubmitVote = async (selectedVariant) => {
    if (selectedVariant === null) {
      toast.error("Please select a variant first");
      return;
    }
    
    try {
      setLoading(true);
      // Map the selected variant (0 or 1) to the actual variant index (idx1 or idx2)
      const voteValue = selectedVariant === 0 ? idx1 : idx2;
      
      console.log(`Submitting vote for ticket ${ticketId}, variant ${voteValue}, user ${userId}`);
      const response = await registerVote(ticketId, voteValue);
      
      // Record the vote in history
      setVotingHistory(prev => [
        ...prev, 
        { ticketId, imageId, selectedVariant: voteValue, userId }
      ]);
      
      toast.success("Vote submitted successfully!");
      
      // Get a new random pair or move to next image if all pairs shown
      setTimeout(() => {
        getNewRandomPair();
      }, 500);
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-blue-400 to-blue-600">
      <Toaster position="top-center" />
      
      {/* Screen 1 - Empty gradient background */}
      <div className="screen screen-1" style={{ 
        opacity: currentScreen === 1 ? 1 : 0,
        zIndex: currentScreen === 1 ? 2 : 0,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div className="text-center" style={{
          opacity: showText ? 1 : 0,
          transform: showText ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          fontSize: windowSize.width < 768 ? "24px" : "50px",
          fontFamily: "var(--gotham-light)",
          fontWeight: "500",
          color: "white",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)"
        }}>
          Select Your Image!!
        </div>
      </div>

      {/* Screen 3 - Image selection screen */}
      <div className="screen screen-3" style={{ 
        opacity: currentScreen === 3 ? 1 : 0,
        zIndex: currentScreen === 3 ? 2 : 0,
        padding: windowSize.width < 768 ? "10px 5px" : "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        width: "100%",
        height: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ 
          width: "100%", 
          maxWidth: "800px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <ImageSelector 
            originalImage={originalImage}
            variantImages={variantImages}
            imageId={imageId}
            idx1={idx1}
            idx2={idx2}
            loading={loading}
            onChangeVariants={handleChangeVariants}
            onSubmit={handleSubmitVote}
          />
          
          {/* Debug information - can be removed in production */}
          <div style={{ 
            marginTop: "20px", 
            fontSize: "12px", 
            color: "rgba(255,255,255,0.7)",
            textAlign: "center"
          }}>
            {/* <div>Shown pairs: {shownPairs.size}/{TOTAL_POSSIBLE_PAIRS}</div> */}
            {/* <div style={{ marginTop: "5px" }}>User ID: {userId ? userId.substring(0, 8) + '...' : 'Loading...'}</div> */}
          </div>
        </div>
      </div>
    </main>
  );
}