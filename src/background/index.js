chrome.action.onClicked.addListener((tab) => {
    // Opens the side panel
    chrome.sidePanel.open({ windowId: tab.windowId });
});
