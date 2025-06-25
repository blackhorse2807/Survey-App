"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import useWindowSize from "../hooks/useWindowSize";

/**
 * ImageSelector component for displaying and selecting variant images
 * 
 * @param {Object} props - Component props
 * @param {string} props.originalImage - URL of the original image
 * @param {Array<string>} props.variantImages - Array of variant image URLs
 * @param {number} props.imageId - Current image ID (0-99)
 * @param {number} props.idx1 - First variant index (0-4)
 * @param {number} props.idx2 - Second variant index (0-4)
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onChangeVariants - Function to call when changing variants
 * @param {Function} props.onSubmit - Function to call when submitting selection
 */
export default function ImageSelector({
  originalImage,
  variantImages,
  imageId,
  idx1,
  idx2,
  loading,
  onChangeVariants,
  onSubmit
}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [timer, setTimer] = useState(5);
  const defaultImage = "/images/face.png";
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  // Reset timer when variants change or loading status changes
  useEffect(() => {
    setTimer(5);
    
    // Reset selection only when variants actually change
    if (idx1 !== undefined && idx2 !== undefined) {
      setSelectedVariant(null);
    }
    
    // If currently loading, do not start timer
    if (loading) return;
    
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1 && selectedVariant === null && !loading) {
          onChangeVariants();
          return 5;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [idx1, idx2, loading, onChangeVariants]);

  const handleVariantClick = (index) => {
    setSelectedVariant(index);
    setTimer(5); // Reset timer when a selection is made
  };

  const handleSubmit = () => {
    if (selectedVariant !== null) {
      onSubmit(selectedVariant);
      setSelectedVariant(null);
    }
  };

  // Helper function to safely render images
  const renderImage = (src, alt, width, height) => {
    try {
      // Handle different image formats
      let imageSrc = defaultImage;
      
      if (typeof src === 'string') {
        // If it's already a complete data URL
        if (src.startsWith('data:image')) {
          imageSrc = src;
          console.log("Rendering image with data URL prefix");
        }
        // If it's a base64 string without prefix (from API)
        else if (src.length > 100) {
          imageSrc = `data:image/png;base64,${src}`;
          console.log("Rendering base64 image, added prefix");
        }
        // If it's a local path or URL
        else if (src.startsWith('/') || src.startsWith('http')) {
          imageSrc = src;
          console.log("Rendering image with path:", src.substring(0, 20) + '...');
        } else {
          console.log("Using default image - unknown format:", src.substring(0, 20) + '...');
        }
      } else if (!src) {
        console.log("Source is null or undefined, using default");
      } else {
        console.log("Non-string source type:", typeof src);
      }
      
      return (
        <Image 
          src={imageSrc}
          alt={alt}
          width={width} 
          height={height}
          style={{ objectFit: "cover" }}
          priority={true} // Add priority to load images faster
        />
      );
    } catch (error) {
      console.error("Error rendering image:", error);
      return (
        <Image 
          src={defaultImage}
          alt={alt}
          width={width} 
          height={height}
          style={{ objectFit: "cover" }}
        />
      );
    }
  };

  return (
    <div className="image-selector">
      {/* Original Image Title */}
      <div className="originalImage" style={{ 
        textAlign: "center",
        padding: "8px 0",
        fontSize: "18px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: isMobile ? "280px" : "300px",
        margin: "0 auto 15px auto",
        borderRadius: "6px"
      }}>
        Original Image ({imageId}/99)
      </div>
      
      {/* Original Image Box */}
      <div className="original-image">
        <div className="image-container">
          <div style={{ 
            position: "relative",
            width: "100%",
            maxWidth: isMobile ? "280px" : "260px",
            maxHeight: isMobile ? "280px" : "260px",
            height: "auto",
            padding: isMobile ? "10px" : "15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{
              backgroundColor: "#fff", 
              padding: "2px", 
              borderRadius: "4px", 
              width: "100%",
              maxWidth: isMobile ? "240px" : "240px",
              height: isMobile ? "240px" : "240px",
              position: "relative",
              overflow: "hidden"
            }}>
              {loading && (
                <div className="loading-overlay">
                  Loading...
                </div>
              )}
              
              {renderImage(originalImage, "Original face", isMobile ? 260 : 300, isMobile ? 180 : 300)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Instruction Text with Timer */}
      <div className="instruction-text" style={{
        textAlign: "center",
        color: "white",
        margin: "20px 0",
        fontSize: isMobile ? "14px" : "16px",
        fontWeight: "500",
        textShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
        maxWidth: "600px",
        padding: "0 10px"
      }}>
        Choose from the following images which closely matches the original image:
        {selectedVariant === null && (
          <div style={{
            marginTop: "5px",
            fontSize: isMobile ? "12px" : "14px",
            color: timer <= 2 ? "#FFD700" : "white",
            fontWeight: timer <= 2 ? "bold" : "normal"
          }}>
            New variants in: {timer}s
          </div>
        )}
      </div>
      
      {/* Variant Images */}
      <div className="image-grid" style={{
        display: "flex",
        flexDirection: "row", // Always keep side by side even on mobile
        justifyContent: "center",
        alignItems: "center",
        gap: isMobile ? "10px" : "20px",
        width: "100%",
        maxWidth: isMobile ? "100%" : "600px"
      }}>
        {Array.isArray(variantImages) && variantImages.length >= 2 ? (
          variantImages.slice(0, 2).map((image, index) => (
            <div key={index} className="image-container" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: isMobile ? "48%" : "auto"
            }}>
              <div 
                className={`variant-container`}
                style={{
                  backgroundColor: "#fff",
                  padding: "2px",
                  borderRadius: "4px",
                  position: "relative",
                  overflow: "hidden",
                  maxWidth: isMobile ? "100%" : "220px",
                  height: isMobile ? "150px" : "220px",
                  border: selectedVariant === index ? "3px solid #FFD700" : "none",
                  boxShadow: selectedVariant === index ? "0 0 10px rgba(255, 215, 0, 0.7)" : "none",
                  cursor: "pointer"
                }}
                onClick={() => handleVariantClick(index)}
              >
                {loading && (
                  <div className="loading-overlay">
                    Loading...
                  </div>
                )}
                
                {renderImage(image, `Variant ${index === 0 ? idx1 : idx2}`, isMobile ? 150 : 220, isMobile ? 150 : 220)}
                
                {/* Variant label overlay */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  textAlign: "center",
                  padding: "5px 0"
                }}>
                  Variant {index === 0 ? idx1 : idx2}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Fallback if variantImages is not an array or doesn't have enough elements
          [0, 1].map((index) => (
            <div key={index} className="image-container" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: isMobile ? "48%" : "auto"
            }}>
              <div 
                className={`variant-container`}
                style={{
                  backgroundColor: "#fff",
                  padding: "2px",
                  borderRadius: "4px",
                  position: "relative",
                  overflow: "hidden",
                  maxWidth: isMobile ? "80px" : "220px",
                  height: isMobile ? "150px" : "220px",
                  border: selectedVariant === index ? "3px solid #FFD700" : "none",
                  boxShadow: selectedVariant === index ? "0 0 10px rgba(255, 215, 0, 0.7)" : "none",
                  cursor: "pointer"
                }}
                onClick={() => handleVariantClick(index)}
              >
                {loading && (
                  <div className="loading-overlay">
                    Loading...
                  </div>
                )}
                
                {renderImage(defaultImage, `Variant ${index === 0 ? idx1 : idx2}`, isMobile ? 150 : 220, isMobile ? 150 : 220)}
                
                {/* Variant label overlay */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  textAlign: "center",
                  padding: "5px 0"
                }}>
                  Variant {index === 0 ? idx1 : idx2}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Button */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "30px"
      }}>
        <button className="button"
          style={{
            backgroundColor: selectedVariant === null ? "#cccccc" : "#4CAF50",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: selectedVariant === null ? "not-allowed" : "pointer",
            transition: "background-color 0.3s"
          }}
          onClick={handleSubmit} 
          disabled={loading || selectedVariant === null}
        >
          Submit
        </button>
      </div>
    </div>
  );
}