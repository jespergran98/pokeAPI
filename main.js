// Game state
let pokemonData = [];
let score = 0;
let totalPokemon = 151;
let currentRegion = 'kanto';
let currentFocusIndex = -1;

// Regional Pokemon ranges
const REGIONS = {
    kanto: { start: 1, end: 151, name: 'Kanto' },
    johto: { start: 152, end: 251, name: 'Johto' },
    hoenn: { start: 252, end: 386, name: 'Hoenn' },
    sinnoh: { start: 387, end: 493, name: 'Sinnoh' },
    unova: { start: 494, end: 649, name: 'Unova' },
    kalos: { start: 650, end: 721, name: 'Kalos' },
    alola: { start: 722, end: 809, name: 'Alola' },
    galar: { start: 810, end: 905, name: 'Galar' },
    paldea: { start: 906, end: 1025, name: 'Paldea' }
};

// Classic sound effects simulation
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'correct') {
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'incorrect') {
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
            oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.15); // G3
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (error) {
        console.log('Audio not supported');
    }
}

// Get all Pokemon IDs from a region
function getAllPokemonFromRegion(region) {
    if (region === 'all') {
        // Get ALL Pokemon from generations 1-9
        const allIds = [];
        for (let i = 1; i <= 1025; i++) {
            allIds.push(i);
        }
        return allIds;
    }
    
    if (region === 'random') {
        // Get 100 random Pokemon from all regions
        const allIds = [];
        for (let i = 1; i <= 1025; i++) {
            allIds.push(i);
        }
        return shuffleArray(allIds).slice(0, 100);
    }
    
    const regionData = REGIONS[region];
    if (!regionData) return [];
    
    const pokemonIds = [];
    for (let i = regionData.start; i <= regionData.end; i++) {
        pokemonIds.push(i);
    }
    
    return pokemonIds;
}

// Shuffle array utility
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Focus on next unguessed Pokemon
function focusNextUnguessed() {
    const inputs = document.querySelectorAll('.pokemon-input:not([disabled])');
    
    if (inputs.length === 0) {
        // All Pokemon guessed!
        currentFocusIndex = -1;
        return;
    }
    
    // Find the next unguessed Pokemon after current focus
    let nextIndex = -1;
    const currentInput = document.querySelector(`[data-index="${currentFocusIndex}"]`);
    
    if (currentInput && !currentInput.disabled) {
        // Current focus is still valid, stay here
        return;
    }
    
    // Find next unguessed Pokemon
    for (let i = 0; i < inputs.length; i++) {
        const index = parseInt(inputs[i].dataset.index);
        if (index > currentFocusIndex) {
            nextIndex = index;
            break;
        }
    }
    
    // If no Pokemon found after current, wrap to beginning
    if (nextIndex === -1 && inputs.length > 0) {
        nextIndex = parseInt(inputs[0].dataset.index);
    }
    
    if (nextIndex !== -1) {
        focusPokemon(nextIndex);
    }
}

// Focus on a specific Pokemon by index
function focusPokemon(index) {
    // Remove previous focus
    document.querySelectorAll('.pokemon-card').forEach(card => {
        card.classList.remove('current-focus');
    });
    
    currentFocusIndex = index;
    const input = document.querySelector(`[data-index="${index}"]`);
    const card = input?.closest('.pokemon-card');
    
    if (input && card && !input.disabled) {
        // Add focus styling
        card.classList.add('current-focus');
        
        // Focus the input
        input.focus();
        
        // Scroll to the card smoothly
        card.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });
    }
}

// Find first unguessed Pokemon
function focusFirstUnguessed() {
    const inputs = document.querySelectorAll('.pokemon-input:not([disabled])');
    if (inputs.length > 0) {
        const firstIndex = parseInt(inputs[0].dataset.index);
        focusPokemon(firstIndex);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Region buttons
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            currentRegion = e.target.dataset.region;
            
            // Reset and load new Pokemon
            resetGame();
        });
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only handle navigation if we're not typing in an input
        if (document.activeElement.classList.contains('pokemon-input')) {
            return;
        }
        
        if (e.key === 'ArrowDown' || e.key === 'j') {
            e.preventDefault();
            navigateToNextPokemon(1);
        } else if (e.key === 'ArrowUp' || e.key === 'k') {
            e.preventDefault();
            navigateToNextPokemon(-1);
        }
    });
}

// Navigate to next/previous unguessed Pokemon
function navigateToNextPokemon(direction) {
    const inputs = Array.from(document.querySelectorAll('.pokemon-input:not([disabled])'));
    if (inputs.length === 0) return;
    
    const currentIndex = inputs.findIndex(input => 
        parseInt(input.dataset.index) === currentFocusIndex
    );
    
    let nextIndex;
    if (currentIndex === -1) {
        // No current focus, go to first
        nextIndex = 0;
    } else {
        nextIndex = currentIndex + direction;
        
        // Wrap around
        if (nextIndex >= inputs.length) {
            nextIndex = 0;
        } else if (nextIndex < 0) {
            nextIndex = inputs.length - 1;
        }
    }
    
    const targetInput = inputs[nextIndex];
    if (targetInput) {
        focusPokemon(parseInt(targetInput.dataset.index));
    }
}

