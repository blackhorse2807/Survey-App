"use client";

import { useState } from "react";
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
 * @param {Function} props.onChangeImageId - Function to call when changing image ID
 * @param {Function} props.onIncrementVariant - Function to call when incrementing a specific variant
 * @param {Function} props.onSubmit - Function to call when submitting selection
 */
export default function ImageSelector({
  originalImage,
  variantImages,
  imageId,
  idx1,
  idx2,
  loading,
  onChangeImageId,
  onIncrementVariant,
  onSubmit
}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const defaultImage = "/images/face.png";
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  const handleVariantClick = (index) => {
    setSelectedVariant(index);
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
        }
        // If it's a base64 string without prefix (from API)
        else if (src.length > 100) {
          imageSrc = `data:image/png;base64,${src}`;
        }
        // If it's a local path or URL
        else if (src.startsWith('/') || src.startsWith('http')) {
          imageSrc = src;
        }
      }
      
      return (
        <Image 
          src={imageSrc}
          alt={alt}
          width={width} 
          height={height}
          style={{ objectFit: "cover" }}
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
              
              {/* Navigation arrows inside the image */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 10px"
              }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeImageId(false);
                  }} 
                  className="navigation-button"
                  disabled={loading}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  ←
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeImageId(true);
                  }} 
                  className="navigation-button"
                  disabled={loading}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instruction Text */}
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
              
              {/* Individual variant increment button */}
              <button
                onClick={() => onIncrementVariant(index)}
                disabled={loading}
                style={{
                  marginTop: "8px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "5px 10px",
                  fontSize: isMobile ? "12px" : "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span style={{ marginRight: "4px" }}>↻</span>
                Change Variant {index === 0 ? idx1 : idx2}
              </button>
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
              
              {/* Individual variant increment button */}
              <button
                onClick={() => onIncrementVariant(index)}
                disabled={loading}
                style={{
                  marginTop: "8px",
                  backgroundColor: "var(--button-gradient)",
                  fontSize: isMobile ? "12px" : "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span style={{ marginRight: "4px" }}>↻</span>
                Change Variant {index === 0 ? idx1 : idx2}
              </button>
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