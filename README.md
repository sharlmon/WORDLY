# Wordly Dictionary SPA

## Project Description
Wordly is an interactive, Single Page Application (SPA) designed to help users learn and explore vocabulary. By connecting to a public dictionary API, the application allows users to search for terms, view comprehensive definitions, and save their favorite words for future reference—all on a single page without requiring a browser refresh.

## Features
* **Word Search:** Instantly look up English words.
* **Definitions & Parts of Speech:** View detailed meanings categorized by noun, verb, adjective, etc.
* **Pronunciation Text:** See the phonetic spelling of the searched word.
* **Audio Pronunciation:** Play audio files to hear the correct pronunciation.
* **Examples & Synonyms:** Read example sentences and aggregated synonym lists to expand vocabulary context.
* **Favorites System:** Save and remove favorite words using browser `localStorage` for persistent data across sessions.
* **Error Handling:** Graceful, user-friendly fallback messages for missing words, empty inputs, or network/API failures.
* **Responsive Design:** Optimized layout for both desktop and mobile viewing.

## Technologies Used
* HTML5
* CSS3
* Vanilla JavaScript (ES6+, Async/Await)
* Free Dictionary API
* Browser `localStorage`

## Project Structure
```text
wordly/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── index.js
├── assets/
│   └── screenshot.png
└── README.md
How to Run the Project
Clone or download this repository to your local machine.

Open the wordly project folder.

Open index.html in your preferred web browser, or use a local development environment like VS Code Live Server.

Enter a word in the search field and click the "Look Up" button to test the application.

API Information
This project uses the Free Dictionary API.

Endpoint Format: https://api.dictionaryapi.dev/api/v2/entries/en/{word}

The application safely retrieves meanings, pronunciation, audio, examples, synonyms, and source URLs when available from the API response.

Usage
Enter an English word into the search bar.

Click "Look Up" or press Enter.

View the resulting definitions, parts of speech, and source material.

Click "Listen" to hear the word's pronunciation (if audio is provided).

Click "Bookmark" to add the word to your saved Favorites list.

Click any word in your Favorites panel to instantly search it again, or click "Remove" to delete it from your local storage.

Screenshots
Live Demo & Repository
Live Demo: https://github.com/sharlmon/WORDLY

GitHub Repository: https://github.com/sharlmon/WORDLY

Limitations
some words do lack pronunciation

The current version of this application only supports English words.

Author
Sharlmon

License
This project was created for educational purposes.
