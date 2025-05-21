export const buildNewPostEmail = ({ title, caption, content, postId }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New Post on SoloGram</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f8f5f0; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
      <tr>
        <td style="padding: 24px 24px 16px;">
          <h1 style="margin: 0; font-size: 24px; color: #e98973;">📸 New SoloGram Post</h1>
          <h2 style="margin: 12px 0 8px 0; font-size: 20px; color: #1a1a1a;">${title}</h2>
          <p style="margin: 8px 0; font-size: 16px; color: #555;">${caption}</p>
          <p style="margin: 16px 0; font-size: 15px; color: #444; line-height: 1.6;">${content}</p>
          <a href="https://www.thesologram.com/posts/${postId}" 
             style="display: inline-block; margin-top: 20px; padding: 12px 20px; background-color: #88b2cc; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Post →
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 24px; background: #f0f0f0; text-align: center; font-size: 12px; color: #888;">
          You're receiving this email because you're part of the SoloGram fam. 💛<br/>
          <a href="https://www.thesologram.com" style="color: #88b2cc; text-decoration: none;">Visit SoloGram</a>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