// Reset game state
function resetGame() {
    score = 0;
    pokemonData = [];
    currentFocusIndex = -1;
    
    // Calculate total Pokemon for current region
    if (currentRegion === 'all') {
        totalPokemon = 1025; // All Pokemon from Gen 1-9
    } else if (currentRegion === 'random') {
        totalPokemon = 100;
    } else {
        const regionData = REGIONS[currentRegion];
        totalPokemon = regionData ? (regionData.end - regionData.start + 1) : 151;
    }
    
    updateScore();
    init();
}

// This function runs when the page loads
async function init() {
    const pokemonGrid = document.getElementById('pokemon-grid');
    
    if (currentRegion === 'all') {
        pokemonGrid.innerHTML = `
            <div class="loading">
                <div>LOADING ALL 1,025 POKÉMON...</div>
                <div class="loading-progress">
                    <div class="loading-bar">
                        <div class="loading-bar-fill" id="loading-bar-fill"></div>
                    </div>
                    <div class="loading-text" id="loading-text">PREPARING POKÉDEX...</div>
                </div>
            </div>
        `;
    } else {
        pokemonGrid.innerHTML = '<div class="loading">LOADING POKÉMON...</div>';
    }
    
    try {
        await fetchPokemonData();
        displayPokemon();
        updateScore();
        
        // Focus on first Pokemon after loading
        setTimeout(() => {
            focusFirstUnguessed();
        }, 100);
    } catch (error) {
        console.error('Error loading Pokemon:', error);
        pokemonGrid.innerHTML = '<div class="loading">ERROR! PLEASE REFRESH</div>';
    }
}

// Fetch data for all Pokemon in current region
async function fetchPokemonData() {
    const pokemonIds = getAllPokemonFromRegion(currentRegion);
    
    if (currentRegion === 'all') {
        // For all Pokemon, show progress
        pokemonData = await fetchAllPokemonWithProgress(pokemonIds);
    } else {
        // For smaller sets, fetch normally
        const promises = pokemonIds.map(id => fetchSinglePokemon(id));
        pokemonData = await Promise.all(promises);
    }
    
    // Filter out any failed fetches
    pokemonData = pokemonData.filter(pokemon => pokemon !== null);
}

// Fetch all Pokemon with progress indicator
async function fetchAllPokemonWithProgress(pokemonIds) {
    const loadingBarFill = document.getElementById('loading-bar-fill');
    const loadingText = document.getElementById('loading-text');
    const allPokemon = [];
    
    // Batch size for fetching
    const batchSize = 50;
    const totalBatches = Math.ceil(pokemonIds.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, pokemonIds.length);
        const batchIds = pokemonIds.slice(start, end);
        
        // Update progress
        const progress = (batchIndex / totalBatches) * 100;
        if (loadingBarFill) loadingBarFill.style.width = `${progress}%`;
        if (loadingText) loadingText.textContent = `LOADING BATCH ${batchIndex + 1}/${totalBatches}...`;
        
        // Fetch batch
        const batchPromises = batchIds.map(id => fetchSinglePokemon(id));
        const batchResults = await Promise.all(batchPromises);
        allPokemon.push(...batchResults);
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    if (loadingBarFill) loadingBarFill.style.width = '100%';
    if (loadingText) loadingText.textContent = 'POKÉDEX READY!';
    
    return allPokemon;
}

