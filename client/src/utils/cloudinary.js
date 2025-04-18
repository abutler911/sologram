export const getTransformedImageUrl = (url, options = {}) => {
  if (!url || !url.includes("/upload/")) return url;

  const {
    width = 614,
    height = 614,
    crop = "fit",
    quality = "auto",
    format = "auto",
    background = "auto",
  } = options;

  let transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
  if (crop === "pad") {
    transformation += `,b_${background}`;
  }

  return url.replace("/upload/", `/upload/${transformation}/`);
};
