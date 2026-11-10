chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['picker.js'] }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'capture' || !sender.tab) return false;
  chrome.tabs
    .captureVisibleTab(sender.tab.windowId, { format: 'png' })
    .then((dataUrl) => sendResponse({ dataUrl }))
    .catch((error) => sendResponse({ error: error?.message || 'Capture failed' }));
  return true;
});
