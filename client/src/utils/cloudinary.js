export const getTransformedImageUrl = (url, options = {}) => {
  if (!url) return ""; // Guard against null or undefined URLs

  try {
    // Only process URLs from Cloudinary
    if (!url.includes("cloudinary.com")) {
      return url; // Return original URL for non-Cloudinary sources
    }

    // Parse the URL
    const urlParts = url.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) {
      return url; // Not a standard Cloudinary URL structure
    }

    // Construct the transformation string
    const transformations = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.gravity) transformations.push(`g_${options.gravity}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.dpr) transformations.push(`dpr_${options.dpr}`);
    if (options.effect) transformations.push(`e_${options.effect}`);
    if (options.sharpen) transformations.push(`e_sharpen:${options.sharpen}`);

    // Insert transformations after 'upload'
    if (transformations.length > 0) {
      urlParts.splice(uploadIndex + 1, 0, transformations.join(","));
    }

    return urlParts.join("/");
  } catch (error) {
    console.error("Error transforming Cloudinary URL:", error);
    return url; // Return original URL if any error occurs
  }
};
