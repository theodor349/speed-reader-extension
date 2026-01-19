// State
let words = [];
let currentIndex = 0;
let isPlaying = false;
let timeoutId = null;

// DOM elements
const wordEl = document.getElementById('word');
const progressBar = document.getElementById('progress-bar');
const wordCount = document.getElementById('word-count');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const wpmSlider = document.getElementById('wpm');
const wpmValue = document.getElementById('wpm-value');
const useChunking = document.getElementById('use-chunking');
const status = document.getElementById('status');

// Browser API (works for both Firefox and Chrome)
const storage = (typeof browser !== 'undefined' ? browser : chrome).storage.local;

// Load saved settings
async function loadSettings() {
  try {
    const data = await storage.get(['wpm', 'chunking']);
    if (data.wpm) {
      wpmSlider.value = data.wpm;
      wpmValue.textContent = data.wpm;
    }
    if (data.chunking !== undefined) {
      useChunking.checked = data.chunking;
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

// Save settings
function saveSettings() {
  storage.set({
    wpm: parseInt(wpmSlider.value),
    chunking: useChunking.checked
  });
}

// Get selected text from the active tab
async function getSelectedText() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const results = await browser.tabs.sendMessage(tab.id, { action: 'getSelection' });
    return results?.text || '';
  } catch (e) {
    // Fallback for Chrome (uses chrome namespace)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      return results?.text || '';
    } catch (e2) {
      console.error('Could not get selection:', e2);
      return '';
    }
  }
}

// Tokenize text into words
function tokenize(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// Words that should attach to the next word(s)
const LEADING_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down',
  'into', 'onto', 'upon', 'out', 'off', 'over', 'under', 'about', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'among',
  // Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'when', 'while', 'as',
  'that', 'which', 'who', 'whom', 'whose', 'where', 'than',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'this', 'that', 'these', 'those',
  // Auxiliary/common verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  // Common short words
  'not', 'no', 'yes', 'all', 'some', 'any', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'such', 'only', 'just', 'also', 'very',
  'how', 'what', 'why', 'there', 'here'
]);

// Check if word ends a sentence
function endsSentence(word) {
  return /[.!?]$/.test(word);
}

// Check if word is a leading word (should attach to next)
function isLeadingWord(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  return LEADING_WORDS.has(clean);
}

// Group words into natural chunks
function chunkWords(words) {
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    let chunk = [words[i]];

    // If current word is a leading word, grab more
    while (
      i + chunk.length < words.length &&
      chunk.length < 3 &&
      isLeadingWord(chunk[chunk.length - 1]) &&
      !endsSentence(chunk[chunk.length - 1])
    ) {
      chunk.push(words[i + chunk.length]);
    }

    // If we only have one leading word and there's a next word, grab it
    if (chunk.length === 1 && isLeadingWord(chunk[0]) && i + 1 < words.length) {
      chunk.push(words[i + 1]);
    }

    chunks.push(chunk.join(' '));
    i += chunk.length;
  }

  return chunks;
}

// Calculate delay for current chunk
function getDelay() {
  const baseDelay = 60000 / parseInt(wpmSlider.value);
  const chunk = words[currentIndex] || '';
  const numWords = chunk.split(' ').length;
  // Scale delay: 1 word = 1x, 2 words = 2x, 3 words = 3x
  return baseDelay * numWords;
}

// Update the display
function updateDisplay() {
  if (words.length === 0) {
    wordEl.textContent = 'Select text and click Start';
    progressBar.style.width = '0%';
    wordCount.textContent = '0 / 0';
    return;
  }

  const chunk = words[currentIndex] || '';
  wordEl.textContent = chunk;

  const progress = ((currentIndex + 1) / words.length) * 100;
  progressBar.style.width = `${progress}%`;
  wordCount.textContent = `${currentIndex + 1} / ${words.length}`;
}

// Play the next word
function playNext() {
  if (!isPlaying || currentIndex >= words.length) {
    if (currentIndex >= words.length) {
      pause();
      status.textContent = 'Finished!';
    }
    return;
  }

  updateDisplay();
  currentIndex++;

  timeoutId = setTimeout(playNext, getDelay());
}

// Start reading
async function start() {
  if (words.length === 0) {
    status.textContent = 'Fetching selected text...';
    const text = await getSelectedText();

    if (!text) {
      status.textContent = 'No text selected. Select text on the page first.';
      return;
    }

    const rawWords = tokenize(text);
    if (useChunking.checked) {
      words = chunkWords(rawWords);
      status.textContent = `Loaded ${rawWords.length} words (${words.length} chunks)`;
    } else {
      words = rawWords;
      status.textContent = `Loaded ${words.length} words`;
    }
    currentIndex = 0;
  }

  isPlaying = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  playNext();
}

// Pause reading
function pause() {
  isPlaying = false;
  clearTimeout(timeoutId);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

// Reset to beginning
function reset() {
  pause();
  currentIndex = 0;
  words = [];
  updateDisplay();
  status.textContent = 'Ready - select text on page first';
}

// Event listeners
startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);

wpmSlider.addEventListener('input', () => {
  wpmValue.textContent = wpmSlider.value;
  saveSettings();
});

useChunking.addEventListener('change', saveSettings);

// Initialize
loadSettings();
updateDisplay();
