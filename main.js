// Import the required Three.js components
import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Setting up the scene, camera, and renderer
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
loader.load('scene_background.jpg', function(texture) {
    scene.background = texture;
});
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
//scene.background = new THREE.Color(0x87CEEB); // Sky blue color



// Initialize Timer element
const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '10px';
timerElement.style.left = '10px';
timerElement.style.fontSize = '30px';
timerElement.style.color = '#000';
timerElement.style.backgroundColor = '#fff';
timerElement.style.padding = '10px';
timerElement.style.borderRadius = '5px';
timerElement.style.border = '10px solid #f0a0a0'; 
timerElement.style.fontFamily = "'Brush Script MT', cursive, sans-serif"; // Cursive-like font



document.body.appendChild(timerElement);

// Initialize Points element
const pointsElement = document.createElement('div');
pointsElement.style.position = 'absolute';
pointsElement.style.top = '10px';
pointsElement.style.right = '10px';
pointsElement.style.fontSize = '30px';
pointsElement.style.color = '#000';
pointsElement.style.backgroundColor = '#fff';
pointsElement.style.padding = '10px';
pointsElement.style.borderRadius = '5px';
pointsElement.style.border = '10px solid #f0a0a0';
pointsElement.style.fontFamily = "'Brush Script MT', cursive, sans-serif"; // Cursive-like font


document.body.appendChild(pointsElement);

let points = 0;
let initialCountdown = 10;
let countdownStarted = false;
let timerStart = null;
let consecutiveMatches = 0;
let kittenTail = null;
let kittenPaw = null;
let currentTurn = 0; // 当前游戏回合数
let isFishingRodActive = false; // 是否有小鱼竿处于活动状态


// Create Start Game button
const startButton = document.createElement('button');
startButton.innerText = 'Start Game';
startButton.style.position = 'absolute';
startButton.style.top = '50%';
startButton.style.left = '50%';
startButton.style.transform = 'translate(-50%, -50%)';
startButton.style.padding = '20px';
startButton.style.fontSize = '24px';
startButton.style.cursor = 'pointer';
document.body.appendChild(startButton);

// Set random seed
function setRandomSeed(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}
let seed = 12345;
function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

// Adjust the camera position
camera.position.z = 50;

// Add OrbitControls for camera rotation
const controls = new OrbitControls(camera, renderer.domElement);

const thirtyDegreesInRadians = THREE.MathUtils.degToRad(30);
controls.minPolarAngle = Math.PI / 2 - thirtyDegreesInRadians;
controls.maxPolarAngle = Math.PI / 2 + thirtyDegreesInRadians;

controls.minAzimuthAngle = -thirtyDegreesInRadians;
controls.maxAzimuthAngle = thirtyDegreesInRadians;

controls.enableZoom = true;

controls.minDistance = 30; // Set minimum zoom distance
controls.maxDistance = 100; // Set maximum zoom distance

controls.update();


// Create a board of cards (5x5 grid)
const rows = 5;
const cols = 5;
const cardWidth = 8;
const cardHeight = 8;
const cardDepth = 1.5;
const gap = 1;

//Card colors
const colors = [0xFF0000, 0x0000FF, 0xFFA500, 0x008000];

// Generate combinations of color and number
const colorNumberPairs = [];
for (let color of colors) {
    for (let number = 1; number <= 3; number++) {
        colorNumberPairs.push({ color,number }, { color,number }); // Each combination appears twice
} 
}

// Shuffle the color-number pairs array
for (let i = colorNumberPairs.length - 1; i > 0; i--) {
     const j = Math.floor(random() * (i + 1));
    [colorNumberPairs[i], colorNumberPairs[j]] = [colorNumberPairs[j], colorNumberPairs[i]];
 }

let numberIndex = 0;
const cards = [];
let selectedCards = [];
let allCardsFacedDown = false;
let timerStarted = false;

// Card class definition
class Card {
    constructor(color, number, positionX, positionY) {
        this.number = number;
        this.color = color;
        this.positionX = positionX;
        this.positionY = positionY;
        this.isFaceUp = true;
        this.rotationSpeed = 0.05; // Control the speed of rotation
        this.createCard();
        this.locked = false; // Indicates if the card is locked for one round
        this.attachedObject = null; // Track any object (like the fish) attached to the card
    }

