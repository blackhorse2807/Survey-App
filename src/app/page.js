"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchSurveyImages, getRandomVariantIndices, normalizeImageId, registerVote, registerVoter, fetchVoteParams } from "../utils/api";
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
  // Voter data state
  const [voterData, setVoterData] = useState(null);
  const [voterId, setVoterId] = useState(null);
  const [maxImages, setMaxImages] = useState(100);
  const [nVariants, setNVariants] = useState(5);
  const [startIdx, setStartIdx] = useState(Math.floor(Math.random() * 20));
  const [endIdx, setEndIdx] = useState(Math.floor(Math.random() * 70) + 10);
  // Flag to indicate if initial images have loaded
  const [initialImagesLoaded, setInitialImagesLoaded] = useState(false);
  const windowSize = useWindowSize();
  
  // Total possible pairs for each image (combinations of n_variants choose 2)
  const [totalPossiblePairs, setTotalPossiblePairs] = useState(10);

  useEffect(() => {
    // Set total possible pairs based on n_variants
    // Formula for combinations: n! / (r! * (n-r)!) where n is n_variants and r is 2
    if (nVariants && nVariants > 1) {
      const possiblePairs = nVariants * (nVariants - 1) / 2;
      setTotalPossiblePairs(possiblePairs);
    }
  }, [nVariants]);

  useEffect(() => {
    // Show first screen with no text
    setTimeout(() => {
      // Show text after 1 second
      setShowText(true);
      
      // Register voter
      handleRegisterVoter();
    }, 1000);
  }, []);

  // Reset shown pairs when image ID changes
  useEffect(() => {
    setShownPairs(new Set());
  }, [imageId]);

  // Select a valid image ID within the range
  const getValidImageId = () => {
    // Start with current imageId
    let validId = imageId;
    
    // Check if startIdx and endIdx are valid numbers
    const startIndex = parseInt(startIdx);
    const endIndex = parseInt(endIdx);
    
    if (!isNaN(startIndex) && !isNaN(endIndex) && endIndex > startIndex) {
      // If current imageId is outside the valid range, choose a random one in range
      if (validId < startIndex || validId >= endIndex) {
        validId = startIndex + Math.floor(Math.random() * (endIndex - startIndex));
      }
    }
    
    return validId;
  };

  // Get random variant indices based on n_variants
  const getRandomVariantPair = () => {
    const max = nVariants ? nVariants - 1 : 4; // Default to 0-4 if nVariants not set
    
    let index1 = Math.floor(Math.random() * (max + 1)); // 0 to max inclusive
    let index2;
    
    // Ensure index2 is different from index1
    do {
      index2 = Math.floor(Math.random() * (max + 1));
    } while (index1 === index2);
    
    return [index1, index2];
  };

  // Helper to call API and update image states in one place
  const fetchAndUpdate = async (imgId, varIdx1, varIdx2, vid) => {
    try {
      const data = await fetchSurveyImages(imgId, varIdx1, varIdx2, vid);

      // Update ticket id
      if (data.ticketId) setTicketId(data.ticketId);

      // Update images
      if (data.originalImage) setOriginalImage(data.originalImage);
      if (data.variantImages && Array.isArray(data.variantImages) && data.variantImages.length === 2) {
        setVariantImages(data.variantImages);
      }

      // Add pair to shown set
      const pairKey = [varIdx1, varIdx2].sort().join('-');
      setShownPairs(prev => {
        const ns = new Set(prev);
        ns.add(pairKey);
        return ns;
      });
    } catch (err) {
      console.error('Error in fetchAndUpdate', err);
      toast.error('Failed to fetch images. Please try again.');
    }
  };

  // Register voter function
  const handleRegisterVoter = async () => {
    try {
      setLoading(true);
      const voterName = "Survey User";
      const data = await registerVoter(voterName, startIdx, endIdx);

      let extractedVoterId = data.voter_id ?? data.voterId ?? data.id;
      if (!extractedVoterId) {
        toast.error("Registration issue: No voter ID received");
        return;
      }
      setVoterId(extractedVoterId);

      // Fetch vote params
      try {
        const params = await fetchVoteParams(extractedVoterId);
        setVoterData({ ...data, ...params });
        setNVariants(params.n_variants);
        setStartIdx(params.start_idx.toString());
        setEndIdx(params.end_idx.toString());
      } catch (e) {
        console.warn('Could not fetch vote params', e);
      }

      // Prepare first ticket parameters
      const validImg = getValidImageId();
      const [newIdx1, newIdx2] = getRandomVariantPair();
      // Update index states early so UI labels match
      setIdx1(newIdx1);
      setIdx2(newIdx2);
      setImageId(validImg);

      // Switch to main screen
      setCurrentScreen(3);

      // Fetch and display images once
      await fetchAndUpdate(validImg, newIdx1, newIdx2, extractedVoterId);
      setInitialImagesLoaded(true);
    } catch (err) {
      console.error('Error registering voter', err);
      toast.error('Failed to register. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Replace body of fetchImagesWithVoterId to call helper
  const fetchImagesWithVoterId = async (vid) => {
    setLoading(true);
    const imgId = getValidImageId();
    const pair = [idx1, idx2];
    await fetchAndUpdate(imgId, pair[0], pair[1], vid);
    setLoading(false);
  };

  // Update fetchImages to use helper too
  const fetchImages = async () => {
    if (!voterId) {
      toast.error('Please wait while registering...');
      return;
    }
    setLoading(true);
    const imgId = getValidImageId();
    await fetchAndUpdate(imgId, idx1, idx2, voterId);
    setLoading(false);
  };

  // Function to change to the next original image
  const moveToNextOriginalImage = () => {
    const currentId = parseInt(imageId);
    const start = parseInt(startIdx) || 0;
    const end = parseInt(endIdx) || 100;
    
    let newId;
    // If current ID is valid, move to next
    if (!isNaN(currentId) && currentId >= start && currentId < end - 1) {
      newId = currentId + 1;
    } else {
      // Otherwise start at the beginning
      newId = start;
    }
    
    setImageId(newId);
    
    // Reset shown pairs for the new image
    setShownPairs(new Set());
    
    // Get new random variants based on n_variants
    const [newIdx1, newIdx2] = getRandomVariantPair();
    setIdx1(newIdx1);
    setIdx2(newIdx2);
    
    toast.success("Moving to next original image!");
    fetchImages();
  };

  // Function to get a new random pair that hasn't been shown yet
  const getNewRandomPair = () => {
    // If we've shown all possible pairs, move to next original image
    if (shownPairs.size >= totalPossiblePairs) {
      console.log(`All pairs shown (${shownPairs.size}/${totalPossiblePairs}), moving to next original image`);
      moveToNextOriginalImage();
      return;
    }
    
    const max = nVariants ? nVariants - 1 : 4; // Default to 0-4 if nVariants not set
    
    // Try to find a pair that hasn't been shown yet
    let attempts = 0;
    let newIdx1, newIdx2, pairKey;
    let foundNewPair = false;
    
    do {
      // Get random indices based on n_variants
      newIdx1 = Math.floor(Math.random() * (max + 1));
      newIdx2 = Math.floor(Math.random() * (max + 1));
      
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
    
    if (!voterId) {
      toast.error("Cannot submit vote - voter not registered");
      return;
    }
    
    try {
      setLoading(true);
      // Map the selected variant (0 or 1) to the actual variant index (idx1 or idx2)
      const voteValue = selectedVariant === 0 ? idx1 : idx2;
      
      console.log(`Submitting vote for ticket ${ticketId}, variant ${voteValue}, voter ${voterId}`);
      const response = await registerVote(ticketId, voteValue, voterId);
      
      // Record the vote in history
      setVotingHistory(prev => [
        ...prev, 
        { ticketId, imageId, selectedVariant: voteValue, voterId }
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
            {/* <div>Shown pairs: {shownPairs.size}/{totalPossiblePairs}</div> */}
            {/* <div style={{ marginTop: "5px" }}>Voter ID: {voterId ? voterId : 'Registering...'}</div> */}
            {/* <div style={{ marginTop: "5px" }}>Image range: {startIdx} - {endIdx}</div> */}
          </div>
        </div>
      </div>
    </main>
  );
}