// Fetch a single Pokemon with retry logic
async function fetchSinglePokemon(id, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            return {
                id: data.id,
                name: data.name,
                sprite: data.sprites.front_default || data.sprites.other?.['official-artwork']?.front_default
            };
        } catch (error) {
            console.log(`Attempt ${attempt + 1} failed for Pokemon ${id}:`, error);
            if (attempt < retries - 1) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    // If all retries failed, return a placeholder
    return {
        id: id,
        name: `pokemon-${id}`,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
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
        <div class="pokemon-id">#${String(pokemon.id).padStart(4, '0')}</div>
        <img src="${pokemon.sprite}" alt="Pokemon ${pokemon.id}" class="pokemon-sprite" loading="lazy">
        <input 
            type="text" 
            class="pokemon-input" 
            placeholder="ENTER NAME..."
            data-index="${index}"
            data-correct-name="${pokemon.name}"
            data-pokemon-id="${pokemon.id}"
            maxlength="20"
            autocomplete="off"
        >
        <div class="pokemon-name" id="name-${index}" style="display: none;">${formatPokemonName(pokemon.name)}</div>
    `;
    
    // Add event listener to the input
    const input = card.querySelector('.pokemon-input');
    input.addEventListener('input', handleGuess);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // Don't blur, let auto-navigation handle it
            e.preventDefault();
        }
    });
    
    // Update current focus when clicking on an input
    input.addEventListener('focus', function() {
        const inputIndex = parseInt(this.dataset.index);
        if (currentFocusIndex !== inputIndex) {
            focusPokemon(inputIndex);
        }
    });
    
    // Convert input to uppercase as user types (Game Boy style)
    input.addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });
    
    return card;
}

// Format Pokemon name for display
function formatPokemonName(name) {
    return name.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ').toUpperCase();
}

// Normalize names for comparison (handle special cases)
function normalizeName(name) {
    return name.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .trim();
}

// Handle user guesses
function handleGuess(event) {
    const input = event.target;
    const guess = normalizeName(input.value);
    const correctName = normalizeName(input.dataset.correctName);
    const index = input.dataset.index;
    const nameDiv = document.getElementById(`name-${index}`);
    
    // Remove previous styling
    input.classList.remove('correct', 'incorrect');
    
    if (guess === '') {
        nameDiv.style.display = 'none';
        return;
    }
    
    // Check for alternative names and common variations
    const isCorrect = checkPokemonName(guess, correctName, input.dataset.pokemonId);
    
    if (isCorrect) {
        // Correct guess
        input.classList.add('correct');
        input.disabled = true;
        nameDiv.style.display = 'block';
        
        // Add visual feedback to the card
        input.closest('.pokemon-card').classList.add('guessed');
        
        // Play success sound
        playSound('correct');
        
        // Update score if this is the first correct guess for this Pokemon
        if (!input.dataset.scored) {
            score++;
            input.dataset.scored = 'true';
            updateScore();
        }
        
        // Auto-navigate to next unguessed Pokemon
        setTimeout(() => {
            focusNextUnguessed();
        }, 300);
        
    } else {
        // Incorrect guess
        input.classList.add('incorrect');
        nameDiv.style.display = 'none';
        
        // Play error sound
        playSound('incorrect');
        
        // Remove incorrect styling after animation
        setTimeout(() => {
            input.classList.remove('incorrect');
        }, 400);
    }
}

// Check Pokemon name with common variations and alternative names
function checkPokemonName(guess, correctName, pokemonId) {
    // Direct match
    if (guess === correctName) return true;
    
    // Common name variations
    const variations = getNameVariations(correctName, pokemonId);
    return variations.some(variation => normalizeName(variation) === guess);
}

// Get common name variations for Pokemon
function getNameVariations(originalName, pokemonId) {
    const variations = [originalName];
    
    // Handle hyphenated names
    if (originalName.includes('-')) {
        const parts = originalName.split('-');
        variations.push(parts.join(''));
        variations.push(parts.join(' '));
        variations.push(parts[0]); // Just the first part
    }
    
    // Handle some common alternative names
    const commonAlternatives = {
        'nidoran-f': ['nidoran♀', 'nidoranf', 'nidoran female'],
        'nidoran-m': ['nidoran♂', 'nidoranm', 'nidoran male'],
        'mr-mime': ['mrmime', 'mr mime'],
        'farfetchd': ['farfetch\'d', 'farfetched'],
        'ho-oh': ['hooh', 'ho oh'],
        'porygon-z': ['porygonz', 'porygon z'],
        'mime-jr': ['mimejr', 'mime jr'],
        'type-null': ['typenull', 'type null'],
        'jangmo-o': ['jangmoo', 'jangmo o'],
        'hakamo-o': ['hakamoo', 'hakamo o'],
        'kommo-o': ['kommoo', 'kommo o']
    };
    
    if (commonAlternatives[originalName]) {
        variations.push(...commonAlternatives[originalName]);
    }
    
    return variations;
}

// Update the score display
function updateScore() {
    const scoreElement = document.getElementById('score');
    const scoreNumber = scoreElement.querySelector('.score-number');
    const progressFill = document.getElementById('progress-fill');
    
    scoreNumber.textContent = `${score}/${totalPokemon}`;
    
    // Update progress bar
    const percentage = (score / totalPokemon) * 100;
    progressFill.style.width = `${percentage}%`;
    
    // Check if all Pokemon are guessed correctly
    if (score === totalPokemon) {
        setTimeout(() => {
            let regionName;
            if (currentRegion === 'all') {
                regionName = 'ALL POKÉMON';
            } else if (currentRegion === 'random') {
                regionName = 'RANDOM MIX';
            } else {
                regionName = REGIONS[currentRegion]?.name || currentRegion.toUpperCase();
            }
            
            const message = `★ CONGRATULATIONS! ★\n\nPOKÉMON MASTER ACHIEVED!\n\nREGION: ${regionName}\nSCORE: ${score}/${totalPokemon}\n\nYOU IDENTIFIED THEM ALL!`;
            alert(message);
        }, 500);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    init();
});