    createCard() {
        // Create the card geometry
        const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);

        // Create materials for each face of the card
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '60px "Comic Sans MS", cursive';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.number, canvas.width / 2, canvas.height / 2);

        const frontTexture = new THREE.CanvasTexture(canvas);
        const frontMaterial = new THREE.MeshBasicMaterial({color: this.color, map: frontTexture });
        const backMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        const sideMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // Create an array of materials for each face of the box
        const materials = [
            sideMaterial, // right side
            sideMaterial, // left side
            sideMaterial, // top side
            sideMaterial, // bottom side
            frontMaterial, // front side
            backMaterial // back side
        ];

        this.cardMesh = new THREE.Mesh(cardGeometry, materials);

        // Set card position
        this.cardMesh.position.set(this.positionX, this.positionY, 0);

        // Add the card to the scene
        scene.add(this.cardMesh);

        // Save reference to the card
        cards.push(this);
    }

    startTimer() {
        // Show the card face up for 10 seconds, then rotate it to face down
        setTimeout(() => {
            this.startRotation();
        }, 10000);
    }

    startRotation() {
        const rotateInterval = setInterval(() => {
            if (this.cardMesh.rotation.y < Math.PI) {
                this.cardMesh.rotation.y += this.rotationSpeed;
            } else {
                this.cardMesh.rotation.y = Math.PI;
                this.isFaceUp = false;
                clearInterval(rotateInterval);

                // Start the timer after all cards have faced down
                if (!allCardsFacedDown) {
                    allCardsFacedDown = cards.every(card => !card.isFaceUp);
                    if (allCardsFacedDown && !timerStarted) {
                        timerStarted = true;
                        timerStart = Date.now();
                    }
                }
            }
        }, 16); // Approximately 60 frames per second
    }

    flipUp() {
        const rotateInterval = setInterval(() => {
            if (this.cardMesh.rotation.y > 0) {
                this.cardMesh.rotation.y -= this.rotationSpeed;
    
                // Rotate the attached object (e.g., fish) along with the card
                if (this.attachedObject) {
                    this.attachedObject.rotation.y -= this.rotationSpeed;
    
                    // Maintain a fixed distance from the card
                    const offset = new THREE.Vector3(0, 0, -5); // Adjust the offset as needed
                    this.attachedObject.position.copy(this.cardMesh.position).add(offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cardMesh.rotation.y));
                }
            } else {
                this.cardMesh.rotation.y = 0;
                if (this.attachedObject) this.attachedObject.rotation.y = 0; // Align the fish rotation
                this.isFaceUp = true;
                clearInterval(rotateInterval);
            }
        }, 16); // Approximately 60 frames per second
    }
    

    flipDown() {
        const rotateInterval = setInterval(() => {
            if (this.cardMesh.rotation.y < Math.PI) {
                this.cardMesh.rotation.y += this.rotationSpeed;
    
                // Rotate the attached object (e.g., fish) along with the card
                if (this.attachedObject) {
                    this.attachedObject.rotation.y += this.rotationSpeed;
    
                    // Maintain a fixed distance from the card
                    const offset = new THREE.Vector3(0, 0, -5); // Adjust the offset as needed
                    this.attachedObject.position.copy(this.cardMesh.position).add(offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cardMesh.rotation.y));
                }
            } else {
                this.cardMesh.rotation.y = Math.PI;
                if (this.attachedObject) this.attachedObject.rotation.y = Math.PI; // Align the fish rotation
                this.isFaceUp = false;
                clearInterval(rotateInterval);
            }
        }, 16); // Approximately 60 frames per second
    }
    
    

    setTargetPosition(x, y) {
        this.targetPosition = new THREE.Vector3(x, y, 0);
    }

    moveTowardsTarget() {
        if (this.targetPosition) {
            const direction = new THREE.Vector3().subVectors(this.targetPosition, this.cardMesh.position);
            const distance = direction.length();
            direction.normalize();
            const speed = 0.15;

            if (distance > speed) {
                this.cardMesh.position.add(direction.multiplyScalar(speed));
            } else {
                this.cardMesh.position.copy(this.targetPosition);
                this.targetPosition = null;
            }
        }
    }

    static initiateShuffle() {
        const outerRingIndices = [5, 10, 14, 19, 20, 21, 22, 23, 18, 13, 9, 4, 3, 2, 1, 0];
        const innerRingIndices = [11, 15, 16, 17, 12, 8, 7, 6];

        const positions = cards.map(card => ({
            x: card.cardMesh.position.x,
            y: card.cardMesh.position.y
        }));

        // Set target positions for outer ring cards
        for (let i = 0; i < outerRingIndices.length; i++) {
            const currentIndex = outerRingIndices[i];
            const nextIndex = outerRingIndices[(i + 1) % outerRingIndices.length];
            cards[currentIndex].setTargetPosition(positions[nextIndex].x, positions[nextIndex].y);
        }

        // Set target positions for inner ring cards
        for (let i = 0; i < innerRingIndices.length; i++) {
            const currentIndex = innerRingIndices[i];
            const nextIndex = innerRingIndices[(i + 1) % innerRingIndices.length];
            cards[currentIndex].setTargetPosition(positions[nextIndex].x, positions[nextIndex].y);
        }
    }

    onMouseOver() {
        if (!this.isFaceUp) {
            this.cardMesh.scale.set(1.1, 1.1, 1.1); // Slightly enlarge the card
        }
    }

    onMouseOut() {
        if (!this.isFaceUp) {
            this.cardMesh.scale.set(1, 1, 1); // Reset the card size
        }
    }

    removeCard() {
        scene.remove(this.cardMesh);
    }

    addFishModel() {
        const objLoader = new OBJLoader();
        objLoader.load('Fish.obj', (object) => {
            const material = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); // Yellow/Brownish color
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });
            object.scale.set(0.5, 0.5, 0.5);
            object.position.set(this.cardMesh.position.x, this.cardMesh.position.y, this.cardMesh.position.z);
            object.rotation.set(Math.PI / 2, 0, 0);
            scene.add(object);
    
            setTimeout(() => {
                const bowlPosition = new THREE.Vector3(27, -10, 2);
                const startPosition = object.position.clone();
                const maxZ = 15;
                const totalTime = 2000;
                const intervalTime = 16;
                let elapsedTime = 0;
    
                const moveInterval = setInterval(() => {
                    elapsedTime += intervalTime;
    
                    const progress = elapsedTime / totalTime;
                    if (progress >= 1) {
                        object.position.copy(bowlPosition);
                        clearInterval(moveInterval);
                        return;
                    }
    
                    object.position.x = THREE.MathUtils.lerp(startPosition.x, bowlPosition.x, progress);
                    object.position.y = THREE.MathUtils.lerp(startPosition.y, bowlPosition.y, progress);
    
                    const zHeight = 4 * maxZ * progress * (1 - progress);
                    object.position.z = startPosition.z + zHeight;
    
                    object.rotation.x = progress * 1.5 * Math.PI;
    
                }, intervalTime);
            }, 1000);
        });
    }
    

    lockCardWithRedCross() {
        // Lock the card and add a red cross texture
        this.locked = true;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#aaaaaa';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#ff0000';
        context.lineWidth = 10;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(canvas.width, canvas.height);
        context.moveTo(canvas.width, 0);
        context.lineTo(0, canvas.height);
        context.stroke();

        const redCrossTexture = new THREE.CanvasTexture(canvas);
        this.cardMesh.material[5] = new THREE.MeshBasicMaterial({ map: redCrossTexture });
    }

    unlockCard() {
        this.locked = false;
        this.cardMesh.material[5] = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    }

    swapPositionWith(targetCard, onComplete) {
        const liftHeight1 = 10;
        const liftHeight2 = 20;
        const liftDuration = 500;
        const moveDuration = 1000;
        const intervalTime = 16;

        // Step 1: Lift both cards
        const initialPosition1 = this.cardMesh.position.clone();
        const initialPosition2 = targetCard.cardMesh.position.clone();

        let liftElapsedTime = 0;
        const liftInterval = setInterval(() => {
            liftElapsedTime += intervalTime;
            const liftProgress = Math.min(liftElapsedTime / liftDuration, 1);

            this.cardMesh.position.z = THREE.MathUtils.lerp(initialPosition1.z, initialPosition1.z + liftHeight1, liftProgress);
            targetCard.cardMesh.position.z = THREE.MathUtils.lerp(initialPosition2.z, initialPosition2.z + liftHeight2, liftProgress);

            if (liftProgress === 1) {
                clearInterval(liftInterval);
                // Step 2: Move both cards to swap positions
                let moveElapsedTime = 0;
                const moveInterval = setInterval(() => {
                    moveElapsedTime += intervalTime;
                    const moveProgress = Math.min(moveElapsedTime / moveDuration, 1);

                    this.cardMesh.position.x = THREE.MathUtils.lerp(initialPosition1.x, initialPosition2.x, moveProgress);
                    this.cardMesh.position.y = THREE.MathUtils.lerp(initialPosition1.y, initialPosition2.y, moveProgress);
                    targetCard.cardMesh.position.x = THREE.MathUtils.lerp(initialPosition2.x, initialPosition1.x, moveProgress);
                    targetCard.cardMesh.position.y = THREE.MathUtils.lerp(initialPosition2.y, initialPosition1.y, moveProgress);

                    if (moveProgress === 1) {
                        clearInterval(moveInterval);
                        // Step 3: Lower both cards back down
                        let lowerElapsedTime = 0;
                        const lowerInterval = setInterval(() => {
                            lowerElapsedTime += intervalTime;
                            const lowerProgress = Math.min(lowerElapsedTime / liftDuration, 1);

                            this.cardMesh.position.z = THREE.MathUtils.lerp(initialPosition1.z + liftHeight1, initialPosition1.z, lowerProgress);
                            targetCard.cardMesh.position.z = THREE.MathUtils.lerp(initialPosition2.z + liftHeight2, initialPosition2.z, lowerProgress);

                            if (lowerProgress === 1) {
                                clearInterval(lowerInterval);
                                if (onComplete) onComplete();
                            }
                        }, intervalTime);
                    }
                }, intervalTime);
            }
        }, intervalTime);
    }

    
}

