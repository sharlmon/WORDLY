// =========================================
// 1. SELECT HTML ELEMENTS
// =========================================
const form = document.getElementById('search-form');
const input = document.getElementById('word-input');
const statusMessage = document.getElementById('status-message');
const resultsSection = document.getElementById('results-section');
const wordTitle = document.getElementById('word-title');
const wordPhonetic = document.getElementById('word-phonetic');
const audioBtn = document.getElementById('audio-btn');
const meaningsContainer = document.getElementById('meanings-container');
const favBtn = document.getElementById('favorite-btn');
const favList = document.getElementById('favorites-list');
const sourceContainer = document.getElementById('source-container');
const sourceLink = document.getElementById('source-link');

// Global variables to keep track of the current word and its audio
let currentAudio = null; 
let currentWord = ""; 

// =========================================
// 2. INITIALIZE APP
// =========================================
// When the page loads, automatically display any saved favorites
document.addEventListener('DOMContentLoaded', displayFavorites);

// Listen for the user submitting the search form
form.addEventListener('submit', handleSearch);

// Listen for the user clicking the Audio button
audioBtn.addEventListener('click', () => {
    if (currentAudio) currentAudio.play();
});

// =========================================
// 3. CORE SEARCH LOGIC
// =========================================
async function handleSearch(event) {
    event.preventDefault(); // Stops the page from refreshing
    const word = input.value.trim(); // Removes extra spaces

    // Validate input
    if (!word) {
        displayError("Please enter a word.");
        return;
    }

    // Show loading state and hide old results
    resultsSection.classList.add('hidden');
    statusMessage.textContent = "Loading...";
    statusMessage.style.color = "#1565c0"; // Make loading text blue
    statusMessage.classList.remove('hidden');

    try {
        const data = await fetchWord(word);
        displayWord(data[0]); // The API returns an array, so we grab the first item
    } catch (error) {
        displayError(error.message);
    }
}

async function fetchWord(word) {
    // Encode the word so spaces or weird characters don't break the URL
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(url);
    
    // Check if the API successfully found the word
    if (!response.ok) {
        throw new Error("We could not find that word. Check the spelling and try again.");
    }
    
    return await response.json();
}

// =========================================
// 4. DISPLAY DATA LOGIC
// =========================================
function displayWord(data) {
    // Hide the loading message
    statusMessage.classList.add('hidden'); 
    
    // Update global current word for the favorites system
    currentWord = data.word; 

    // Inject word and phonetic text
    wordTitle.textContent = data.word;
    wordPhonetic.textContent = data.phonetic || "No pronunciation available";

    // Handle Audio: Find the first valid audio link in the array
    audioBtn.classList.add('hidden');
    currentAudio = null;
    if (data.phonetics) {
        const audioData = data.phonetics.find(p => p.audio && p.audio.length > 0);
        if (audioData) {
            currentAudio = new Audio(audioData.audio); 
            audioBtn.classList.remove('hidden'); 
        }
    }

    // Clear old definitions
    meaningsContainer.innerHTML = '';

    // Loop through meanings (noun, verb, etc.)
    if (data.meanings) {
        data.meanings.forEach(meaning => {
            // Create a wrapper for this part of speech
            const div = document.createElement('div');
            div.innerHTML = `<h3 class="part-of-speech">${meaning.partOfSpeech}</h3>`;

            // Create a list for definitions
            const ul = document.createElement('ul');
            
            // Track all synonyms for this specific meaning
            let allSynonyms = meaning.synonyms ? [...meaning.synonyms] : [];

            meaning.definitions.forEach(def => {
                const li = document.createElement('li');
                li.textContent = def.definition;
                
                // Check if an example sentence exists
                if (def.example) {
                    const exampleText = document.createElement('em');
                    exampleText.className = 'example-text';
                    exampleText.textContent = `Example: "${def.example}"`;
                    li.appendChild(exampleText);
                }

                // Check for deep synonyms at the definition level
                if (def.synonyms && def.synonyms.length > 0) {
                    allSynonyms = allSynonyms.concat(def.synonyms);
                }

                ul.appendChild(li);
            });
            div.appendChild(ul);

            // Display synonyms if we found any
            if (allSynonyms.length > 0) {
                // Remove duplicates using a Set
                const uniqueSynonyms = [...new Set(allSynonyms)];
                const syn = document.createElement('p');
                syn.innerHTML = `<strong>Synonyms:</strong> ${uniqueSynonyms.join(', ')}`;
                div.appendChild(syn);
            }

            meaningsContainer.appendChild(div);
        });
    }

    // Handle Source Link
    if (data.sourceUrls && data.sourceUrls.length > 0) {
        sourceLink.href = data.sourceUrls[0];
        sourceLink.textContent = data.sourceUrls[0];
        sourceContainer.classList.remove('hidden');
    } else {
        sourceContainer.classList.add('hidden');
    }

    // Check if this word is already in our favorites and update the button color
    updateFavoriteButtonUI();
    
    // Finally, show the results section
    resultsSection.classList.remove('hidden');
}

