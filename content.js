// Content script - runs on web pages
// Listens for messages from the popup

// Handle both Firefox (browser) and Chrome (chrome) namespaces
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelection') {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // If no selection, try to get the main article content
    let responseText = text;

    if (!responseText) {
      // Try common article selectors
      const selectors = [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 100) {
          responseText = el.innerText.trim();
          break;
        }
      }
    }

    // Fallback: get body text (not ideal but works)
    if (!responseText) {
      responseText = document.body.innerText.trim();
    }

    sendResponse({ text: responseText });
  }

  // Return true to indicate async response (needed for Chrome)
  return true;
});
