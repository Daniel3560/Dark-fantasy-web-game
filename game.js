// game.js

// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define the total width of your game world
const GAME_WORLD_WIDTH = 6000;
// Camera object to control what part of the world is visible on the canvas
let camera = { x: 0, y: 0 };

// --- Game State Management ---
// 'intro': Displays "Level 1 Dark Forest" message
// 'playing': Normal game operation
// 'shop': Displays the shop interface
// 'gameOver': Displays "Game Over" message
// 'levelComplete': Displays "Level Complete!" message
let gameState = 'intro'; // Initial game state
let currentLevel = 1; // Current game level

// --- Asset Loading: Load Player (Knight), Enemy (Skeleton), Background, Shadow Weaver Sprites ---
const knightImage = new Image();
knightImage.src = 'knight.png'; // Path to your knight image file

const skeletonImage = new Image();
skeletonImage.src = 'skeleton.png'; // Path to your skeleton image file

const backgroundImage = new Image(); // Background image object
backgroundImage.src = 'Background.png'; // Path to your background image file

const shadowWeaverImage = new Image(); // Shadow Weaver image object
shadowWeaverImage.src = 'shadow_weaver.png'; // Make sure this path is correct for your image

// NEW: Shop icon image
const cartImage = new Image();
cartImage.src = 'cart.png'; // Path to your cart image file

// --- Music Playlist Setup ---
const musicPlaylist = [
    'music1.mp3', // Your first music file
    'music2.mp3', // Your second music file
    'music3.mp3'  // Your third music file
];
let currentSongIndex = 0; // Index of the currently playing song in the playlist
let currentAudio = null; // Will hold the current Audio object
let musicStarted = false; // Flag to ensure music only starts after user interaction

// NEW: Sound effects
const playerPainSound = new Audio('player_pain.mp3'); // Sound for player taking damage
playerPainSound.volume = 0.7; // Adjust volume as needed

const skeletonHitSound = new Audio('skeleton_hit.mp3'); // Sound for skeleton being hit
skeletonHitSound.volume = 0.8; // Adjust volume as needed

const purchaseSound = new Audio('purchase_sound.mp3'); // Sound for purchasing items
purchaseSound.volume = 0.6; // Adjust volume as needed


// NEW: Asset loading status flags
let assetStatus = {
    knight: false,
    skeleton: false,
    background: false,
    shadowWeaver: false,
    cart: false,
    playerPain: false,
    skeletonHit: false,
    purchase: false
};

// NEW: Flag to ensure gameLoop is called only once initially
let gameLoopRunning = false;

// NEW: Function to update asset status and check if all are loaded
function updateAssetStatus(assetName, status) {
    assetStatus[assetName] = status;
    checkAllAssetsReady();
}

// NEW: Function to check if all assets are truly loaded
function checkAllAssetsReady() {
    const allReady = Object.values(assetStatus).every(status => status === true);
    if (allReady) {
        console.log("All assets loaded successfully. Game ready for intro.");
        // After assets load, the game state is 'intro'.
        // Set a timeout to transition from intro to playing automatically
        // This timeout will only run if no key is pressed to start earlier.
        setTimeout(() => {
            if (gameState === 'intro') { // Only transition if still in intro state
                gameState = 'playing';
                console.log("Transitioned to 'playing' state automatically after intro timeout.");
            }
        }, 3000); // Display intro message for 3 seconds
    }
}


// Event listener for when the knight image successfully loads
knightImage.onload = () => {
    console.log("knight.png loaded successfully!");
    updateAssetStatus('knight', true);
};

// Event listener for when the knight image fails to load
knightImage.onerror = () => {
    console.error("Failed to load knight.png! Check path and filename or if the image is corrupted.");
    updateAssetStatus('knight', false); // Mark as failed
};

// Event listener for when the skeleton image successfully loads
skeletonImage.onload = () => {
    console.log("skeleton.png loaded successfully!");
    updateAssetStatus('skeleton', true);
};

// Event listener for when the skeleton image fails to load
skeletonImage.onerror = () => {
    console.error("Failed to load skeleton.png! Check path and filename or if the image is corrupted.");
    updateAssetStatus('skeleton', false); // Mark as failed
};

// Event listener for when the background image successfully loads
backgroundImage.onload = () => {
    console.log("Background.png loaded successfully!");
    updateAssetStatus('background', true);
};

// Event listener for when the background image fails to load
backgroundImage.onerror = () => {
    console.error("Failed to load Background.png! Check path and filename or if the image is corrupted.");
    updateAssetStatus('background', false); // Mark as failed
};

// Event listener for when the Shadow Weaver image successfully loads
shadowWeaverImage.onload = () => {
    console.log("shadow_weaver.png loaded successfully!");
    updateAssetStatus('shadowWeaver', true);
};

// Event listener for when the Shadow Weaver image fails to load
shadowWeaverImage.onerror = () => {
    console.error("Failed to load shadow_weaver.png! Check path and filename or if the image is corrupted.");
    updateAssetStatus('shadowWeaver', false); // Mark as failed
};

// NEW: Event listener for cart image readiness
cartImage.onload = () => {
    console.log("cart.png loaded successfully!");
    updateAssetStatus('cart', true);
};
cartImage.onerror = () => {
    console.error("Failed to load cart.png!");
    updateAssetStatus('cart', false); // Mark as failed
};

// NEW: Event listener for player pain sound readiness
playerPainSound.oncanplaythrough = () => {
    console.log("Player pain sound ready!");
    updateAssetStatus('playerPain', true);
};
playerPainSound.onerror = () => {
    console.error("Failed to load player_pain.mp3!");
    updateAssetStatus('playerPain', false); // Mark as failed
};

// NEW: Event listener for skeleton hit sound readiness
skeletonHitSound.oncanplaythrough = () => {
    console.log("Skeleton hit sound ready!");
    updateAssetStatus('skeletonHit', true);
};
skeletonHitSound.onerror = () => {
    console.error("Failed to load skeleton_hit.mp3!");
    updateAssetStatus('skeletonHit', false); // Mark as failed
};

