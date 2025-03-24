// components/layout/FloatingActionButtonAdjuster.js
import React, { useEffect } from "react";

const FloatingActionButtonAdjuster = () => {
  useEffect(() => {
    // Function to adjust the FloatingActionButton position
    const adjustFAB = () => {
      const fabContainer = document.querySelector(
        'div[class^="FloatingActionButtonContainer"]'
      );

      if (fabContainer) {
        // Check if we're on mobile
        if (window.innerWidth <= 767) {
          // Move the FAB up to clear the bottom navigation
          fabContainer.style.bottom = "80px"; // Higher than the bottom nav height + safe area
        } else {
          // Reset to default position on larger screens
          fabContainer.style.bottom = "2rem";
        }
      }
    };

    // Run once on mount
    adjustFAB();

    // Also run when window is resized
    window.addEventListener("resize", adjustFAB);

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustFAB);

      // Reset position if component unmounts
      const fabContainer = document.querySelector(
        'div[class^="FloatingActionButtonContainer"]'
      );
      if (fabContainer) {
        fabContainer.style.bottom = "2rem";
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default FloatingActionButtonAdjuster;
