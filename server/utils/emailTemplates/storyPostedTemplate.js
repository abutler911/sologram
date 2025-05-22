export const buildStoryEmail = ({ title, description, storyId }) => {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8f5f0; padding: 24px; max-width: 600px; margin: auto; border-radius: 10px;">
    <h2 style="color: #e98973;">📖 New Story on SoloGram</h2>
    <h3 style="color: #1a1a1a;">${title}</h3>
    <p style="color: #444;">${description}</p>
    <a href="https://www.thesologram.com/stories/${storyId}" style="display:inline-block; margin-top: 20px; background-color: #88b2cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px;">
      Read the Story →
    </a>
  </div>`;
};