// NEW: Event listener for purchase sound readiness
purchaseSound.oncanplaythrough = () => {
    console.log("Purchase sound ready!");
    updateAssetStatus('purchase', true);
};
purchaseSound.onerror = () => {
    console.error("Failed to load purchase_sound.mp3!");
    updateAssetStatus('purchase', false); // Mark as failed
};
// -------------------------------------------------------------------------

// Game State Variables: Define the player's properties (now a Knight)
let player = {
    x: 100, // Initial X position in the game world
    y: 0, // Will be calculated dynamically in initializeGamePositions
    width: 40, // Knight's width for drawing and collision (adjust to your knight.png size)
    height: 60, // Knight's height for drawing and collision (adjust to your knight.png size)
    velX: 0, // Horizontal velocity
    velY: 0, // Vertical velocity (for jumping and gravity)
    speed: 4, // Knight's horizontal movement speed
    jumpForce: -9, // Upward force when jumping (negative because Y increases downwards)
    isJumping: true, // Flag to track if the player is currently jumping/in air
    health: 100, // Player's current health (max 100)
    maxHealth: 100, // NEW: Maximum health
    gold: 0, // Player's currency
    inventory: [], // Array to store collected items
    baseAttackDamage: 10, // NEW: Base attack damage
    attackDamage: 10, // NEW: Current effective attack damage
    attacking: false, // Flag to manage attack cooldown
    lastInventoryChangeTime: 0, // NEW: Timestamp of the last inventory change for fade-out
    inventoryFullMessageTime: 0 // NEW: Timestamp for "Inventory Full!" message fade-out
};

// Define the platforms in the game world
// Y positions are now conceptual offsets from the main ground (which will be at canvas.height / 2)
let platforms = [
    // Main ground platform spanning the entire world width. 'y' will be set to canvas.height / 2.
    { x: 0, y: 0, width: GAME_WORLD_WIDTH, height: 50, color: '#333', isMainGround: true },
    // Various floating platforms for player to jump on
    // yOffsetFromMainGround: positive means below main ground, negative means above main ground
    { x: 200, yOffsetFromMainGround: -100, width: 100, height: 20, color: '#555' },
    { x: 450, yOffsetFromMainGround: -200, width: 150, height: 20, color: '#555' },
    { x: 700, yOffsetFromMainGround: -100, width: 120, height: 20, color: '#555' },
    { x: 950, yOffsetFromMainGround: -50, width: 80, height: 20, color: '#555' },
    { x: 1200, yOffsetFromMainGround: -150, width: 200, height: 20, color: '#555' },
    { x: 1500, yOffsetFromMainGround: -100, width: 100, height: 20, color: '#555' },
    { x: 2000, yOffsetFromMainGround: -50, width: 150, height: 20, color: '#555' },
    { x: 2300, yOffsetFromMainGround: -150, width: 100, height: 20, color: '#555' },
    { x: 2600, yOffsetFromMainGround: -100, width: 200, height: 20, color: '#555' },
    { x: 3000, yOffsetFromMainGround: -50, width: 100, height: 20, color: '#555' },
    { x: 3500, yOffsetFromMainGround: -150, width: 150, height: 20, color: '#555' },
    { x: 4000, yOffsetFromMainGround: -100, width: 100, height: 20, color: '#555' },
    { x: 4500, yOffsetFromMainGround: -200, width: 180, height: 20, color: '#555' },
    { x: 5000, yOffsetFromMainGround: -50, width: 120, height: 20, color: '#555' },
    { x: 5500, yOffsetFromMainGround: -150, width: 100, height: 20, color: '#555' }
];

// Define the *initial blueprint* for all monsters in the game world
// This array will serve as the source of truth for resetting monsters.
const ALL_MONSTERS_DEFINITION = [
    // Common Skeleton types (attack damage now 15)
    { x: 300, yOffsetFromMainGround: 0, width: 50, height: 75, health: 20, type: 'Skeleton Warrior', loot: 'Bone Shard', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 100, startX: 300 },
    { x: 2100, yOffsetFromMainGround: 0, width: 55, height: 80, health: 20, type: 'Skeleton Guard', loot: 'Rusty Sword', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 120, startX: 2100 },
    { x: 2900, yOffsetFromMainGround: 0, width: 50, height: 75, health: 20, type: 'Armored Skeleton', loot: 'Broken Plate', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 90, startX: 2900 },
    { x: 4200, yOffsetFromMainGround: 0, width: 50, height: 75, health: 20, type: 'Skeleton Knight', loot: 'Knightly Helm', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 110, startX: 4200 },
    { x: 500, yOffsetFromMainGround: -150, width: 50, height: 75, health: 20, type: 'Risen Archer', loot: 'Rotten Arrow', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 80, startX: 500 },
    { x: 3600, yOffsetFromMainGround: -100, width: 50, height: 75, health: 20, type: 'Skeleton Archer', loot: 'Old Bow', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 100, startX: 3600 },
    { x: 4800, yOffsetFromMainGround: -50, width: 50, height: 75, health: 20, type: 'Skeleton Mage', loot: 'Dusty Tome', isSkeleton: true, color: '#C2B280', velX: 0.5, velY: 0, isJumping: true, jumpForce: -7, speed: 1.5, attackDamage: 15, attackCooldown: 1000, lastAttackTime: 0, patrolRange: 95, startX: 4800 },
    // Unique Level 1 Monsters (Shadow Weaver attack damage now 25)
    { x: 1300, yOffsetFromMainGround: -100, width: 50, height: 70, health: 40, type: 'Shadow Weaver', loot: 'Whispering Silk', isSkeleton: false, color: '#4B0082', image: shadowWeaverImage, velX: 0.7, velY: 0, isJumping: true, jumpForce: -8, speed: 2, attackDamage: 25, attackCooldown: 1500, lastAttackTime: 0 },
    { x: 2500, yOffsetFromMainGround: -50, width: 35, height: 55, health: 25, type: 'Ghastly Apparition', loot: 'Ectoplasm', isSkeleton: false, color: '#4B0082' }
];
// This will be the active array of monsters in the game, which can be modified.
let monsters = [];

// NEW: Helper to get max health for a monster type (used for health bars and resets)
function maxMonsterHealth(monsterType) {
    // Find the monster in the ALL_MONSTERS_DEFINITION and return its health
    const blueprint = ALL_MONSTERS_DEFINITION.find(m => m.type === monsterType);
    return blueprint ? blueprint.health : 20; // Default to 20 if not found
}

