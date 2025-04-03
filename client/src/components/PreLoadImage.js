import React from "react";
import { Helmet } from "react-helmet-async";

const PreloadImage = ({ src, type = "image/jpeg" }) => {
  if (!src) return null;

  return (
    <Helmet>
      <link rel="preload" as="image" href={src} type={type} />
    </Helmet>
  );
};

export default PreloadImage;
