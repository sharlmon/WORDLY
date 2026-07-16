// =========================================
// 1. DOM ELEMENT SELECTIONS
// =========================================
// Clean, single-target selectors mapping directly to your HTML
const form = document.getElementById('dict-search-form');
const input = document.getElementById('search-query');
const submitBtn = document.getElementById('submit-search-btn');
const statusMessage = document.getElementById('feedback-alert');
const resultsSection = document.getElementById('definition-card');
const wordTitle = document.getElementById('display-word');
const wordPhonetic = document.getElementById('pronunciation-text');
const audioBtn = document.getElementById('play-audio-btn');
const meaningsContainer = document.getElementById('dictionary-entries');
const favBtn = document.getElementById('save-word-btn');
const favList = document.getElementById('saved-items-ul');
const sourceContainer = document.getElementById('source-link-wrapper');
const sourceLink = document.getElementById('wiki-source-url');

// Global variables for state management
let currentAudio = null; 
let currentWord = ""; 

// =========================================
// 2. INITIALIZATION & EVENT LISTENERS
// =========================================
// Load saved favorites as soon as the page loads
document.addEventListener('DOMContentLoaded', displayFavorites);

// Form submission event
form.addEventListener('submit', handleSearch);

// Audio playback event
audioBtn.addEventListener('click', () => {
    if (currentAudio) currentAudio.play();
});

// Favorites save/remove toggle event
favBtn.addEventListener('click', () => {
    const favorites = getFavorites();
    if (favorites.includes(currentWord)) {
        removeFavorite(currentWord);
    } else {
        saveFavorite(currentWord);
    }
});

// =========================================
// 3. CORE SEARCH & API LOGIC
// =========================================
async function handleSearch(event) {
    event.preventDefault(); 
    
    // Read input, trim spaces, and normalize to lowercase
    const word = input.value.trim().toLowerCase(); 

    // Validate that the input is not empty
    if (!word) {
        displayError("Please enter a word.");
        return;
    }

    // Clear old results, show loading, and disable the search button
    resultsSection.classList.add('hidden');
    statusMessage.textContent = "Loading...";
    statusMessage.style.color = "#1565c0"; 
    statusMessage.classList.remove('hidden');
    submitBtn.disabled = true; 

    try {
        const data = await fetchWord(word);
        
        // Validate that the API returned a usable array
        if (Array.isArray(data) && data.length > 0) {
            displayWord(data[0]); 
        } else {
            throw new Error("Invalid data received from the dictionary.");
        }
    } catch (error) {
        displayError(error.message);
    } finally {
        // ALWAYS re-enable the submit button, even if the request fails
        submitBtn.disabled = false; 
    }
}

async function fetchWord(word) {
    // Encode the word to safely handle special characters
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    
    try {
        const response = await fetch(url);
        
        // Check for specific error statuses
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("We could not find that word. Check the spelling and try again.");
            } else {
                throw new Error("Server error. Please try again later.");
            }
        }
        
        return await response.json(); 
        
    } catch (error) {
        // Handle physical network disconnects
        if (error.message === "Failed to fetch") {
            throw new Error("Network failure. Please check your internet connection.");
        }
        throw error; 
    }
}