// NEW: Function to spawn monsters based on the current level
function spawnMonstersForLevel(level) {
    console.log(`Spawning monsters for level ${level}.`);
    monsters = []; // Clear current monsters before spawning new ones
    const mainGroundY = canvas.height / 2; // Get the current main ground Y position

    let monstersToSpawn = [];
    if (level === 1) {
        ALL_MONSTERS_DEFINITION.forEach(monsterDef => {
            // Create a deep copy to ensure each monster is independent
            let newMonster = JSON.parse(JSON.stringify(monsterDef));
            newMonster.health = maxMonsterHealth(newMonster.type); // Ensure health is reset
            monstersToSpawn.push(newMonster);
        });
    } else if (level === 2) {
        // Double the number of skeleton monsters for level 2
        ALL_MONSTERS_DEFINITION.forEach(monsterDef => {
            let newMonster = JSON.parse(JSON.stringify(monsterDef));
            newMonster.health = maxMonsterHealth(newMonster.type); // Reset health

            monstersToSpawn.push(newMonster); // Add original monster

            if (monsterDef.isSkeleton) {
                // For skeletons, create a duplicate at a slightly offset position
                let duplicateMonster = JSON.parse(JSON.stringify(monsterDef));
                duplicateMonster.x += 50; // Offset x to avoid exact overlap
                duplicateMonster.health = maxMonsterHealth(duplicateMonster.type); // Reset health
                monstersToSpawn.push(duplicateMonster);
            }
        });

        // Add new monster types specific to level 2 if you have them
        // Example (assuming you have Goblin and Ogre images and definitions):
        // monstersToSpawn.push({ x: 700, yOffsetFromMainGround: 0, width: 45, height: 65, type: 'Goblin', loot: 'Goblin Ear', isSkeleton: false, color: '#006400', velX: 0.6, velY: 0, isJumping: true, jumpForce: -7, speed: 1.8, attackDamage: 8, attackCooldown: 800, lastAttackTime: 0, patrolRange: 90, startX: 700 });
        // monstersToSpawn.push({ x: 1800, yOffsetFromMainGround: 0, width: 80, height: 100, type: 'Ogre', loot: 'Ogre Tooth', isSkeleton: false, color: '#8B4513', velX: 0.4, velY: 0, isJumping: true, jumpForce: -9, speed: 1.2, attackDamage: 20, attackCooldown: 2000, lastAttackTime: 0, patrolRange: 150, startX: 1800 });
    }

    // Now, apply Y positions and patrol boundaries to the monsters that will be spawned
    monstersToSpawn.forEach(monster => {
        if (monster.yOffsetFromMainGround === 0) {
            monster.y = mainGroundY - monster.height;
        } else {
            monster.y = mainGroundY + monster.yOffsetFromMainGround - monster.height;
        }
        // Also reset their dynamic properties that change during gameplay
        monster.velX = monster.type === 'Shadow Weaver' ? 0.7 : 0.5; // Reset velocity based on type
        monster.velY = 0;
        monster.isJumping = true;
        monster.lastAttackTime = 0;
        // Ensure health is reset to its initial value from the blueprint (already done above, but for clarity)
        const originalMonster = ALL_MONSTERS_DEFINITION.find(def => def.type === monster.type);
        if (originalMonster) {
            monster.health = originalMonster.health;
        }

        // Re-calculate patrol boundaries for monsters
        if (monster.isSkeleton || monster.type === 'Shadow Weaver') {
            let rawMinX = monster.startX - monster.patrolRange;
            let rawMaxX = monster.startX + monster.patrolRange;
            monster.minPatrolX = Math.max(0, rawMinX);
            monster.maxPatrolX = Math.min(GAME_WORLD_WIDTH - monster.width, rawMaxX);
        }
    });

    monsters = monstersToSpawn; // Assign the newly prepared monsters to the active game array
    console.log(`Monsters spawned. Current monster count: ${monsters.length}`);
}

// NEW: Shop Items Definition
const shopItems = [
    { name: 'Iron Armor', cost: 50, type: 'armor', healthIncrease: 25, description: '+25 Max HP' },
    { name: 'Steel Sword', cost: 75, type: 'sword', damageIncrease: 10, description: '+10 Attack Damage' },
    { name: 'Health Potion', cost: 20, type: 'potion', healthRestore: 30, description: '+30 Health' }
];

// NEW: Sell Prices for loot items
const sellPrices = {
    'Bone Shard': 2,
    'Rotten Arrow': 2,
    'Whispering Silk': 5,
    'Rusty Sword': 3,
    'Ectoplasm': 3,
    'Broken Plate': 2,
    'Old Bow': 3,
    'Knightly Helm': 5,
    'Dusty Tome': 5,
    'Goblin Ear': 7, // NEW: Sell price for Goblin Ear
    'Ogre Tooth': 10 // NEW: Sell price for Ogre Tooth
};

const MAX_INVENTORY_ITEMS = 4; // NEW: Maximum number of items in inventory


let keys = {}; // Object to keep track of currently pressed keys

// --- Event Listeners for Keyboard Input ---
// When a key is pressed down, set its corresponding flag in the 'keys' object to true
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Attempt to play music on the first key press, after all visual assets are loaded
    if (!musicStarted && Object.values(assetStatus).every(status => status === true)) { // Check all assets are ready
        playNextSong(); // Call the function to start playing music
        musicStarted = true; // Set flag to true to prevent multiple attempts
    }

    // Transition from intro to playing immediately on any key press
    if (gameState === 'intro') {
        gameState = 'playing';
        console.log("Transitioned to 'playing' state by keydown.");
    }
});
// When a key is released, set its corresponding flag in the 'keys' object to false
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

