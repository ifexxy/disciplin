import { saveEntry, getEntries } from './storage.js';

document.getElementById('logButton').addEventListener('click', () => {
  const mood = document.getElementById('moodInput').value;
  const note = document.getElementById('noteInput').value;

  const entry = {
    mood,
    note,
    timestamp: new Date().toISOString()
  };

  saveEntry(entry);
});

// Load entries on page load
window.onload = () => {
  getEntries(entries => {
    const list = document.getElementById('entriesList');
    list.innerHTML = '';
    entries.forEach(e => {
      const li = document.createElement('li');
      li.textContent = `${e.timestamp}: ${e.mood} - ${e.note}`;
      list.appendChild(li);
    });
  });
};