/// Create the grid of cards and skip the center position
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        // Skip the center position at (2, 2)
        if (i === 2 && j === 2) continue;

        // Get color and number for each card
        const { color, number } = colorNumberPairs[numberIndex++];

        // Calculate position for each card
        const positionX = j * (cardWidth + gap) - (cols * (cardWidth + gap)) / 2 + cardWidth / 2;
        const positionY = i * (cardHeight + gap) - (rows * (cardHeight + gap)) / 2 + cardHeight / 2 - 10;

        // Create and add the card to the scene
        new Card(color, number, positionX, positionY);
    }
}

const raycaster = new Raycaster();
const mouse = new Vector2();

// Mouse move event listener
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards.map(card => card.cardMesh));

    cards.forEach(card => card.onMouseOut());

    if (intersects.length > 0) {
        const intersectedCard = intersects[0].object;
        const card = cards.find(card => card.cardMesh === intersectedCard);
        if (card) {
            card.onMouseOver();
        }
    }
});

// Mouse click event listener
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards.map(card => card.cardMesh));

    if (intersects.length > 0) {
        const intersectedCard = intersects[0].object;
        const card = cards.find(card => card.cardMesh === intersectedCard);
        if (card && !card.isFaceUp && !card.locked && selectedCards.length < 2 && !selectedCards.includes(card)) {
            card.flipUp();
            selectedCards.push(card);
        }

        if (selectedCards.length === 2) {
            console.log("HERE");
            currentTurn++;
            cards.forEach(card => card.unlockCard());
            if (selectedCards[0].number === selectedCards[1].number && selectedCards[0].color === selectedCards[1].color)  {
                setTimeout(() => {
                    selectedCards[0].removeCard();
                    selectedCards[1].removeCard();
                    selectedCards[0].addFishModel();
                    selectedCards[1].addFishModel();
                    selectedCards[0].cardMesh.visible = false;
                    selectedCards[1].cardMesh.visible = false;
                    selectedCards = [];
                    consecutiveMatches++;
                    let pointsToAdd = Math.min(2 + (consecutiveMatches - 1), 5);
                    points += pointsToAdd;
                    pointsElement.textContent = `Points: ${points}`;
                    
                    // Rotate the cat's tail back and forth
                    if (kittenTail) {
                        rotateTail();
                    }
                    // Check if all cards are matched
                    if (cards.every(card => !card.cardMesh.visible)) {
                        endGame();
                    }
                }, 1000);
            }  else if (selectedCards[0].color === selectedCards[1].color) {
                // Matching Color, Different Number: Lock cards with a red cross for one round
                // Move kitten's right paw to shake/draw a clockwise circle
                selectedCards[0].lockCardWithRedCross();
                selectedCards[1].lockCardWithRedCross();
                setTimeout(() => {
                    if (kittenPaw) {
                        rotatePaw();
                    }
                    selectedCards[0].flipDown();
                    selectedCards[1].flipDown();
                    selectedCards = [];
                    consecutiveMatches = 0;
                     // Rotate the cat's paw back and forth
                     
                }, 1000);
              
              
            } else if (selectedCards[0].number === selectedCards[1].number && selectedCards[0].color !== selectedCards[1].color) {
                // Matching Number, Different Color: Swap positions as punishment
                selectedCards[0].swapPositionWith(selectedCards[1], () => {
                    if (kittenPaw) {
                        rotatePaw(); // Rotate the kitten's paw during the swap
                    }
                    selectedCards[0].flipDown();
                    selectedCards[1].flipDown();
                    selectedCards = [];
                    consecutiveMatches = 0;
                });
            }
            else {
                setTimeout(() => {
                    selectedCards[0].flipDown();
                    selectedCards[1].flipDown();
                    if (kittenPaw) {
                        rotatePaw(); // 猫咪挥手
                    }
            
                    // 防御性检查
                    if (selectedCards.length < 2) {
                        console.error("Selected cards are not complete.");
                        return;
                    }
            
                    const targetCard = selectedCards[1];
                    if (!targetCard || !targetCard.cardMesh) {
                        console.error("Target card or cardMesh is undefined.");
                        return;
                    }

                    if (!isFishingRodActive) {
                        isFishingRodActive = true; // 标记小鱼竿处于活动状态
                    
            
                        // Load and add the fishing rod model to fly to the second card
                        const objLoader = new OBJLoader();
                        objLoader.load('Fish.obj', (object) => {
                            const material = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); // Brownish color
                            object.traverse((child) => {
                                if (child.isMesh) {
                                    child.material = material;
                                }
                            });
                            object.scale.set(0.5, 0.5, 0.5); // Adjust size
                            object.rotation.set(Math.PI / 2, 0, 0);
                            object.position.set(27, -10, 5); // Start position above the bowl
                
                            scene.add(object);
                
                            // Fly the fishing rod towards the second card
                            const startPosition = object.position.clone();
                            const targetPosition = targetCard.cardMesh.position.clone();
                            targetPosition.z += 5; // Position it slightly above the card
                
                            const totalTime = 2000; // Total fly time in ms
                            const intervalTime = 16; // Frame interval (~60 FPS)
                            let elapsedTime = 0;
                
                            const flyInterval = setInterval(() => {
                                elapsedTime += intervalTime;
                
                                const progress = elapsedTime / totalTime;
                                if (progress >= 1) {
                                    object.position.copy(targetPosition); // Set to final position
                                    targetCard.attachedObject = object;
                                    clearInterval(flyInterval);
                
                                    // Begin tracking turn count for rod to stay on card
                                    const startingTurn = currentTurn; // Record the current turn
                                    const checkInterval = setInterval(() => {
                                        if (currentTurn >= startingTurn + 3) {
                                            console.log("DONE");
                                            // Three rounds passed
                                            scene.remove(object); // Remove the fishing rod
                                            isFishingRodActive = false;
                                            points--; // Deduct points
                                            pointsElement.textContent = `Points: ${points}`;
                                            clearInterval(checkInterval);
                                        }
                
                                        // If the card is matched, remove the rod early
                                        const isMatched = selectedCards.length === 2 &&
                                        selectedCards[0].number === selectedCards[1].number &&
                                        selectedCards[0].color === selectedCards[1].color;
                                    
                                        if (isMatched) {
                                            scene.remove(object); // Remove the fishing rod
                                            isFishingRodActive = false;
                                            clearInterval(checkInterval); // Stop checking
                                        }
                                    }, 500); // Check frequently (but not strictly tied to time)
                                }
                
                                // Update position using linear interpolation for a smooth straight path
                                object.position.lerpVectors(startPosition, targetPosition, progress);
                            }, intervalTime);
                        });
                }
            
                    // 清空选中卡片
                    selectedCards = [];
                    consecutiveMatches = 0;
                }, 1000);
            }
            
        }
    }
});

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light with intensity 0.5
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with intensity 1
directionalLight.position.set(10, 10, 10); // Position it at an angle to create depth
scene.add(directionalLight);

