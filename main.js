// Game state
let pokemonData = [];
let score = 0;
let totalPokemon = 10;

// Classic sound effects simulation
function playSound(type) {
    // Create a simple beep for correct answers
    if (type === 'correct') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'incorrect') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.15); // G3
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// This function runs when the page loads
async function init() {
    const pokemonGrid = document.getElementById('pokemon-grid');
    pokemonGrid.innerHTML = '<div class="loading">LOADING POKÉMON...</div>';
    
    try {
        await fetchPokemonData();
        displayPokemon();
        updateScore();
    } catch (error) {
        console.error('Error loading Pokemon:', error);
        pokemonGrid.innerHTML = '<div class="loading">ERROR! PLEASE REFRESH</div>';
    }
}

// Fetch data for the first 10 Pokemon
async function fetchPokemonData() {
    const promises = [];
    
    // Create promises for fetching the first 10 Pokemon
    for (let i = 1; i <= totalPokemon; i++) {
        promises.push(fetchSinglePokemon(i));
    }
    
    // Wait for all Pokemon to be fetched
    pokemonData = await Promise.all(promises);
}

// Fetch a single Pokemon
async function fetchSinglePokemon(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    
    return {
        id: data.id,
        name: data.name,
        sprite: data.sprites.front_default
    };
}

// Display all Pokemon on the page
function displayPokemon() {
    const pokemonGrid = document.getElementById('pokemon-grid');
    pokemonGrid.innerHTML = '';
    
    pokemonData.forEach((pokemon, index) => {
        const pokemonCard = createPokemonCard(pokemon, index);
        pokemonGrid.appendChild(pokemonCard);
    });
}

// Create a single Pokemon card
function createPokemonCard(pokemon, index) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    
    card.innerHTML = `
        <img src="${pokemon.sprite}" alt="Pokemon ${pokemon.id}" class="pokemon-sprite">
        <input 
            type="text" 
            class="pokemon-input" 
            placeholder="ENTER NAME..."
            data-index="${index}"
            data-correct-name="${pokemon.name}"
            maxlength="15"
        >
        <div class="pokemon-name" id="name-${index}" style="display: none;">${pokemon.name.toUpperCase()}</div>
    `;
    
    // Add event listener to the input
    const input = card.querySelector('.pokemon-input');
    input.addEventListener('input', handleGuess);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            input.blur(); // Remove focus from input
        }
    });
    
    // Convert input to uppercase as user types (Game Boy style)
    input.addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });
    
    return card;
}

// Handle user guesses
function handleGuess(event) {
    const input = event.target;
    const guess = input.value.toLowerCase().trim();
    const correctName = input.dataset.correctName.toLowerCase();
    const index = input.dataset.index;
    const nameDiv = document.getElementById(`name-${index}`);
    
    // Remove previous styling
    input.classList.remove('correct', 'incorrect');
    
    if (guess === '') {
        nameDiv.style.display = 'none';
        return;
    }
    
    if (guess === correctName) {
        // Correct guess
        input.classList.add('correct');
        input.disabled = true;
        nameDiv.style.display = 'block';
        
        // Add visual feedback to the card
        input.closest('.pokemon-card').classList.add('guessed');
        
        // Play success sound
        try {
            playSound('correct');
        } catch (e) {
            console.log('Audio not supported');
        }
        
        // Update score if this is the first correct guess for this Pokemon
        if (!input.dataset.scored) {
            score++;
            input.dataset.scored = 'true';
            updateScore();
        }
    } else {
        // Incorrect guess
        input.classList.add('incorrect');
        nameDiv.style.display = 'none';
        
        // Play error sound
        try {
            playSound('incorrect');
        } catch (e) {
            console.log('Audio not supported');
        }
    }
}

// Update the score display
function updateScore() {
    const scoreElement = document.getElementById('score');
    const scoreNumber = scoreElement.querySelector('.score-number');
    scoreNumber.textContent = `${score}/${totalPokemon}`;
    
    // Check if all Pokemon are guessed correctly
    if (score === totalPokemon) {
        setTimeout(() => {
            // Create a classic-style alert
            const message = '★ CONGRATULATIONS! ★\n\nPOKÉMON MASTER ACHIEVED!\n\nYOU IDENTIFIED THEM ALL!';
            alert(message);
        }, 500);
    }
}

// Start the game when the page loads
init();