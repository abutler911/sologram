export const buildThoughtEmail = ({ content, thoughtId }) => {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8f5f0; padding: 24px; max-width: 600px; margin: auto; border-radius: 10px;">
    <h2 style="color: #e98973;">💭 New Thought on SoloGram</h2>
    <p style="color: #444; font-size: 16px; line-height: 1.5;">${content}</p>
    <a href="https://www.thesologram.com/thoughts/" style="display:inline-block; margin-top: 20px; background-color: #88b2cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px;">
      View Thought →
    </a>
  </div>`;
};