// Optionally add a helper to visualize the light
const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(lightHelper); // Removed the light helper to clean up the visual appearance

// Start button event listener
startButton.addEventListener('click', () => {
    // Start the 10-second timer for each card
    cards.forEach(card => card.startTimer());
    document.body.removeChild(startButton);
    document.body.appendChild(renderer.domElement);
    pointsElement.textContent = `Points: ${points}`;
    
    // Load and add the bowl.obj to the top-right corner
    const objLoader = new OBJLoader();
    objLoader.load('Bowl.obj', (object) => {
        // 创建白色陶瓷材质
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.3
        });
    
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = baseMaterial;
            }
        });
    
        object.scale.set(0.4, 0.4, 0.4);
        object.position.set(27, -10, 0);
        object.rotation.set(Math.PI / 2, 0, 0);
        scene.add(object);
    });

    // Load and add the kitten.fbx model to the top of the board
    const fbxLoader = new FBXLoader();
    fbxLoader.load('kitten_body.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10); // Position above the board
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfcebb1 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        }); // Rotate to face the x-axis // Position above the board
        scene.add(object);
    });

    fbxLoader.load('kitten_backlegs.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10); // Position above the board
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 }); // Golden-brownish color
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        }); // Rotate to face the x-axis // Position above the board
        scene.add(object);
    });

    fbxLoader.load('kitten_head.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -2); // Position above the board
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfcebb1 }); // Golden-brownish color
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        }); // Rotate to face the x-axis // Position above the board
        scene.add(object);
    });

    fbxLoader.load('kitten_ears.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -2); // Position above the board
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        }); // Rotate to face the x-axis // Position above the board
        scene.add(object);
    });

    fbxLoader.load('kitten_eyes.fbx', (object) => {
        object.scale.set(2.5, 2.5, 2.5);
        object.position.set(0, 23, -7); // Position above the board
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        }); // Rotate to face the x-axis // Position above the board
        scene.add(object);
    });
    // Load and add the kitten_leftpaw.fbx model
    fbxLoader.load('kitten_leftpaw.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10); // Position to the left of the kitten body
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 }); // Golden-brownish color
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
        kittenPaw = object;
    });

    // Load and add the kitten_rightpaw.fbx model
    
    fbxLoader.load('kitten_rightpaw.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10); // Position to the right of the kitten body
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 }); // Golden-brownish color
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });

    // Load and add the kitten_tail.fbx model
    fbxLoader.load('kitten_tail.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10); // Position below the kitten body
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 }); // Golden-brownish color
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
        kittenTail = object;
    });
    
    animate();
});