// NEW: Event listener for mouse click on the canvas for player attack and shop interaction
canvas.addEventListener('mousedown', (e) => {
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    if (e.button === 0) { // Left mouse button
        if (gameState === 'playing') {
            // Check for shop icon click
            const shopIconSize = 70; // Shop icon size
            // Adjusted shop icon position to bottom right
            const shopIconX = canvas.width - 10 - shopIconSize;
            const shopIconY = canvas.height - 10 - shopIconSize;


            if (mouseX > shopIconX && mouseX < shopIconX + shopIconSize &&
                mouseY > shopIconY && mouseY < shopIconY + shopIconSize) {
                gameState = 'shop'; // Enter shop state
                console.log("Entered shop state.");
                return; // Prevent attacking when clicking shop icon
            }

            // Player Attack Logic (only if not clicking shop icon)
            if (!player.attacking) {
                player.attacking = true; // Set attacking flag to true (start cooldown)

                monsters = monsters.filter(monster => {
                    // Check if the monster is within a reasonable range of the player for attack
                    const playerAttackRange = 70; // Player can attack enemies within this range
                    const monsterDistanceToPlayer = Math.sqrt(
                        Math.pow((monster.x + monster.width / 2) - (player.x + player.width / 2), 2) +
                        Math.pow((monster.y + monster.height / 2) - (player.y + player.height / 2), 2)
                    );

                    // Attack if within range, regardless of click position on canvas
                    if (monsterDistanceToPlayer < playerAttackRange) {
                        let damageToDeal = player.attackDamage; // Use player's current attack damage
                        if (monster.type.includes('Skeleton')) { // Check for any skeleton type
                            // Skeletons need 3 attacks for 20 health, so 20/3 damage per hit
                            damageToDeal = Math.max(damageToDeal, 20 / 3); // Ensure minimum damage for skeletons
                            // Play skeleton hit sound
                            skeletonHitSound.currentTime = 0; // Rewind to start
                            skeletonHitSound.play().catch(e => console.error("Error playing skeleton hit sound:", e));
                        } else if (monster.type === 'Shadow Weaver') {
                            // Shadow Weaver needs 8 attacks for 40 health, so 40/8 damage per hit
                            damageToDeal = Math.max(damageToDeal, 40 / 8); // Ensure minimum damage for Shadow Weaver
                            // You could add a specific Shadow Weaver hit sound here if you have one
                        }

                        monster.health -= damageToDeal;
                        console.log(`${monster.type} hit! Health: ${monster.health}`);

                        if (monster.health <= 0) {
                            player.gold += 10;
                            // NEW: Check inventory limit before adding loot
                            if (player.inventory.length < MAX_INVENTORY_ITEMS) {
                                player.inventory.push(monster.loot);
                                player.lastInventoryChangeTime = Date.now(); // Update time for inventory fade
                            } else {
                                console.log("Inventory is full! Cannot pick up more loot.");
                                player.inventoryFullMessageTime = Date.now(); // Activate "Inventory Full" message
                            }
                            return false; // Remove monster
                        }
                    }
                    return true; // Keep monster
                });
                setTimeout(() => { player.attacking = false; }, 300); // Attack cooldown
            }
        } else if (gameState === 'shop') {
            // Shop interaction logic
            const shopPanelWidth = 1000; // Increased width
            const shopPanelHeight = 1000; // Increased height
            const shopPanelX = canvas.width / 2 - shopPanelWidth / 2;
            const shopPanelY = canvas.height / 2 - shopPanelHeight / 2;

            // Close button area
            const closeButtonX = shopPanelX + shopPanelWidth - 60; // Adjusted for larger panel
            const closeButtonY = shopPanelY + 40; // Adjusted for larger panel
            const closeButtonSize = 20;

            // Check if X button is clicked
            if (mouseX > closeButtonX && mouseX < closeButtonX + closeButtonSize &&
                mouseY > closeButtonY && mouseY < closeButtonY + closeButtonSize) {
                gameState = 'playing'; // Close shop
                console.log("Closed shop.");
                return; // Exit shop click handling
            }

            // Shop item buy buttons and sell buttons will have their own click detection.
            // Draw shop items (for buying)
            for (let i = 0; i < shopItems.length; i++) {
                const item = shopItems[i];
                const itemY = shopPanelY + 200 + (i * 70); // Adjusted for larger panel
                const buyButtonX = shopPanelX + shopPanelWidth - 130; // Adjusted for larger panel
                const buyButtonY = itemY - 15;
                const buyButtonWidth = 80;
                const buyButtonHeight = 30;

                // Check for Buy button click
                if (mouseX > buyButtonX && mouseX < buyButtonX + buyButtonWidth &&
                    mouseY > buyButtonY && mouseY < buyButtonY + buyButtonHeight) {
                    if (player.gold >= item.cost) {
                        player.gold -= item.cost;
                        purchaseSound.currentTime = 0; // Rewind to start
                        purchaseSound.play().catch(e => console.error("Error playing purchase sound:", e));

                        // Apply item effects
                        if (item.type === 'armor') {
                            player.maxHealth += item.healthIncrease;
                            player.health = Math.min(player.health + item.healthIncrease, player.maxHealth); // Heal by amount, but not over new max
                        } else if (item.type === 'sword') {
                            player.attackDamage += item.damageIncrease;
                        } else if (item.type === 'potion') {
                            player.health = Math.min(player.health + item.healthRestore, player.maxHealth);
                        }
                        console.log(`Purchased ${item.name}! Gold: ${player.gold}`);
                    } else {
                        console.log(`Not enough gold to buy ${item.name}`);
                    }
                    return; // Exit shop click handling after a purchase attempt
                }
            }

            // Draw player inventory (for selling)
            const inventoryStartY = shopPanelY + 500; // Adjusted for larger panel
            for (let i = 0; i < player.inventory.length; i++) {
                const item = player.inventory[i];
                const itemY = inventoryStartY + 20 + (i * 30); // Smaller spacing for inventory items
                const sellPrice = sellPrices[item] || 1; // Get sell price, default to 1

                const sellButtonX = shopPanelX + shopPanelWidth - 130; // Adjusted for larger panel
                const sellButtonY = itemY - 20; // Adjusted to align with text
                const sellButtonWidth = 80;
                const sellButtonHeight = 25;

                // Check for Sell button click
                if (mouseX > sellButtonX && mouseX < sellButtonX + sellButtonWidth &&
                    mouseY > sellButtonY && mouseY < sellButtonY + sellButtonHeight) {
                    player.gold += sellPrice;
                    player.inventory.splice(i, 1); // Remove item from inventory
                    player.lastInventoryChangeTime = Date.now(); // Update time for inventory fade
                    purchaseSound.currentTime = 0; // Play purchase sound for selling too
                    purchaseSound.play().catch(e => console.error("Error playing purchase sound:", e));
                    console.log(`Sold ${item}! Gold: ${player.gold}`);
                    return; // Exit shop click handling after a sale
                }
            }
        }
    }
});


