// components/layout/FloatingActionButtonAdjuster.js
import React, { useEffect } from "react";

// This component will add the appropriate class to the floating action button container
// to ensure it's positioned correctly with the bottom navigation
const FloatingActionButtonAdjuster = () => {
  useEffect(() => {
    // Find the existing floating action button container
    const fabContainer = document.querySelector(
      ".FloatingActionButtonContainer"
    );

    if (fabContainer) {
      // Add a class that we can target in our global styles
      fabContainer.classList.add("FloatingActionButtonContainer");
    }

    return () => {
      // Clean up if component unmounts
      if (fabContainer) {
        fabContainer.classList.remove("FloatingActionButtonContainer");
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default FloatingActionButtonAdjuster;