function rotateTail() {
    const startRotation = kittenTail.rotation.x;
    const maxRotation = startRotation - THREE.MathUtils.degToRad(30);
    const totalTime = 2000;
    const halfCycleTime = totalTime / 2;
    const intervalTime = 16;
    let elapsedTime = 0;
    let direction = -1;

    const rotateInterval = setInterval(() => {
        elapsedTime += intervalTime;

        const progress = elapsedTime / halfCycleTime;

        if (direction === -1) {
            kittenTail.rotation.x = THREE.MathUtils.lerp(
                startRotation,
                maxRotation,
                progress
            );
        } else {
            kittenTail.rotation.x = THREE.MathUtils.lerp(
                maxRotation,
                startRotation,
                progress
            );
        }

        if (progress >= 1) {
            elapsedTime = 0;
            direction *= -1;

            if (direction === -1) {
                clearInterval(rotateInterval);
            }
        }
    }, intervalTime);
}




function rotatePaw() {
    const startRotation = kittenPaw.rotation.y;
    const maxRotation = startRotation - THREE.MathUtils.degToRad(15);
    const totalTime = 2000;
    const halfCycleTime = totalTime / 2;
    const intervalTime = 16;
    let elapsedTime = 0;
    let direction = -1;

    const rotateInterval = setInterval(() => {
        elapsedTime += intervalTime;

        const progress = elapsedTime / halfCycleTime;

        if (direction === -1) {
            kittenPaw.rotation.y = THREE.MathUtils.lerp(
                startRotation,
                maxRotation,
                progress
            );
        } else {
            kittenPaw.rotation.y = THREE.MathUtils.lerp(
                maxRotation,
                startRotation,
                progress
            );
        }

        if (progress >= 1) {
            elapsedTime = 0;
            direction *= -1;

            if (direction === -1) {
                clearInterval(rotateInterval);
            }
        }
    }, intervalTime);
}