// --- Music Playback Control Function ---
function playNextSong() {
    // If there's a current audio object, stop it before playing the next
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0; // Reset to beginning
    }

    // Get the path for the next song in the playlist
    const songPath = musicPlaylist[currentSongIndex];
    currentAudio = new Audio(songPath); // Create a new Audio object for the song
    currentAudio.volume = 0.5; // Set volume

    // When the current song ends, advance to the next song in the playlist
    currentAudio.onended = () => {
        currentSongIndex++; // Move to the next song
        if (currentSongIndex >= musicPlaylist.length) {
            currentSongIndex = 0; // Loop back to the beginning of the playlist
        }
        playNextSong(); // Play the next song
    };

    // Attempt to play the song
    currentAudio.play().then(() => {
        console.log(`Now playing: ${songPath}`);
    }).catch(error => {
        console.error(`Failed to play ${songPath}:`, error);
        // If autoplay fails, try to play the next song immediately
        currentAudio.onended(); // This will trigger the next song in the playlist
    });
}

// --- Main Game Loop ---
// This function is called repeatedly to update game logic and redraw the screen
function gameLoop() {
    // Always draw, regardless of game state, to ensure something is on screen.
    draw();

    // Only update game logic if in 'playing' state
    if (gameState === 'playing') {
        update(); // Update game state (player position, collisions, etc.)
    }
   
    // Request the browser to call gameLoop again before the next repaint
    requestAnimationFrame(gameLoop);
}

// --- Update Game Logic ---
// This function handles all game state changes per frame
function update() {
    // Player horizontal movement based on 'ArrowLeft'/'A' and 'ArrowRight'/'D' keys
    player.velX = 0; // Reset horizontal velocity each frame
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velX = -player.speed; // Move left
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.velX = player.speed; // Move right
    }
    player.x += player.velX; // Apply horizontal velocity to player's X position

    // Boundary checks for player within the game world
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > GAME_WORLD_WIDTH) {
        player.x = GAME_WORLD_WIDTH - player.width;
    }

    // Player vertical movement (gravity & jump)
    // If 'Space' is pressed and player is not currently jumping
    if (keys['Space'] && !player.isJumping) {
        player.velY = player.jumpForce; // Apply upward jump force
        player.isJumping = true; // Set jumping flag
    }
    player.velY += 0.2; // Apply gravity (constant downward acceleration)
    player.y += player.velY; // Apply vertical velocity to player's Y position

    // Basic Player-Platform Collision Detection (top surface only)
    player.isJumping = true; // Assume jumping until collision
    platforms.forEach(platform => {
        // Simple AABB collision detection (Axis-Aligned Bounding Box)
        if (
            player.x < platform.x + platform.width && // Player's left is less than platform's right
            player.x + player.width > platform.x && // Player's right is greater than platform's left
            player.y + player.height > platform.y && // Player's bottom is greater than platform's top
            player.y < platform.y + platform.height && // Player's top is less than platform's bottom
            player.velY >= 0 // Only consider collision if player is moving downwards (falling)
        ) {
            // If collision detected and player is falling, land on the platform
            player.y = platform.y - player.height; // Snap player to the top of the platform
            player.velY = 0; // Stop vertical movement
            player.isJumping = false; // Player is no longer jumping
        }
    });

    // Keep player within canvas vertical boundaries (prevents falling off screen bottom)
    // This is crucial for preventing monsters from falling through the bottom of the canvas
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.isJumping = false;
        player.velY = 0;
        // In a full game, you'd add logic here for player death or respawn if they fall into a pit
    }

    // Camera follow player: Center the camera on the player's X position
    // The camera should not move past the world boundaries.
    camera.x = Math.max(0, Math.min(player.x - canvas.width / 2 + player.width / 2, GAME_WORLD_WIDTH - canvas.width));

    // Check for player death
    if (player.health <= 0) {
        gameState = 'gameOver';
        console.log("Game Over!");
        // Reset player state after a delay and transition back to playing
        setTimeout(() => {
            player.health = player.maxHealth; // Reset health to max health
            player.gold = 0; // Reset gold
            player.inventory = []; // Clear inventory
            player.attackDamage = player.baseAttackDamage; // Reset attack damage
            player.x = 100; // Reset player position
            // Recalculate player and monster positions on reset
            initializeGamePositions();
            gameState = 'playing'; // Transition back to playing
        }, 3000); // Display "Game Over" for 3 seconds before restarting
        return; // Stop further updates this frame
    }

    // Monster movement and physics
    monsters.forEach(monster => {
        // Apply gravity to all monsters that have vertical movement properties
        if (monster.velY !== undefined) { // Check if monster has vertical movement properties
            monster.velY += 0.2;
            monster.y += monster.velY;
        }

        // Monster collision with platforms (similar to player)
        if (monster.isJumping !== undefined) { // Only apply if monster can jump/is affected by ground
            monster.isJumping = true; // Assume jumping until collision
            platforms.forEach(platform => {
                if (
                    monster.x < platform.x + platform.width && // Monster's left is less than platform's right
                    monster.x + monster.width > platform.x && // Monster's right is greater than platform's left
                    monster.y + monster.height > platform.y && // Monster's bottom is greater than platform's top
                    monster.y < platform.y + platform.height && // Monster's top is less than platform's bottom
                    monster.velY >= 0 // Only consider collision if monster is moving downwards (falling)
                ) {
                    monster.y = platform.y - monster.height; // Snap monster to top of platform
                    monster.velY = 0;
                    monster.isJumping = false;
                }
            });

            // Keep monster within canvas vertical boundaries (prevents falling off screen bottom)
            // This is the fix for monsters getting stuck at the bottom
            if (monster.y + monster.height > canvas.height) {
                monster.y = canvas.height - monster.height;
                monster.isJumping = false;
                monster.velY = 0;
            }
        }

        // Apply chasing/patrol/jumping logic only to monsters that are supposed to move and attack
        if (monster.speed !== undefined && monster.attackDamage !== undefined) { // Check if monster has AI properties
            const detectionRange = 250; // How close player needs to be to be detected
            const attackRange = 40; // How close player needs to be for monster to attack
            const distanceToPlayer = Math.sqrt(
                Math.pow((player.x + player.width / 2) - (monster.x + monster.width / 2), 2) +
                Math.pow((player.y + player.height / 2) - (monster.y + player.height / 2), 2)
            );

            // Determine monster's horizontal movement based on chasing or patrolling
            if (distanceToPlayer < detectionRange) {
                // Player detected, chase them
                if (player.x < monster.x) {
                    monster.velX = -monster.speed; // Move left towards player
                } else if (player.x > monster.x) {
                    monster.velX = monster.speed; // Move right towards player
                } else {
                    monster.velX = 0; // Stop if directly above/below
                }

                // Simplified jumping AI for chasing monsters: jump if player is significantly above or if stuck
                if (!monster.isJumping && monster.jumpForce !== undefined) {
                    // Check if player is on a higher platform that requires a jump
                    const playerIsHigher = player.y < monster.y - monster.height / 2; // Player is at least half monster height above
                    // Check if the monster is currently stuck against a wall or edge (simple check: if not moving much)
                    const isStuck = Math.abs(monster.velX) < monster.speed * 0.1 && (
                        (player.x < monster.x && monster.velX < 0) || // Trying to move left but not gaining ground
                        (player.x > monster.x && monster.velX > 0)    // Trying to move right but not gaining ground
                    );

                    if (playerIsHigher || isStuck) {
                        monster.velY = monster.jumpForce;
                        monster.isJumping = true;
                    }
                }

                // Attacking Logic
                if (distanceToPlayer < attackRange) {
                    const currentTime = Date.now();
                    if (currentTime - monster.lastAttackTime > monster.attackCooldown) {
                        player.health -= monster.attackDamage;
                        monster.lastAttackTime = currentTime;
                        console.log(`Player hit by ${monster.type}! Health: ${player.health}`);
                        // Play player pain sound
                        playerPainSound.currentTime = 0; // Rewind to start
                        playerPainSound.play().catch(e => console.error("Error playing player pain sound:", e));
                        if (player.health <= 0) {
                            // This will be handled by the outer player.health check
                            // No need to set gameState here, it's already set by player death logic
                        }
                    }
                }

            } else {
                // Player not detected, revert to patrol logic
                // Patrol logic: turn around if hitting min/max patrol X (clamped by world boundaries)
                if (monster.velX > 0 && monster.x + monster.width > monster.maxPatrolX) {
                     monster.velX *= -1; // Reverse direction
                     monster.x = monster.maxPatrolX - monster.width; // Snap to the right boundary
                } else if (monster.velX < 0 && monster.x < monster.minPatrolX) {
                     monster.velX *= -1; // Reverse direction
                     monster.x = monster.minPatrolX; // Snap to the left boundary
                }
                // Simple random jump for patrolling monsters
                if (!monster.isJumping && Math.random() < 0.005) {
                    monster.velY = monster.jumpForce;
                    monster.isJumping = true;
                }
            }
            // Apply horizontal movement after determining velX
            monster.x += monster.velX;
        }
    });

    // NEW: Check for monster respawn if all monsters are defeated
    if (monsters.length === 0 && gameState === 'playing') {
        console.log("All monsters defeated! Triggering respawn for current level.");
        spawnMonstersForLevel(currentLevel);
    }
}

