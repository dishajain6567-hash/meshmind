// js/theme.js
const setTheme = t => { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t); };
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme') || 'dark';
  setTheme(saved);
  const bLight = document.getElementById('light'), bDark = document.getElementById('dark');
  if(bLight) bLight.onclick = () => setTheme('light');
  if(bDark) bDark.onclick = () => setTheme('dark');
});
