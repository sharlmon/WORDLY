/*
we first think through tthe steps we are to take in this project
1.DOM selection
2. Event Handling
3. API Logic
4. UI Rendering
5. Local Storage management 
*/

// we first collect the DOM node elements
const form = document.getElementById('search-form'); 
const input = document.getElementById('word-input'); 
const submitBtn = document.querySelector('#search-form button[type="submit"]'); // Used querySelector because the HTML button has no ID
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

// we declare the global variable so that we track the state of the app at every given moment
let currentAudio = null; 
let currentWord = ""; 

//here we then initialise and call upon the event listeners
document.addEventListener('DOMContentLoaded', displayFavorites);//immediately after the domcontent has loaded, favourites will be displayed


form.addEventListener('submit', handleSearch);//we add functionality to the submit button, when clicked, it handles the search

// we now handle the audio playback
audioBtn.addEventListener('click', () => {
    if (currentAudio) currentAudio.play();
});

// we now work on the add to favourites feature 
favBtn.addEventListener('click', () => {
    const favorites = getFavorites();
    if (favorites.includes(currentWord)) {
        removeFavorite(currentWord);
    } else {
        saveFavorite(currentWord);
    }
});


//this is now the core of the website,where the the handlesearch and fetchword are used
async function handleSearch(event) {
    event.preventDefault(); 
    
    // here we just read input, trim spaces, and then convert it  to lowercase
    const word = input.value.trim().toLowerCase(); 

    // we then validate that the input is not empty
    if (!word) {
        displayError("Please enter a word.");
        return;
    }

    // when the page is refreshed it would clear old results, show loading, and disable the search button
    resultsSection.classList.add('hidden');
    statusMessage.textContent = "Loading...";
    statusMessage.style.color = "#1565c0"; 
    statusMessage.classList.remove('hidden');
    submitBtn.disabled = true; 

    try {
        const data = await fetchWord(word);
        
        // here we then validate that the API returned a usable array
        if (Array.isArray(data) && data.length > 0) {
            displayWord(data[0]); 
        } else {
            throw new Error("Invalid data received from the dictionary.");
        }
    } catch (error) {
        displayError(error.message);
    } finally {
        // we then make sure that we always re-enable the submit button, even if the request fails
        submitBtn.disabled = false; 
    }
}

async function fetchWord(word) {
    // here we then makee sure that we encode the word to handle special characters
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
        // here we then handle physical network disconnects
        if (error.message === "Failed to fetch") {
            throw new Error("Network failure. Please check your internet connection.");
        }
        throw error; 
    }
}

//  here we then handle the display logic
function displayWord(data) {
    statusMessage.classList.add('hidden'); 
    currentWord = data.word; 

    // here we then display the word and phonetic spelling
    wordTitle.textContent = data.word;
    wordPhonetic.textContent = data.phonetic || "No pronunciation available";

    // here we then handle Audio: we Find the first valid audio URL
    audioBtn.classList.add('hidden');
    currentAudio = null;
    if (data.phonetics) {
        const audioData = data.phonetics.find(p => p.audio && p.audio.length > 0);
        if (audioData) {
            currentAudio = new Audio(audioData.audio); 
            audioBtn.classList.remove('hidden'); 
        }
    }

    // here we then clear previous definitions
    meaningsContainer.innerHTML = '';

    // here we then loop through meanings (noun, verb, and others)
    if (data.meanings) {
        data.meanings.forEach(meaning => {
            const div = document.createElement('div');
            div.innerHTML = `<h3 class="part-of-speech">${meaning.partOfSpeech}</h3>`;

            const ul = document.createElement('ul');
            let allSynonyms = meaning.synonyms ? [...meaning.synonyms] : [];

            // we then loop through specific definitions
            meaning.definitions.forEach(def => {
                const li = document.createElement('li');
                li.textContent = def.definition;
                
                // we then add example sentence if it exists
                if (def.example) {
                    const exampleText = document.createElement('em');
                    exampleText.className = 'example-text';
                    exampleText.textContent = `Example: "${def.example}"`;
                    li.appendChild(exampleText);
                }

                // we then gather definition-level synonyms
                if (def.synonyms && def.synonyms.length > 0) {
                    allSynonyms = allSynonyms.concat(def.synonyms);//concat is an array method that simply combines 2or more array without modifying the original one
                }

                ul.appendChild(li);
            });
            div.appendChild(ul);

            // we then display the combined unique synonyms
            if (allSynonyms.length > 0) {
                const uniqueSynonyms = [...new Set(allSynonyms)];
                const syn = document.createElement('p');
                syn.innerHTML = `<strong>Synonyms:</strong> ${uniqueSynonyms.join(', ')}`;
                div.appendChild(syn);
            }

            meaningsContainer.appendChild(div);
        });
    }

    // here we then handle Source URL
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

//here we then deal with the local storage logic (where we want to still display the favourites words later on)
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
    localStorage.setItem('wordly_bookmarks', JSON.stringify(favorites)); //The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists.


    
    if (word === currentWord) {
        updateFavoriteButtonUI();
    }
    displayFavorites();
}
//here we then deal with the favourite button ui
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

    //we handle what will be displayed when the favourites section is empty
    if (favorites.length === 0) {
        favList.innerHTML = '<li>No favorite words saved yet.</li>'; 
        return;
    }
    //here we then handle what's displayed for when a word is addded as a favourite
    favorites.forEach(word => {
        const li = document.createElement('li');
        li.className = 'favorite-item';
        
        li.innerHTML = `
            <span class="fav-word">${word}</span>
            <button class="remove-btn">Remove</button>
        `;
        
        // we then handle what happens when the search button is clicked again
        li.querySelector('.fav-word').addEventListener('click', () => {
            input.value = word;
            handleSearch(new Event('submit'));
        });

        // here we then handle what happens when we want to remove the word ffrom the favourites section
        li.querySelector('.remove-btn').addEventListener('click', () => {
            removeFavorite(word);
        });

        favList.appendChild(li);
    });
}