// =========================================
// 4. DISPLAY LOGIC
// =========================================
function displayWord(data) {
    statusMessage.classList.add('hidden'); 
    currentWord = data.word; 

    // Render word and phonetic spelling
    wordTitle.textContent = data.word;
    wordPhonetic.textContent = data.phonetic || "No pronunciation available";

    // Handle Audio: Find the first valid audio URL
    audioBtn.classList.add('hidden');
    currentAudio = null;
    if (data.phonetics) {
        const audioData = data.phonetics.find(p => p.audio && p.audio.length > 0);
        if (audioData) {
            currentAudio = new Audio(audioData.audio); 
            audioBtn.classList.remove('hidden'); 
        }
    }

    // Clear previous definitions
    meaningsContainer.innerHTML = '';

    // Loop through meanings (noun, verb, etc.)
    if (data.meanings) {
        data.meanings.forEach(meaning => {
            const div = document.createElement('div');
            div.innerHTML = `<h3 class="part-of-speech">${meaning.partOfSpeech}</h3>`;

            const ul = document.createElement('ul');
            let allSynonyms = meaning.synonyms ? [...meaning.synonyms] : [];

            // Loop through specific definitions
            meaning.definitions.forEach(def => {
                const li = document.createElement('li');
                li.textContent = def.definition;
                
                // Add example sentence if it exists
                if (def.example) {
                    const exampleText = document.createElement('em');
                    exampleText.className = 'example-text';
                    exampleText.textContent = `Example: "${def.example}"`;
                    li.appendChild(exampleText);
                }

                // Gather definition-level synonyms
                if (def.synonyms && def.synonyms.length > 0) {
                    allSynonyms = allSynonyms.concat(def.synonyms);
                }

                ul.appendChild(li);
            });
            div.appendChild(ul);

            // Display combined unique synonyms
            if (allSynonyms.length > 0) {
                const uniqueSynonyms = [...new Set(allSynonyms)];
                const syn = document.createElement('p');
                syn.innerHTML = `<strong>Synonyms:</strong> ${uniqueSynonyms.join(', ')}`;
                div.appendChild(syn);
            }

            meaningsContainer.appendChild(div);
        });
    }

    // Handle Source URL
    if (data.sourceUrls && data.sourceUrls.length > 0) {
        sourceLink.href = data.sourceUrls[0];
        sourceLink.textContent = data.sourceUrls[0];
        sourceContainer.classList.remove('hidden');
    } else {
        sourceContainer.classList.add('hidden');
    }

    updateFavoriteButtonUI();
    resultsSection.classList.remove('hidden');
}

function displayError(message) {
    statusMessage.textContent = message;
    statusMessage.style.color = "#d32f2f"; 
    statusMessage.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

// =========================================
// 5. LOCAL STORAGE (FAVORITES) LOGIC
// =========================================
function getFavorites() {
    const favs = localStorage.getItem('wordly_bookmarks');
    return favs ? JSON.parse(favs) : []; 
}

function saveFavorite(word) {
    const favorites = getFavorites();
    if (!favorites.includes(word)) {
        favorites.push(word);
        localStorage.setItem('wordly_bookmarks', JSON.stringify(favorites)); 
    }
    updateFavoriteButtonUI();
    displayFavorites();
}

function removeFavorite(word) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav !== word);
    localStorage.setItem('wordly_bookmarks', JSON.stringify(favorites)); 
    
    if (word === currentWord) {
        updateFavoriteButtonUI();
    }
    displayFavorites();
}

function updateFavoriteButtonUI() {
    const favorites = getFavorites();
    if (favorites.includes(currentWord)) {
        favBtn.textContent = "⭐ Bookmarked";
        favBtn.classList.add('saved'); 
    } else {
        favBtn.textContent = "☆ Bookmark";
        favBtn.classList.remove('saved'); 
    }
}

function displayFavorites() {
    favList.innerHTML = ''; 
    const favorites = getFavorites();

    if (favorites.length === 0) {
        favList.innerHTML = '<li>No favorite words saved yet.</li>'; 
        return;
    }

    favorites.forEach(word => {
        const li = document.createElement('li');
        li.className = 'favorite-item';
        
        li.innerHTML = `
            <span class="fav-word">${word}</span>
            <button class="remove-btn">Remove</button>
        `;
        
        // Search the word again when clicked
        li.querySelector('.fav-word').addEventListener('click', () => {
            input.value = word;
            handleSearch(new Event('submit'));
        });

        // Remove the word from favorites
        li.querySelector('.remove-btn').addEventListener('click', () => {
            removeFavorite(word);
        });

        favList.appendChild(li);
    });
}