document.addEventListener('DOMContentLoaded', function() {
    // Game settings variables
    let gameSettings = {
        players: 3,  // P
        lucky: 2,    // L
        game: 5,     // G
        table: 3     // T
    };

    // Game state variables
    let isLocked = false;
    let actionHistory = [];

    // Formula variables for easier calculations
    const Formula = {
        // Lucky points formulas
        calculateLuckyPoints: (L, P) => L * (P - 1),  // For multi-player: L × (active players - 1)
        calculateDirectLucky: (L) => L,                // For direct transfer: just L amount
        
        // Game points formulas
        calculateGamePoints: (G, P) => G * (P - 1),   // Game points: G × (active players - 1)
        calculateTablePenalty: (T) => -T,             // Table penalty: -T
        
        // Helper function to get active players count (excluding frozen)
        getActiveCount: () => {
            return document.querySelectorAll('.player-card:not(.frozen)').length;
        },
        
        // Add function to get total players (including frozen)
        getTotalPlayers: () => {
            return document.querySelectorAll('.player-card').length;
        }
    };

    // First, add both overlays HTML at the start
    const overlaysHTML = `
        <div class="alert-overlay" style="display: none;">
            <div class="alert-frame">
                <h3>Maximum Players</h3>
                <p>Maximum number of players (5) has been reached.</p>
                <button class="btn btn--confirm">OK</button>
            </div>
        </div>
        <div class="confirmation-overlay" style="display: none;">
            <div class="confirmation-frame">
                <h3>Reset Game</h3>
                <p>Are you sure? This will reset all scores and players.</p>
                <div class="confirmation-buttons">
                    <button class="btn btn--cancel">Cancel</button>
                    <button class="btn btn--confirm">OK</button>
                </div>
            </div>
        </div>
    `;
    
    // Add the overlays to the body once
    document.body.insertAdjacentHTML('beforeend', overlaysHTML);

    // Get all the necessary elements
    const floatingButtons = document.querySelector('.floating-buttons');
    const menuButton = document.querySelector('.float-btn--menu');
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsPanel = document.querySelector('.settings-panel');
    const settingsOverlay = document.querySelector('.settings-overlay');
    const saveLockBtn = document.querySelector('.btn');
    const alertOverlay = document.querySelector('.alert-overlay');
    const confirmationOverlay = document.querySelector('.confirmation-overlay');

    // Function to update settings from inputs
    function updateSettings() {
        gameSettings.players = parseInt(document.getElementById('settingsPlayerInput').value) || 3;
        gameSettings.lucky = parseInt(document.getElementById('settingsLuckyInput').value) || 2;
        gameSettings.game = parseInt(document.getElementById('settingsGameInput').value) || 5;
        gameSettings.table = parseInt(document.getElementById('settingsTableInput').value) || 3;
    }

    // Add event listeners to inputs to update settings
    const settingsInputs = document.querySelectorAll('.input-number-container input');
    settingsInputs.forEach(input => {
        input.addEventListener('change', updateSettings);
    });

    // Add functions for saving and loading game state
    function saveGameState() {
        const gameState = {
            settings: gameSettings,
            isLocked: isLocked,
            players: [],
            actionHistory: actionHistory
        };

        // Save player cards data
        document.querySelectorAll('.player-card').forEach(card => {
            const playerData = {
                name: card.querySelector('.player-card__name').textContent,
                frozen: card.classList.contains('frozen'),
                stats: {
                    lucky: parseInt(card.querySelector('.player-card__stat:nth-child(1) .stat-value').textContent) || 0,
                    game: parseInt(card.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent) || 0,
                    table: parseInt(card.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent) || 0
                }
            };
            gameState.players.push(playerData);
        });

        localStorage.setItem('luckyScoreGameState', JSON.stringify(gameState));
    }

    // Add function to clear game data
    function clearGameData() {
        showMessage('confirm', 'Clear All Data', 'Are you sure? This will delete all saved game data.', ['Cancel', 'OK']).then(confirmed => {
            if (confirmed) {
                // Clear localStorage
                localStorage.removeItem('luckyScoreGameState');
                
                // Reset game state
                isLocked = false;
                actionHistory = [];
                
                // Reset UI
                const playerContainer = document.getElementById('playerCardsContainer');
                if (playerContainer) {
                    playerContainer.innerHTML = '';
                }
                
                // Reset table total
                const tableTotal = document.querySelector('.table-total');
                if (tableTotal) {
                    tableTotal.textContent = 'Total: 0';
                }
                
                // Enable settings inputs
                const inputs = document.querySelectorAll('.input-number-container input');
                inputs.forEach(input => input.disabled = false);
                
                // Enable settings buttons
                const inputButtons = document.querySelectorAll('.input-number-btn');
                inputButtons.forEach(button => button.disabled = false);
                
                // Reset lock button
                if (saveLockBtn) {
                    saveLockBtn.textContent = 'Lock';
                    saveLockBtn.classList.remove('btn--locked');
                }
                
                // Remove Add Player button
                const addPlayerBtn = document.querySelector('.btn--add-player');
                if (addPlayerBtn) {
                    addPlayerBtn.remove();
                }
                
                // Show settings panel
                settingsBtn.classList.add('active');
                settingsPanel.classList.add('active');
                settingsOverlay.classList.add('active');
                
                // Show success message
                showMessage('alert', 'Data Cleared', 'All game data has been cleared successfully.', ['OK']);
            }
        });
    }

    // Add clear data button to settings panel
    const buttonGroup = document.querySelector('.button-group');
    if (buttonGroup) {
        const clearDataBtn = document.createElement('button');
        clearDataBtn.className = 'btn btn--clear-data';
        clearDataBtn.textContent = 'Clear Data';
        clearDataBtn.style.cssText = `
            background-color: #dc3545;
            color: white;
            margin-top: 10px;
            width: 100%;
        `;
        clearDataBtn.addEventListener('click', clearGameData);
        buttonGroup.appendChild(clearDataBtn);
    }

    function loadGameState() {
        const savedState = localStorage.getItem('luckyScoreGameState');
        if (!savedState) return false;

        try {
            const gameState = JSON.parse(savedState);
            
            // Restore settings
            gameSettings = gameState.settings;
            isLocked = gameState.isLocked;
            actionHistory = gameState.actionHistory || [];

            // Update settings inputs
            document.getElementById('settingsPlayerInput').value = gameSettings.players;
            document.getElementById('settingsLuckyInput').value = gameSettings.lucky;
            document.getElementById('settingsGameInput').value = gameSettings.game;
            document.getElementById('settingsTableInput').value = gameSettings.table;

            // If game is locked, create and restore player cards
            if (isLocked) {
                const playerContainer = document.getElementById('playerCardsContainer');
                playerContainer.innerHTML = '';

                gameState.players.forEach(playerData => {
                    const playerCard = document.createElement('div');
                    playerCard.className = 'player-card';
                    if (playerData.frozen) playerCard.classList.add('frozen');
                    
                    playerCard.innerHTML = `
                        <div class="player-card__header">
                            <span class="player-card__name">${playerData.name}</span>
                            <div class="player-card__controls">
                                <button class="player-card__btn player-card__btn--p">P</button>
                                <button class="player-card__btn player-card__btn--b">B</button>
                                <button class="player-card__btn player-card__btn--freeze">❄️</button>
                            </div>
                        </div>
                        <div class="player-card__stats">
                            <div class="player-card__stat">
                                <span class="stat-label">Lucky</span>
                                <span class="stat-value">${playerData.stats.lucky}</span>
                            </div>
                            <div class="player-card__stat">
                                <span class="stat-label">Game</span>
                                <span class="stat-value">${playerData.stats.game}</span>
                            </div>
                            <div class="player-card__stat">
                                <span class="stat-label">Table</span>
                                <span class="stat-value">${playerData.stats.table}</span>
                            </div>
                            <div class="player-card__stat player-card__stat--total">
                                <span class="stat-label">Total</span>
                                <span class="stat-value">${playerData.stats.lucky + playerData.stats.game + playerData.stats.table}</span>
                            </div>
                        </div>
                    `;
                    playerContainer.appendChild(playerCard);
                    setupPlayerNameEditing(playerCard);
                });

                // Setup buttons and update UI
                setupPlayerCardButtons();
                updateAllTotals();

                // Update UI for locked state
                const saveLockBtn = document.querySelector('.btn');
                if (saveLockBtn) {
                    saveLockBtn.textContent = 'Unlock';
                    saveLockBtn.classList.add('btn--locked');
                }

                // Disable settings
                const inputs = document.querySelectorAll('.input-number-container input');
                inputs.forEach(input => input.disabled = true);
                const inputButtons = document.querySelectorAll('.input-number-btn');
                inputButtons.forEach(button => button.disabled = true);

                // Add the Add Player button if needed
                const buttonGroup = document.querySelector('.button-group');
                if (buttonGroup && Formula.getActiveCount() < 5) {
                    let addPlayerBtn = buttonGroup.querySelector('.btn--add-player');
                    if (!addPlayerBtn) {
                        addPlayerBtn = document.createElement('button');
                        addPlayerBtn.className = 'btn btn--add-player';
                        addPlayerBtn.textContent = '+ Add Player';
                        addPlayerBtn.style.display = 'block';
                        buttonGroup.appendChild(addPlayerBtn);
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Error loading game state:', error);
            return false;
        }
    }

    // Add event listeners to save game state
    function setupAutoSave() {
        // Save after any point changes
        const saveActions = ['handleLuckyPoints', 'handleGamePoints', 'handlePenalty', 'handleUndo'];
        saveActions.forEach(action => {
            const original = window[action];
            window[action] = function(...args) {
                original.apply(this, args);
                saveGameState();
            };
        });

        // Save when player is added or frozen
        const observer = new MutationObserver(() => {
            if (isLocked) saveGameState();
        });
        const playerContainer = document.getElementById('playerCardsContainer');
        observer.observe(playerContainer, { childList: true, subtree: true, attributes: true });
    }

    // Try to load saved state when page loads
    loadGameState();
    setupAutoSave();

    // Add beforeunload event listener to prevent accidental refresh/close
    window.addEventListener('beforeunload', function(e) {
        // Only show warning if game is locked (active)
        if (isLocked) {
            // Standard message for modern browsers
            const message = 'Game in progress. Are you sure you want to leave?';
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });

    // Add this function at the top level
    function showMessage(type, title, message, buttons) {
        // Remove any existing temporary overlays first
        const existingOverlay = document.querySelector('.temp-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        let overlayHTML = '';
        if (type === 'alert') {
            overlayHTML = `
                <div class="alert-overlay temp-overlay" style="display: flex;">
                    <div class="alert-frame">
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <button class="btn btn--confirm">OK</button>
                    </div>
                </div>
            `;
        } else if (type === 'confirm') {
            overlayHTML = `
                <div class="confirmation-overlay temp-overlay" style="display: flex;">
                    <div class="confirmation-frame">
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <div class="confirmation-buttons">
                            <button class="btn btn--cancel">Cancel</button>
                            <button class="btn btn--confirm">OK</button>
                        </div>
                    </div>
                </div>
            `;
        }

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        const overlay = document.body.lastElementChild;

        return new Promise((resolve) => {
            if (type === 'alert') {
                const okBtn = overlay.querySelector('.btn--confirm');
                okBtn.onclick = () => {
                    overlay.remove();
                    resolve(true);
                };
            } else if (type === 'confirm') {
                const cancelBtn = overlay.querySelector('.btn--cancel');
                const confirmBtn = overlay.querySelector('.btn--confirm');
                
                cancelBtn.onclick = () => {
                    overlay.remove();
                    resolve(false);
                };
                
                confirmBtn.onclick = () => {
                    overlay.remove();
                    resolve(true);
                };
            }
        });
    }

    // Function to show max players alert
    function showMaxPlayersAlert() {
        return showMessage(
            'alert',
            'Maximum Players',
            'Maximum number of players (5) has been reached.',
            ['OK']
        );
    }

    // Toggle floating buttons
    menuButton.addEventListener('click', function() {
        floatingButtons.classList.toggle('expanded');
    });

    // Close floating buttons when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInside = floatingButtons.contains(event.target);
        
        if (!isClickInside && floatingButtons.classList.contains('expanded')) {
            floatingButtons.classList.remove('expanded');
        }
    });

    // Settings panel functionality
    settingsBtn.addEventListener('click', function() {
        settingsBtn.classList.toggle('active');
        settingsPanel.classList.toggle('active');
        settingsOverlay.classList.toggle('active');
    });

    // Close panel when clicking overlay
    settingsOverlay.addEventListener('click', function() {
        settingsBtn.classList.remove('active');
        settingsPanel.classList.remove('active');
        settingsOverlay.classList.remove('active');
    });

    // Handle number input buttons
    const numberButtons = document.querySelectorAll('.input-number-btn');
    
    numberButtons.forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.getAttribute('data-input');
            const input = document.getElementById(inputId);
            const currentValue = parseInt(input.value) || 0;
            const min = parseInt(input.getAttribute('min'));
            const max = parseInt(input.getAttribute('max'));
            
            if (this.classList.contains('input-number-btn--minus')) {
                if (!min || currentValue > min) {
                    input.value = currentValue - 1;
                }
            } else if (this.classList.contains('input-number-btn--plus')) {
                if (!max || currentValue < max) {
                    input.value = currentValue + 1;
                }
            }

            // Trigger change event
            const event = new Event('change');
            input.dispatchEvent(event);
        });
    });

    // Prevent manual input if outside min/max range
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        input.addEventListener('change', function() {
            const value = parseInt(this.value) || 0;
            const min = parseInt(this.getAttribute('min'));
            const max = parseInt(this.getAttribute('max'));

            if (min && value < min) this.value = min;
            if (max && value > max) this.value = max;
        });
    });

    // Update the SaveLock button functionality
    if (saveLockBtn) {
        saveLockBtn.textContent = 'Lock';
        
        saveLockBtn.addEventListener('click', function() {
            if (!isLocked) {
                updateSettings();  // Update settings before creating cards
                createPlayerCards();
                
                // Disable all input boxes
                const inputs = document.querySelectorAll('.input-number-container input');
                inputs.forEach(input => {
                    input.disabled = true;
                });
                
                // Disable all +/- buttons
                const inputButtons = document.querySelectorAll('.input-number-btn');
                inputButtons.forEach(button => {
                    button.disabled = true;
                });
                
                // Update button state
                isLocked = true;
                this.textContent = 'Unlock';
                this.classList.add('btn--locked');
                
                // Save game state after locking
                saveGameState();
                
                // Add the Add Player button to button group only if less than 5 active players
                const buttonGroup = document.querySelector('.button-group');
                if (buttonGroup && Formula.getActiveCount() < 5) {
                    // First check if button already exists
                    let addPlayerBtn = buttonGroup.querySelector('.btn--add-player');
                    if (!addPlayerBtn) {
                        addPlayerBtn = document.createElement('button');
                        addPlayerBtn.className = 'btn btn--add-player';
                        addPlayerBtn.textContent = '+ Add Player';
                        addPlayerBtn.style.display = 'block';
                        
                        // Add click event for Add Player button
                        addPlayerBtn.addEventListener('click', function() {
                            const playerContainer = document.getElementById('playerCardsContainer');
                            if (playerContainer) {
                                const totalPlayers = document.querySelectorAll('.player-card').length;
                                const frozenPlayers = document.querySelectorAll('.player-card.frozen').length;
                                const activePlayers = totalPlayers - frozenPlayers;
                                
                                // Check if we have room for more players
                                if (activePlayers >= 5) {
                                    showMaxPlayersAlert();
                                    this.style.display = 'none';
                                    return;
                                }
                                
                                const newPlayerNumber = totalPlayers + 1;
                                
                                // Create a new player card
                                const playerCard = document.createElement('div');
                                playerCard.className = 'player-card';
                                playerCard.innerHTML = `
                                    <div class="player-card__header">
                                        <span class="player-card__name">Player ${newPlayerNumber}</span>
                                        <div class="player-card__controls">
                                            <button class="player-card__btn player-card__btn--p">P</button>
                                            <button class="player-card__btn player-card__btn--b">B</button>
                                            <button class="player-card__btn player-card__btn--freeze">❄️</button>
                                        </div>
                                    </div>
                                    <div class="player-card__stats">
                                        <div class="player-card__stat">
                                            <span class="stat-label">Lucky</span>
                                            <span class="stat-value">0</span>
                                        </div>
                                        <div class="player-card__stat">
                                            <span class="stat-label">Game</span>
                                            <span class="stat-value">0</span>
                                        </div>
                                        <div class="player-card__stat">
                                            <span class="stat-label">Table</span>
                                            <span class="stat-value">0</span>
                                        </div>
                                        <div class="player-card__stat player-card__stat--total">
                                            <span class="stat-label">Total</span>
                                            <span class="stat-value">0</span>
                                        </div>
                                    </div>
                                `;
                                playerContainer.appendChild(playerCard);
                                setupPlayerNameEditing(playerCard);
                                
                                // First remove all existing button event listeners
                                document.querySelectorAll('.player-card').forEach(card => {
                                    const pButton = card.querySelector('.player-card__btn--p');
                                    const bButton = card.querySelector('.player-card__btn--b');
                                    const freezeButton = card.querySelector('.player-card__btn--freeze');
                                    
                                    // Clone and replace buttons to remove old event listeners
                                    if (pButton) {
                                        const newPButton = pButton.cloneNode(true);
                                        pButton.parentNode.replaceChild(newPButton, pButton);
                                    }
                                    if (bButton) {
                                        const newBButton = bButton.cloneNode(true);
                                        bButton.parentNode.replaceChild(newBButton, bButton);
                                    }
                                    if (freezeButton) {
                                        const newFreezeButton = freezeButton.cloneNode(true);
                                        freezeButton.parentNode.replaceChild(newFreezeButton, freezeButton);
                                    }
                                });
                                
                                // Then setup buttons for all cards
                                setupPlayerCardButtons();
                                
                                // Reorder cards to ensure frozen cards are at the bottom
                                reorderPlayerCards();
                                
                                // Hide Add Player button if max active players reached
                                if (activePlayers + 1 >= 5) {
                                    this.style.display = 'none';
                                }
                                
                                // Save game state after adding player
                                saveGameState();
                            }
                        });
                        
                        buttonGroup.appendChild(addPlayerBtn);
                    }
                }
                
                // Close settings panel
                settingsBtn.classList.remove('active');
                settingsPanel.classList.remove('active');
                settingsOverlay.classList.remove('active');
            } else {
                // Show confirmation overlay when trying to unlock
                showMessage('confirm', 'Reset Game', 'Are you sure? This will reset all scores and players.', ['Cancel', 'OK']).then(confirmed => {
                    if (confirmed) {
                        // Reset everything
                        isLocked = false;
                        
                            // Enable all input boxes
                            const inputs = document.querySelectorAll('.input-number-container input');
                            inputs.forEach(input => {
                                input.disabled = false;
                            });
                            
                            // Enable all +/- buttons
                            const inputButtons = document.querySelectorAll('.input-number-btn');
                            inputButtons.forEach(button => {
                                button.disabled = false;
                            });
                
                // Reset button state
                    saveLockBtn.textContent = 'Lock';
                    saveLockBtn.classList.remove('btn--locked');
                
                // Clear player cards
                const playerContainer = document.getElementById('playerCardsContainer');
                if (playerContainer) {
                    playerContainer.innerHTML = '';
                }
                
                // Reset table total
                const tableTotal = document.querySelector('.table-total');
                if (tableTotal) {
                    tableTotal.textContent = 'Total: 0';
                }
                
                        // Remove Add Player button
                        const addPlayerBtn = document.querySelector('.btn--add-player');
                        if (addPlayerBtn) {
                            addPlayerBtn.remove();
                        }
                        
                        // Clear saved game state when unlocking
                        localStorage.removeItem('luckyScoreGameState');
                
                // Show settings panel
                    settingsBtn.classList.add('active');
                    settingsPanel.classList.add('active');
                    settingsOverlay.classList.add('active');
                }
            });
        }
        });
    }

    // Remove separate event listeners for confirmation buttons since we're using showMessage
    if (confirmationOverlay) {
        confirmationOverlay.remove();
    }

    // Function to create player cards
    function createPlayerCards() {
        const playerContainer = document.getElementById('playerCardsContainer');
        if (!playerContainer) return;
        
        playerContainer.innerHTML = '';

        const count = gameSettings.players;
        for (let i = 1; i <= count; i++) {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.innerHTML = `
                <div class="player-card__header">
                    <span class="player-card__name">Player ${i}</span>
                    <div class="player-card__controls">
                        <button class="player-card__btn player-card__btn--p">P</button>
                        <button class="player-card__btn player-card__btn--b">B</button>
                        <button class="player-card__btn player-card__btn--freeze">❄️</button>
                    </div>
                </div>
                <div class="player-card__stats">
                    <div class="player-card__stat">
                        <span class="stat-label">Lucky</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="player-card__stat">
                        <span class="stat-label">Game</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="player-card__stat">
                        <span class="stat-label">Table</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="player-card__stat player-card__stat--total">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">0</span>
                    </div>
                </div>
            `;
            playerContainer.appendChild(playerCard);
            setupPlayerNameEditing(playerCard);
        }

        // After creating all cards, setup their buttons
        setupPlayerCardButtons();
    }

    // Add this function to handle player card button clicks
    function setupPlayerCardButtons() {
        const playerCards = document.querySelectorAll('.player-card');
        
        playerCards.forEach(card => {
            const pButton = card.querySelector('.player-card__btn--p');
            const bButton = card.querySelector('.player-card__btn--b');
            const freezeButton = card.querySelector('.player-card__btn--freeze');
            
            // P Button (Winner/Receiver)
            pButton.addEventListener('click', function() {
                const allPButtons = document.querySelectorAll('.player-card__btn--p');
                const allBButtons = document.querySelectorAll('.player-card__btn--b');
                const playerCard = this.closest('.player-card');
                
                // If this P button is already active, deactivate it
                if (this.classList.contains('active')) {
                    this.classList.remove('active');
                    playerCard.classList.remove('p-active');
                } else {
                    // Deactivate all other P buttons first
                    allPButtons.forEach(btn => {
                        btn.classList.remove('active');
                        btn.closest('.player-card').classList.remove('p-active');
                    });
                    
                    // Activate this P button
                    this.classList.add('active');
                    playerCard.classList.add('p-active');
                    playerCard.classList.remove('b-active');
                    
                    // Remove active state from B button in same card
                    bButton.classList.remove('active');
                }
            });
            
            // B Button (Loser/Giver)
            bButton.addEventListener('click', function() {
                const allBButtons = document.querySelectorAll('.player-card__btn--b');
                const allPButtons = document.querySelectorAll('.player-card__btn--p');
                const playerCard = this.closest('.player-card');
                
                // If this B button is already active, deactivate it
                if (this.classList.contains('active')) {
                    this.classList.remove('active');
                    playerCard.classList.remove('b-active');
                } else {
                    // Deactivate all other B buttons first
                    allBButtons.forEach(btn => {
                        btn.classList.remove('active');
                        btn.closest('.player-card').classList.remove('b-active');
                    });
                    
                    // Activate this B button
                    this.classList.add('active');
                    playerCard.classList.add('b-active');
                    playerCard.classList.remove('p-active');
                    
                    // Remove active state from P button in same card
                    pButton.classList.remove('active');
                }
            });
            
            // Freeze Button
            freezeButton.addEventListener('click', async function() {
                const playerCard = this.closest('.player-card');
                
                if (!playerCard.classList.contains('frozen')) {
                    // Freezing the player
                    playerCard.classList.add('frozen');
                    pButton.classList.remove('active');
                    bButton.classList.remove('active');
                    playerCard.classList.remove('p-active', 'b-active');
                    
                    // Reorder cards after freezing
                    reorderPlayerCards();
                } else {
                    // Check active players count before unfreezing
                    const activeCount = Formula.getActiveCount();
                    if (activeCount >= 5) {
                        await showMessage(
                            'alert',
                            'Cannot Unfreeze',
                            'Maximum number of active players (5) would be exceeded.',
                            ['OK']
                        );
                        return;
                    }

                    // Show confirmation before unfreezing
                    const confirmed = await showMessage(
                        'confirm',
                        'Unfreeze Player',
                        'Are you sure you want to unfreeze this player?',
                        ['Cancel', 'OK']
                    );
                    
                    if (confirmed) {
                        playerCard.classList.remove('frozen');
                        
                        // Reorder cards after unfreezing
                        reorderPlayerCards();
                        
                        // Show Add Player button if it was hidden
                        const addPlayerBtn = document.querySelector('.btn--add-player');
                        if (addPlayerBtn && Formula.getActiveCount() < 5) {
                            addPlayerBtn.style.display = 'block';
                        }
                    }
                }
            });
        });
    }

    // Add this function to handle reordering of player cards
    function reorderPlayerCards() {
        const playerContainer = document.getElementById('playerCardsContainer');
        if (!playerContainer) return;

        // Get all player cards and convert to array for sorting
        const cards = Array.from(playerContainer.children);
        
        // Sort cards: frozen cards go to bottom
        cards.sort((a, b) => {
            const aFrozen = a.classList.contains('frozen');
            const bFrozen = b.classList.contains('frozen');
            
            if (aFrozen && !bFrozen) return 1;  // a goes after b
            if (!aFrozen && bFrozen) return -1; // a goes before b
            return 0;  // keep original order
        });
        
        // Remove all cards
        playerContainer.innerHTML = '';
        
        // Add cards back in new order
        cards.forEach(card => {
            playerContainer.appendChild(card);
        });
    }

    // Add these functions for the floating buttons
    function getActivePlayersCount() {
        const playerCards = document.querySelectorAll('.player-card:not(.frozen)');
        return playerCards.length;
    }

    // Add this function to save actions to history
    function saveAction(action) {
        actionHistory.push({
            type: action.type,  // 'lucky', 'game', 'penalty'
            players: action.players.map(player => ({
                element: player.element,
                previousValues: {
                    lucky: parseInt(player.element.querySelector('.player-card__stat:nth-child(1) .stat-value').textContent),
                    game: parseInt(player.element.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent),
                    table: parseInt(player.element.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent)
                }
            }))
        });
    }

    // Add this function to handle undo
    function handleUndo() {
        if (actionHistory.length === 0) {
            showMessage(
                'alert',
                'No Actions to Undo',
                'There are no actions to undo.',
                ['OK']
            );
            return;
        }

        const lastAction = actionHistory.pop();
        
        // Restore previous values
        lastAction.players.forEach(player => {
            const luckyValue = player.element.querySelector('.player-card__stat:nth-child(1) .stat-value');
            const gameValue = player.element.querySelector('.player-card__stat:nth-child(2) .stat-value');
            const tableValue = player.element.querySelector('.player-card__stat:nth-child(3) .stat-value');
            
            luckyValue.textContent = player.previousValues.lucky;
            gameValue.textContent = player.previousValues.game;
            tableValue.textContent = player.previousValues.table;
        });
        
        updateAllTotals();
    }

    // Update handleLuckyPoints to save action
    function handleLuckyPoints(isAdd) {
        const pPlayers = document.querySelectorAll('.player-card:not(.frozen) .player-card__btn--p.active');
        const bPlayers = document.querySelectorAll('.player-card:not(.frozen) .player-card__btn--b.active');
        
        if (pPlayers.length === 0 && bPlayers.length === 0) {
            showMessage(
                'alert',
                'No Player Selected',
                'Please select a player (P or B) before using Lucky points.',
                ['OK']
            );
            return;
        }

        // Save state before making changes
        const affectedPlayers = [];
        if (pPlayers.length === 1) {
            affectedPlayers.push({ element: pPlayers[0].closest('.player-card') });
        }
        if (bPlayers.length === 1) {
            affectedPlayers.push({ element: bPlayers[0].closest('.player-card') });
        }
        if (pPlayers.length === 1 && bPlayers.length === 0) {
            document.querySelectorAll('.player-card:not(.frozen)').forEach(card => {
                if (!card.querySelector('.player-card__btn--p.active')) {
                    affectedPlayers.push({ element: card });
                }
            });
        }
        saveAction({ type: 'lucky', players: affectedPlayers });

        if (pPlayers.length === 1 && bPlayers.length === 1) {
            // Direct transfer between P and B players
            const pCard = pPlayers[0].closest('.player-card');
            const bCard = bPlayers[0].closest('.player-card');
            
            const pLuckyValue = pCard.querySelector('.player-card__stat:nth-child(1) .stat-value');
            const bLuckyValue = bCard.querySelector('.player-card__stat:nth-child(1) .stat-value');
            
            // When B is active, B loses/gains L*P points
            const bAmount = isAdd ? -Formula.calculateLuckyPoints(gameSettings.lucky, Formula.getActiveCount()) : Formula.calculateLuckyPoints(gameSettings.lucky, Formula.getActiveCount());
            const pAmount = isAdd ? Formula.calculateLuckyPoints(gameSettings.lucky, Formula.getActiveCount()) : -Formula.calculateLuckyPoints(gameSettings.lucky, Formula.getActiveCount());
            
            pLuckyValue.textContent = parseInt(pLuckyValue.textContent) + pAmount;
            bLuckyValue.textContent = parseInt(bLuckyValue.textContent) + bAmount;
        } else if (pPlayers.length === 1 && bPlayers.length === 0) {
            // Multi-player transfer
            const pCard = pPlayers[0].closest('.player-card');
            const pLuckyValue = pCard.querySelector('.player-card__stat:nth-child(1) .stat-value');
            const amount = isAdd ? Formula.calculateLuckyPoints(gameSettings.lucky, Formula.getActiveCount()) : -Formula.calculateLuckyPoints(gameSettings.lucky, Formula.getActiveCount());
            
            // Update P player
            pLuckyValue.textContent = parseInt(pLuckyValue.textContent) + amount;
            
            // Update other players
            document.querySelectorAll('.player-card:not(.frozen)').forEach(card => {
                if (!card.querySelector('.player-card__btn--p.active')) {
                    const luckyValue = card.querySelector('.player-card__stat:nth-child(1) .stat-value');
                    luckyValue.textContent = parseInt(luckyValue.textContent) + (isAdd ? -gameSettings.lucky : gameSettings.lucky);
                }
            });
        }
        
        updateAllTotals();
    }

    // Add event listeners for floating buttons
    document.querySelector('.float-btn--lucky-add').addEventListener('click', () => handleLuckyPoints(true));
    document.querySelector('.float-btn--lucky-minus').addEventListener('click', () => handleLuckyPoints(false));

    // Function to update totals
    function updateAllTotals() {
        document.querySelectorAll('.player-card').forEach(card => {
            const lucky = parseInt(card.querySelector('.player-card__stat:nth-child(1) .stat-value').textContent) || 0;
            const game = parseInt(card.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent) || 0;
            const table = parseInt(card.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent) || 0;
            const total = lucky + game + table;
            
            card.querySelector('.player-card__stat--total .stat-value').textContent = total;
        });
        
        // Update table total (sum of absolute table values)
        let tableTotal = 0;
        document.querySelectorAll('.player-card').forEach(card => {
            const tableValue = parseInt(card.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent) || 0;
            tableTotal += Math.abs(tableValue);
        });
        document.querySelector('.table-total').textContent = `Total: ${tableTotal}`;
    }

    // Update handleGamePoints to save action
    function handleGamePoints() {
        const pPlayers = document.querySelectorAll('.player-card:not(.frozen) .player-card__btn--p.active');
        const bPlayers = document.querySelectorAll('.player-card:not(.frozen) .player-card__btn--b.active');
        
        if (pPlayers.length === 0) {
            showMessage(
                'alert',
                'No Winner Selected',
                'Please select a winner (P) before using Game points.',
                ['OK']
            );
            return;
        }

        // Save state before making changes
        const affectedPlayers = [];
        if (pPlayers.length === 1) {
            affectedPlayers.push({ element: pPlayers[0].closest('.player-card') });
        }
        if (bPlayers.length === 1) {
            affectedPlayers.push({ element: bPlayers[0].closest('.player-card') });
        }
        if (pPlayers.length === 1 && bPlayers.length === 0) {
            document.querySelectorAll('.player-card:not(.frozen)').forEach(card => {
                if (!card.querySelector('.player-card__btn--p.active')) {
                    affectedPlayers.push({ element: card });
                }
            });
        }
        saveAction({ type: 'game', players: affectedPlayers });

        if (pPlayers.length === 1 && bPlayers.length === 1) {
            // Direct transfer
            const pCard = pPlayers[0].closest('.player-card');
            const bCard = bPlayers[0].closest('.player-card');
            
            // Calculate points
            const gamePoints = Formula.calculateGamePoints(gameSettings.game, Formula.getActiveCount());
            const tablePenalty = Formula.calculateTablePenalty(gameSettings.table);
            
            // Update game points
            pCard.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent = 
                parseInt(pCard.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent) + gamePoints;
            bCard.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent = 
                parseInt(bCard.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent) - gamePoints;
            
            // Apply table penalty to winner
            pCard.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent = 
                parseInt(pCard.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent) + tablePenalty;
        } else if (pPlayers.length === 1 && bPlayers.length === 0) {
            // Single winner
            const pCard = pPlayers[0].closest('.player-card');
            const gamePoints = Formula.calculateGamePoints(gameSettings.game, Formula.getActiveCount());
            const tablePenalty = Formula.calculateTablePenalty(gameSettings.table);
            
            // Update winner
            pCard.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent = 
                parseInt(pCard.querySelector('.player-card__stat:nth-child(2) .stat-value').textContent) + gamePoints;
            pCard.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent = 
                parseInt(pCard.querySelector('.player-card__stat:nth-child(3) .stat-value').textContent) + tablePenalty;
            
            // Update other players
            document.querySelectorAll('.player-card:not(.frozen)').forEach(card => {
                if (!card.querySelector('.player-card__btn--p.active')) {
                    const gameValue = card.querySelector('.player-card__stat:nth-child(2) .stat-value');
                    gameValue.textContent = parseInt(gameValue.textContent) - gameSettings.game;
                }
            });
        }
        
        updateAllTotals();
    }

    // Update handlePenalty to save action
    function handlePenalty() {
        const pPlayers = document.querySelectorAll('.player-card:not(.frozen) .player-card__btn--p.active');
        
        if (pPlayers.length === 0) {
            showMessage(
                'alert',
                'No Player Selected',
                'Please select a player (P) before applying penalty.',
                ['OK']
            );
            return;
        }

        // Save state before making changes
        const affectedPlayers = [{ element: pPlayers[0].closest('.player-card') }];
        saveAction({ type: 'penalty', players: affectedPlayers });

        if (pPlayers.length === 1) {
            const pCard = pPlayers[0].closest('.player-card');
            const tablePenalty = Formula.calculateTablePenalty(gameSettings.table);
            
            // Apply table penalty
            const tableValue = pCard.querySelector('.player-card__stat:nth-child(3) .stat-value');
            tableValue.textContent = parseInt(tableValue.textContent) + tablePenalty;
            
            updateAllTotals();
        }
    }

    // Add event listeners for the buttons
    document.querySelector('.float-btn--game').addEventListener('click', handleGamePoints);
    document.querySelector('.float-btn--penalty').addEventListener('click', handlePenalty);

    // Add this function to handle player name editing
    function setupPlayerNameEditing(playerCard) {
        const nameSpan = playerCard.querySelector('.player-card__name');
        
        nameSpan.addEventListener('click', function() {
            // Create input element
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'player-card__name-input';
            input.value = this.textContent;
            input.style.cssText = `
                width: 100%;
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1.1rem;
                font-weight: bold;
            `;
            
            // Replace span with input
            this.replaceWith(input);
            input.focus();
            input.select();  // Select all text
            
            // Handle input blur and enter key
            function handleNameChange() {
                const newName = input.value.trim() || 'Player';
                const newSpan = document.createElement('span');
                newSpan.className = 'player-card__name';
                newSpan.textContent = newName;
                input.replaceWith(newSpan);
                
                // Re-attach click event
                setupPlayerNameEditing(playerCard);
            }
            
            input.addEventListener('blur', handleNameChange);
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNameChange();
                }
            });
        });
    }

    // Add event listener for undo button
    document.querySelector('.float-btn--undo').addEventListener('click', handleUndo);
});
