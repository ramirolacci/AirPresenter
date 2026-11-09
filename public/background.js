// AirPresenter - Chrome Extension Service Worker (Manifest V3)

chrome.action.onClicked.addListener(async () => {
    // Abre la pizarra en una ventana dedicada de alta resolución
    chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: 1280,
        height: 720,
        focused: true
    });
});