// Animation loop
function endGame() {
    // Stop the animation
    cancelAnimationFrame(animationId);

    // Display final score
    const endMessage = document.createElement('div');
    endMessage.innerText = `Game Over! Final Score: ${points}`;
    endMessage.style.position = 'absolute';
    endMessage.style.top = '50%';
    endMessage.style.left = '50%';
    endMessage.style.transform = 'translate(-50%, -50%)';
    endMessage.style.padding = '20px';
    endMessage.style.fontSize = '32px';
    endMessage.style.color = '#000';
    endMessage.style.backgroundColor = '#fff';
    endMessage.style.borderRadius = '10px';
    document.body.appendChild(endMessage);

    // Create Replay button
    const replayButton = document.createElement('button');
    replayButton.innerText = 'Replay';
    replayButton.style.position = 'absolute';
    replayButton.style.top = '60%';
    replayButton.style.left = '50%';
    replayButton.style.transform = 'translate(-50%, -50%)';
    replayButton.style.padding = '20px';
    replayButton.style.fontSize = '24px';
    replayButton.style.cursor = 'pointer';
    document.body.appendChild(replayButton);

    replayButton.addEventListener('click', () => {
        location.reload();
    });
}

let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Update controls
    controls.update();

    // Countdown
    if (!countdownStarted) {
        countdownStarted = true;

        // 初始化开始前的 10 秒倒计时
        let preGameCountdown = 10;

        const preGameInterval = setInterval(() => {
            const formattedSeconds = String(preGameCountdown).padStart(2, '0');
            timerElement.textContent = `Starting in: 00:${formattedSeconds}`;
            preGameCountdown--;

            if (preGameCountdown < 0) {
                clearInterval(preGameInterval);

                // 所有牌翻过去后，开始正式计时 3 分钟
                cards.forEach(card => card.startRotation());

                // 等牌翻过去后启动 3 分钟倒计时
                setTimeout(() => {
                    Card.initiateShuffle();
                    startGameTimer(); // 启动 3 分钟倒计时
                }, 1000);
            }
        }, 1000);
    }

    // Move each card towards its target position during shuffle animation
    cards.forEach(card => card.moveTowardsTarget());
}

// 启动正式游戏的 3 分钟倒计时
function startGameTimer() {
    let gameCountdown = 180; // 3 分钟倒计时

    const gameInterval = setInterval(() => {
        const minutes = Math.floor(gameCountdown / 60);
        const seconds = gameCountdown % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        timerElement.textContent = `Timer: ${formattedMinutes}:${formattedSeconds}`;
        gameCountdown--;

        if (gameCountdown < 0) {
            clearInterval(gameInterval);
            endGame(); // 游戏时间到，触发 Game Over
        }
    }, 1000);
}




// Adjust canvas size on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