// Function to draw all monsters
function drawMonsters() {
    monsters.forEach(monster => {
        // Calculate monster's position relative to the camera
        const monsterXOnCanvas = monster.x - camera.x;
        // Use the monster's pre-calculated world Y position, adjusted by camera's Y (which is 0 for now)
        const monsterYOnCanvas = monster.y - camera.y;

        // Only draw if monster is within canvas bounds
        if (monsterXOnCanvas + monster.width > 0 &&
            monsterXOnCanvas < canvas.width &&
            monsterYOnCanvas + monster.height > 0 &&
            monsterYOnCanvas < canvas.height) {

            // Choose the correct image based on monster type
            let monsterImage = null;
            if (monster.isSkeleton) {
                monsterImage = skeletonImage;
            } else if (monster.type === 'Shadow Weaver') {
                monsterImage = shadowWeaverImage;
            }
            // You can add more conditions here for other monster types if they have unique images

            if (monsterImage && monsterImage.complete) { // Check if image is loaded before drawing
                // Adjust Y position for image alignment if needed (based on how the image sprite is designed)
                // Assuming monster.height is the collision box height, and image might be taller.
                const aspectRatio = monsterImage.naturalWidth / monsterImage.naturalHeight;
                const drawHeight = monster.width / aspectRatio;
                const drawYOffset = drawHeight - monster.height; // How much taller the image is than the collision box

                ctx.drawImage(monsterImage, monsterXOnCanvas, monsterYOnCanvas - drawYOffset, monster.width, drawHeight);

            } else {
                // Fallback to drawing a colored rectangle if image is not specified or not loaded
                ctx.fillStyle = monster.color || 'red'; // Default to red if no color
                ctx.fillRect(monsterXOnCanvas, monsterYOnCanvas, monster.width, monster.height);
            }

            // Draw health bar for the monster
            // Check if monster health is defined and greater than 0
            if (typeof monster.health !== 'undefined' && monster.health > 0) {
                const healthBarX = monsterXOnCanvas;
                const healthBarY = monsterYOnCanvas - 10; // Position above the monster

                ctx.fillStyle = '#8B0000'; // Dark red for background of health bar (empty health)
                ctx.fillRect(healthBarX, healthBarY, monster.width, 5);

                ctx.fillStyle = 'red'; // Red for current health
                const healthBarWidth = (monster.health / maxMonsterHealth(monster.type)) * monster.width;
                ctx.fillRect(healthBarX, healthBarY, healthBarWidth, 5);
            }
        }
    });
}

// NEW: Function to initialize/reset game element positions based on canvas size
function initializeGamePositions() {
    // Reset player position and health
    player.x = 100;
    player.health = player.maxHealth; // Restore player to full health

    const mainGroundY = canvas.height / 2; // Midway point for the main ground platform

    // Set player's initial Y
    player.y = mainGroundY - player.height;

    // Set platform Y positions
    platforms.forEach(platform => {
        if (platform.isMainGround) {
            platform.y = mainGroundY;
        } else {
            platform.y = mainGroundY + platform.yOffsetFromMainGround;
        }
    });

    // Spawn monsters for the current level (this function now handles all monster positioning)
    spawnMonstersForLevel(currentLevel);
}


