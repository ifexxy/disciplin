// background.js
class DisciplinBlocker {
  constructor() {
    this.init();
  }

  async init() {
    // Load blocked sites from storage
    const result = await chrome.storage.sync.get(['blockedSites', 'blockingEnabled']);
    this.blockedSites = result.blockedSites || [];
    this.blockingEnabled = result.blockingEnabled !== false;
    
    // Update blocking rules
    this.updateBlockingRules();
  }

  async updateBlockingRules() {
    // Clear existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({length: 1000}, (_, i) => i + 1)
    });

    if (!this.blockingEnabled || this.blockedSites.length === 0) {
      return;
    }

    // Create new blocking rules
    const rules = this.blockedSites.map((site, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          url: chrome.runtime.getURL("blocked.html")
        }
      },
      condition: {
        urlFilter: `*://*.${site}/*`,
        resourceTypes: ["main_frame"]
      }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });
  }

  async addBlockedSite(site) {
    // Clean the URL
    const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    if (!this.blockedSites.includes(cleanSite)) {
      this.blockedSites.push(cleanSite);
      await chrome.storage.sync.set({ blockedSites: this.blockedSites });
      this.updateBlockingRules();
      return true;
    }
    return false;
  }

  async removeBlockedSite(site) {
    const index = this.blockedSites.indexOf(site);
    if (index > -1) {
      this.blockedSites.splice(index, 1);
      await chrome.storage.sync.set({ blockedSites: this.blockedSites });
      this.updateBlockingRules();
      return true;
    }
    return false;
  }

  async toggleBlocking() {
    this.blockingEnabled = !this.blockingEnabled;
    await chrome.storage.sync.set({ blockingEnabled: this.blockingEnabled });
    this.updateBlockingRules();
    return this.blockingEnabled;
  }
}

// Initialize the blocker
const disciplinBlocker = new DisciplinBlocker();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'addSite':
      disciplinBlocker.addBlockedSite(message.site).then(sendResponse);
      return true;
    case 'removeSite':
      disciplinBlocker.removeBlockedSite(message.site).then(sendResponse);
      return true;
    case 'toggleBlocking':
      disciplinBlocker.toggleBlocking().then(sendResponse);
      return true;
    case 'getStatus':
      sendResponse({
        blockedSites: disciplinBlocker.blockedSites,
        blockingEnabled: disciplinBlocker.blockingEnabled
      });
      return true;
  }
});
