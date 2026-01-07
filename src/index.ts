import { App } from "./app";

function initializeApp() {
    const app = new App();
    (window as any).app = app;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('Script loaded, document.readyState:', document.readyState);