// --- Draw Everything ---
// This function draws all game elements onto the canvas
function draw() {
    console.log("draw() called. Current gameState:", gameState); // Log every draw call
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas each frame

    // Draw the background image first, with parallax
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        console.log("Background image is complete and drawing.");
        // Calculate background scroll position (slower than camera)
        // The % operator creates a repeating effect for the background
        const bgScrollX = (camera.x * 0.3) % backgroundImage.naturalWidth; // 0.3 is parallax factor, % for tiling
        const bgDrawWidth = backgroundImage.naturalWidth;
        const bgDrawHeight = backgroundImage.naturalHeight;

        // Draw multiple copies of the background image to fill the screen as it scrolls
        // This creates a seamless repeating background illusion, drawing from left to right
        for (let i = 0; i < Math.ceil(canvas.width / bgDrawWidth) + 1; i++) {
            ctx.drawImage(backgroundImage, -bgScrollX + i * bgDrawWidth, 0, bgDrawWidth, canvas.height); // Draw to canvas.height
        }
        // Also draw a copy to the left if scrolling left, to ensure seamless repetition
        if (bgScrollX > 0) {
             ctx.drawImage(backgroundImage, -bgScrollX - bgDrawWidth, 0, bgDrawWidth, canvas.height);
        }

    } else {
        console.warn("Background image not loaded or has zero natural width. Drawing fallback color.");
        // Fallback: Draw a dark, solid color for the furthest background if image not loaded
        ctx.fillStyle = '#0a0515';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Only draw game elements (platforms, player, monsters, UI) if not in intro/game over/shop state
    // Or, if in 'playing' state, draw them normally.
    // If in 'intro' or 'gameOver' or 'shop', the full screen overlay will cover them.
    if (gameState === 'playing') {
        // Draw platforms: Their X position is adjusted by the camera's X to create the scrolling effect
        platforms.forEach(platform => {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x - camera.x, platform.y - camera.y, platform.width, platform.height);
        });

        // Draw player (Knight): The player's X position is also adjusted by the camera's X
        // This makes the player appear to stay relatively centered on screen while the world moves
        if (knightImage.complete && knightImage.naturalWidth > 0) {
            const aspectRatio = knightImage.naturalWidth / knightImage.naturalHeight;
            const drawHeight = player.width / aspectRatio;
            const knightDrawY = player.y - camera.y - (drawHeight - player.height); // Adjust Y for image alignment
            ctx.drawImage(knightImage, player.x - camera.x, knightDrawY, player.width, drawHeight);
        } else {
            // Fallback: draw a colored rectangle if knight image fails to load
            ctx.fillStyle = 'blue'; // Distinct color for debugging
            ctx.fillRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
            console.warn("Knight image not loaded. Drawing fallback rectangle.");
        }

        // NEW: Call the dedicated function to draw monsters
        drawMonsters();

        // --- Draw UI elements (fixed on screen, do NOT scroll with camera) ---
        // Player Health Bar at the top of the screen
        ctx.fillStyle = 'red'; // Color for the filled part of the health bar
        ctx.fillRect(10, 10, player.health, 15); // X:10, Y:10, Width: player.health, Height: 15
        ctx.strokeStyle = '#333'; // Border color for health bar
        ctx.strokeRect(10, 10, player.maxHealth, 15); // Border for health bar (max health)
        ctx.fillStyle = '#ddd'; // Text color
        ctx.font = '14px monospace';
        ctx.fillText('HP', player.maxHealth + 15, 22); // Label for health bar

        // Gold display
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.font = '16px monospace';
        ctx.fillText(`Gold: ${player.gold}`, 10, 40);

        // Inventory display with fade-out
        const displayDuration = 3000; // 3 seconds visible
        const fadeDuration = 1000; // 1 second fade
        const timeSinceLastInventoryChange = Date.now() - player.lastInventoryChangeTime;

        let inventoryOpacity = 1;
        if (timeSinceLastInventoryChange > displayDuration) {
            const fadeProgress = (timeSinceLastInventoryChange - displayDuration) / fadeDuration;
            inventoryOpacity = Math.max(0, 1 - fadeProgress); // Fade from 1 to 0
        }

        ctx.globalAlpha = inventoryOpacity; // Apply opacity for inventory text
        ctx.fillStyle = '#ddd'; // Light grey for text
        ctx.font = '14px monospace'; // Reduced font size for inventory
        ctx.fillText('Inventory:', 10, 60);
        player.inventory.forEach((item, index) => {
            ctx.fillText(`- ${item}`, 20, 80 + (index * 16)); // Reduced line spacing
        });
        ctx.globalAlpha = 1; // Reset opacity for other elements

        // "Inventory Full!" message with fade-out
        const messageDisplayDuration = 2000; // 2 seconds visible
        const messageFadeDuration = 1000; // 1 second fade
        const timeSinceInventoryFull = Date.now() - player.inventoryFullMessageTime;

        let messageOpacity = 0;
        if (player.inventoryFullMessageTime > 0 && timeSinceInventoryFull < messageDisplayDuration + messageFadeDuration) {
            if (timeSinceInventoryFull < messageDisplayDuration) {
                messageOpacity = 1; // Fully visible
            } else {
                const fadeProgress = (timeSinceInventoryFull - messageDisplayDuration) / messageFadeDuration;
                messageOpacity = Math.max(0, 1 - fadeProgress); // Fade out
            }
        }
        
        if (messageOpacity > 0) {
            ctx.globalAlpha = messageOpacity;
            ctx.fillStyle = 'red';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Inventory Full!', canvas.width / 2, canvas.height / 2 - 100);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }


        // NEW: Draw Shop Icon (text removed, size increased)
        const shopIconSize = 70; // Increased size
        const shopIconX = canvas.width - shopIconSize - 15; // 15px padding from right
        const shopIconY = canvas.height - shopIconSize - 15; // 15px padding from bottom

        console.log(`Attempting to draw shop icon. cartImage.complete: ${cartImage.complete}, cartImage.naturalWidth: ${cartImage.naturalWidth}`);
        if (cartImage.complete && cartImage.naturalWidth > 0) {
            ctx.drawImage(cartImage, shopIconX, shopIconY, shopIconSize, shopIconSize);
            console.log("Shop icon drawn successfully.");
        } else {
            console.warn("Shop icon image not loaded or has zero natural width. Drawing fallback purple rectangle.");
            // Fallback: draw a placeholder rectangle if image not loaded
            ctx.fillStyle = 'purple'; // Distinct color for debugging
            ctx.fillRect(shopIconX, shopIconY, shopIconSize, shopIconSize);
            ctx.fillStyle = 'white';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('?', shopIconX + shopIconSize / 2, shopIconY + shopIconSize / 2 + 4);
            ctx.textAlign = 'left';
        }
    }
    // -------------------------------------------------------------------

    // --- Draw Game State Messages (these draw over everything else) ---
    if (gameState === 'intro') {
        console.log("Drawing intro screen.");
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Level 1: Dark Forest', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px monospace';
        ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left'; // Reset text alignment
    } else if (gameState === 'gameOver') {
        console.log("Drawing game over screen.");
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px monospace';
        ctx.fillText('Restarting...', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left'; // Reset text alignment
    } else if (gameState === 'shop') {
        console.log("Drawing shop UI.");
        // NEW: Draw Shop UI
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Darker semi-transparent background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shop panel - INCREASED SIZE
        const shopPanelWidth = 1000;
        const shopPanelHeight = 1000;
        const shopPanelX = canvas.width / 2 - shopPanelWidth / 2;
        const shopPanelY = canvas.height / 2 - shopPanelHeight / 2;
        ctx.fillStyle = '#222'; // Shop panel background
        ctx.fillRect(shopPanelX, shopPanelY, shopPanelWidth, shopPanelHeight);
        ctx.strokeStyle = '#FFD700'; // Gold border
        ctx.lineWidth = 3;
        ctx.strokeRect(shopPanelX, shopPanelY, shopPanelWidth, shopPanelHeight);

        ctx.fillStyle = 'white';
        ctx.font = '32px monospace'; // Slightly larger font for title
        ctx.textAlign = 'center';
        ctx.fillText('Shop', canvas.width / 2, shopPanelY + 70); // Adjusted Y for larger panel
        ctx.textAlign = 'left'; // Reset alignment

        // Close button
        const closeButtonX = shopPanelX + shopPanelWidth - 60; // Adjusted for larger panel
        const closeButtonY = shopPanelY + 40; // Adjusted for larger panel
        const closeButtonSize = 20;
        ctx.fillStyle = 'red';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = 'white';
        ctx.font = '18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('X', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 7);
        ctx.textAlign = 'left'; // Reset text alignment

        // Player Gold display in shop
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px monospace'; // Slightly larger font
        ctx.fillText(`Your Gold: ${player.gold}`, shopPanelX + 50, shopPanelY + 120); // Adjusted for larger panel

        // Draw shop items (for buying)
        ctx.font = '18px monospace'; // Slightly larger font
        ctx.fillStyle = '#ddd';
        ctx.fillText('Items for Sale:', shopPanelX + 50, shopPanelY + 170); // Adjusted for larger panel
        for (let i = 0; i < shopItems.length; i++) {
            const item = shopItems[i];
            const itemY = shopPanelY + 200 + (i * 70); // Adjusted for larger panel

            ctx.fillStyle = '#ddd';
            ctx.fillText(`${item.name} (${item.description})`, shopPanelX + 50, itemY);
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Cost: ${item.cost} Gold`, shopPanelX + 50, itemY + 20);

            // Buy button
            const buyButtonX = shopPanelX + shopPanelWidth - 130; // Adjusted for larger panel
            const buyButtonY = itemY - 15;
            const buyButtonWidth = 80;
            const buyButtonHeight = 30;

            ctx.fillStyle = player.gold >= item.cost ? '#008000' : '#444'; // Green if affordable, grey if not
            ctx.fillRect(buyButtonX, buyButtonY, buyButtonWidth, buyButtonHeight);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Buy', buyButtonX + buyButtonWidth / 2, buyButtonY + buyButtonHeight / 2 + 5);
            ctx.textAlign = 'left'; // Reset text alignment
        }

        // Draw player inventory (for selling)
        const inventoryStartY = shopPanelY + 500; // Adjusted for larger panel to be lower
        ctx.fillStyle = '#ddd';
        ctx.fillText('Your Inventory:', shopPanelX + 50, inventoryStartY);
        ctx.font = '16px monospace'; // Slightly smaller font for inventory items for more fit

        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            const itemY = inventoryStartY + 30 + (i * 30); // Adjusted for larger panel and spacing
            const sellPrice = sellPrices[item] || 1; // Get sell price, default to 1

            ctx.fillStyle = '#ddd';
            ctx.fillText(`${item}`, shopPanelX + 50, itemY);
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Sell: ${sellPrice} Gold`, shopPanelX + 200, itemY); // Adjusted X for sell price text

            // Sell button
            const sellButtonX = shopPanelX + shopPanelWidth - 130; // Adjusted for larger panel
            const sellButtonY = itemY - 20; // Adjusted to align with text
            const sellButtonWidth = 80;
            const sellButtonHeight = 25;

            ctx.fillStyle = '#8B0000'; // Dark red for sell button
            ctx.fillRect(sellButtonX, sellButtonY, sellButtonWidth, sellButtonHeight);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Sell', sellButtonX + sellButtonWidth / 2, sellButtonY + sellButtonHeight / 2 + 5);
            ctx.textAlign = 'left'; // Reset text alignment
        }
    }
}

// Initial call to start the game loop once the window is loaded
window.onload = () => {
    // Set initial canvas size to fill the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize game element positions based on the current canvas size
    initializeGamePositions();

    // Start the game loop
    if (!gameLoopRunning) {
        gameLoop();
        gameLoopRunning = true;
    }
   
    // Add a resize listener to make the canvas responsive
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-initialize positions on resize to adapt to new canvas dimensions
        initializeGamePositions();
        // Redraw everything to adjust to new size
        draw();
    });
};
