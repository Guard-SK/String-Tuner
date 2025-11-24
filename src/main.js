import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';

const app = createApp(App);
app.mount('#app');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('Service worker registration failed:', err));
  });
}