function displayError(message) {
    statusMessage.textContent = message;
    statusMessage.style.color = "#d32f2f"; // Make error text red
    statusMessage.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

// =========================================
// 5. FAVORITES & LOCAL STORAGE LOGIC
// =========================================
favBtn.addEventListener('click', () => {
    const favorites = getFavorites();
    if (favorites.includes(currentWord)) {
        removeFavorite(currentWord);
    } else {
        saveFavorite(currentWord);
    }
});

function getFavorites() {
    // Grab the string from local storage and convert it back to an array
    const favs = localStorage.getItem('wordly_favorites');
    return favs ? JSON.parse(favs) : []; 
}

function saveFavorite(word) {
    const favorites = getFavorites();
    if (!favorites.includes(word)) {
        favorites.push(word);
        // Convert the array back to a string to save it
        localStorage.setItem('wordly_favorites', JSON.stringify(favorites)); 
    }
    updateFavoriteButtonUI();
    displayFavorites();
}

function removeFavorite(word) {
    let favorites = getFavorites();
    // Keep every word EXCEPT the one we want to remove
    favorites = favorites.filter(fav => fav !== word);
    localStorage.setItem('wordly_favorites', JSON.stringify(favorites)); 
    
    // If the word we just removed is the one currently on the screen, update the button
    if (word === currentWord) {
        updateFavoriteButtonUI();
    }
    displayFavorites();
}

function updateFavoriteButtonUI() {
    const favorites = getFavorites();
    if (favorites.includes(currentWord)) {
        favBtn.textContent = "❤️ Saved";
        favBtn.classList.add('saved'); // Adds the red background from CSS
    } else {
        favBtn.textContent = "🤍 Save";
        favBtn.classList.remove('saved'); 
    }
}

function displayFavorites() {
    favList.innerHTML = ''; // Clear the current list
    const favorites = getFavorites();

    // Empty state check
    if (favorites.length === 0) {
        favList.innerHTML = '<li>No favorite words saved yet.</li>'; 
        return;
    }

    // Build the list of favorites dynamically
    favorites.forEach(word => {
        const li = document.createElement('li');
        li.className = 'favorite-item';
        
        // We use innerHTML here for simplicity to add the text and a button at the same time
        li.innerHTML = `
            <span class="fav-word">${word}</span>
            <button class="remove-btn">Remove</button>
        `;
        
        // If they click the word, search for it again
        li.querySelector('.fav-word').addEventListener('click', () => {
            input.value = word;
            // Programmatically trigger a form submission
            handleSearch(new Event('submit'));
        });

        // If they click remove, delete it
        li.querySelector('.remove-btn').addEventListener('click', () => {
            removeFavorite(word);
        });

        favList.appendChild(li);
    });
}