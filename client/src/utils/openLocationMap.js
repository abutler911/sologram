// utils/openLocationMap.js
const openLocationMap = (location) => {
  const enc = encodeURIComponent(location);
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  window.open(
    isIOS
      ? 'https://maps.apple.com/?q=' + enc
      : 'https://www.google.com/maps/search/?api=1&query=' + enc,
    '_blank'
  );
};

export default openLocationMap;
