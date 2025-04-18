export const getTransformedImageUrl = (url, options = {}) => {
  if (!url || !url.includes("/upload/")) return url;

  const {
    width = 614,
    height = 614,
    crop = "fit",
    gravity = "", // ← added
    quality = "auto",
    format = "auto",
    background = "auto",
  } = options;

  let transformation = `w_${width},h_${height},c_${crop}`;
  if (gravity) transformation += `,g_${gravity}`;
  if (crop === "pad") transformation += `,b_${background}`;
  transformation += `,q_${quality},f_${format}`;

  return url.replace("/upload/", `/upload/${transformation}/`);
};
