// Main analysis engine
const BIAS_API_URL = 'http://localhost:5000/analyze';
let activeHighlights = new Set();

// Core function to analyze page content
async function analyzePageContent() {
  try {
    const text = extractPageText();
    if (!text || text.length < 50) {
      showNotification('Not enough text to analyze', 'warning');
      return { biases: [], status: 'success' };
    }

    const response = await fetch(BIAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'error') throw new Error(data.error);

    if (data.biases?.length > 0) {
      highlightBiases(data.biases);
      showNotification(`Found ${data.biases.length} biases`, 'info');
    } else {
      showNotification('No biases found', 'success');
    }

    return data;

  } catch (error) {
    console.error("Analysis failed:", error);
    showNotification('Analysis failed', 'error');
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Helper functions
function extractPageText() {
  const clone = document.cloneNode(true);
  const removals = clone.querySelectorAll(
    'script, style, noscript, iframe, nav, footer, button'
  );
  removals.forEach(el => el.remove());
  return clone.body.textContent
    .substring(0, 10000)
    .replace(/\s+/g, ' ')
    .trim();
}

function highlightBiases(biases) {
  clearHighlights();
  
  biases.forEach(bias => {
    try {
      const textNode = findTextNode(document.body, bias.start);
      if (!textNode) return;

      const range = document.createRange();
      range.setStart(textNode, bias.start);
      range.setEnd(textNode, bias.start + bias.length);

      const highlight = document.createElement('span');
      highlight.className = 'bias-highlight';
      highlight.dataset.bias = JSON.stringify(bias);
      highlight.title = `${bias.type} bias (${Math.round(bias.score * 100)}%)`;

      range.surroundContents(highlight);
      highlight.addEventListener('click', showBiasTooltip);
      activeHighlights.add(highlight);

    } catch (error) {
      console.warn("Highlighting failed:", error);
    }
  });
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzePage") {
    analyzePageContent().then(sendResponse);
    return true; // Keep message port open
  }
});

// Initialize
console.log("Bias Detector content script loaded");