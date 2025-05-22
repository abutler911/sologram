exports.buildProfileUpdateEmail = ({ name }) => `
  <div style="font-family: Arial, sans-serif; padding: 2rem; background: #f8f5f0; border-radius: 12px;">
    <h2 style="color: #e98973;">Your profile have been updated on SoloGram, ${name} 👋</h2>
    <p style="color: #444;">Please check your profile and verify the changes have been made and saved! Enjoy SoloGram!</p>
    <a href="https://www.thesologram.com" style="margin-top: 1rem; display: inline-block; padding: 10px 20px; background: #88b2cc; color: white; border-radius: 8px; text-decoration: none;">Go to SoloGram</a>
  </div>
`;
