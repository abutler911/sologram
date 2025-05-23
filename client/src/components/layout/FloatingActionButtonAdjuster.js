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
        if (window.innerWidth <= 768) {
          // Move the FAB up to clear the enhanced bottom navigation
          // New bottom nav is 70px + safe area, so we need more clearance
          fabContainer.style.bottom = "90px"; // Higher than the new bottom nav height + safe area
          fabContainer.style.right = "1rem"; // Ensure proper right positioning
        } else {
          // Reset to default position on larger screens
          fabContainer.style.bottom = "2rem";
          fabContainer.style.right = "2rem";
        }
      }
    };

    // Function to handle create options overlay
    const handleCreateOptionsVisibility = () => {
      const fabContainer = document.querySelector(
        'div[class^="FloatingActionButtonContainer"]'
      );
      const createOptionsOverlay = document.querySelector(
        '[class*="CreateOptionsOverlay"]'
      );

      if (fabContainer) {
        if (createOptionsOverlay) {
          // Hide FAB when create options are open to avoid conflicts
          fabContainer.style.opacity = "0";
          fabContainer.style.pointerEvents = "none";
        } else {
          // Show FAB when create options are closed
          fabContainer.style.opacity = "1";
          fabContainer.style.pointerEvents = "auto";
        }
      }
    };

    // Run once on mount
    adjustFAB();
    handleCreateOptionsVisibility();

    // Also run when window is resized
    window.addEventListener("resize", adjustFAB);

    // Set up observer for create options overlay
    const observer = new MutationObserver(() => {
      handleCreateOptionsVisibility();
    });

    // Observe the body for changes in create options overlay
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustFAB);
      observer.disconnect();

      // Reset position if component unmounts
      const fabContainer = document.querySelector(
        'div[class^="FloatingActionButtonContainer"]'
      );
      if (fabContainer) {
        fabContainer.style.bottom = "2rem";
        fabContainer.style.right = "2rem";
        fabContainer.style.opacity = "1";
        fabContainer.style.pointerEvents = "auto";
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default FloatingActionButtonAdjuster;
