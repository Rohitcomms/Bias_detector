document.getElementById('analyzeBtn').addEventListener('click', () => {
  const statusEl = document.getElementById('status');
  statusEl.textContent = "Analyzing...";
  statusEl.style.color = "blue";

  chrome.runtime.sendMessage(
    { action: "executeAnalysis" },
    (response) => {
      if (response?.status === 'error') {
        statusEl.textContent = `Error: ${response.error}`;
        statusEl.style.color = "red";
      } else {
        statusEl.textContent = "Analysis complete!";
        statusEl.style.color = "green";
      }
      setTimeout(() => window.close(), 1500);
    }
  );
});