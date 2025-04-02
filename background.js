// Message broker between popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "executeAnalysis") {
      chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
        try {
          await chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content/content.js']
          });
          
          const response = await chrome.tabs.sendMessage(tabs[0].id, {
            action: "analyzePage"
          });
          
          sendResponse(response);
        } catch (error) {
          sendResponse({
            status: 'error',
            error: error.message
          });
        }
      });
      return true; // Keep message channel open
    }
  });