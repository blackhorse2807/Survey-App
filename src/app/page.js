"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchSurveyImages, getRandomVariantIndices, normalizeImageId, registerVote } from "../utils/api";
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
  const windowSize = useWindowSize();

  useEffect(() => {
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
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextImage = () => {
    setImageId((prevId) => {
      const newId = prevId + 1;
      return normalizeImageId(newId);
    });
    fetchImages();
  };

  const handlePrevImage = () => {
    setImageId((prevId) => {
      const newId = prevId - 1;
      return normalizeImageId(newId);
    });
    fetchImages();
  };

  // Function to increment a specific variant index
  const handleIncrementVariant = (variantIndex) => {
    setLoading(true);
    
    if (variantIndex === 0) {
      // Increment idx1 (0-4)
      setIdx1(prevIdx => {
        const newIdx = prevIdx + 1;
        return newIdx > 4 ? 0 : newIdx;
      });
    } else {
      // Increment idx2 (0-4)
      setIdx2(prevIdx => {
        const newIdx = prevIdx + 1;
        return newIdx > 4 ? 0 : newIdx;
      });
    }
    
    // Wait a bit before fetching to ensure state is updated
    setTimeout(() => {
      fetchImages();
    }, 100);
  };

  const handleSubmitVote = async (selectedVariant) => {
    try {
      setLoading(true);
      // Map the selected variant (0 or 1) to the actual variant index (idx1 or idx2)
      const voteValue = selectedVariant === 0 ? idx1 : idx2;
      
      console.log(`Submitting vote for ticket ${ticketId}, variant ${voteValue}`);
      const response = await registerVote(ticketId, voteValue);
      
      // Record the vote in history
      setVotingHistory(prev => [
        ...prev, 
        { ticketId, imageId, selectedVariant: voteValue }
      ]);
      
      toast.success("Vote submitted successfully!");
      
      // Move to the next image
      handleNextImage();
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
            onChangeImageId={handleNextImage}
            onIncrementVariant={handleIncrementVariant}
            onSubmit={handleSubmitVote}
          />
        </div>
      </div>
    </main>
  );
}