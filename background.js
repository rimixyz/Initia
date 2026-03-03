chrome.runtime.onInstalled.addListener((details) => {
    // Apenas na primeira instalação (ignorar atualizações)
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Abre o Initia passando a query de boas vindas
        chrome.tabs.create({ url: "index.html?installed=true" });
    }
});
