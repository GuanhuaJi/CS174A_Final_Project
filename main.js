// Import the required Three.js components
import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';

// Setting up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Timer element
const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '20px';
timerElement.style.left = '50%';
timerElement.style.transform = 'translateX(-50%)';
timerElement.style.fontSize = '24px';
timerElement.style.color = '#000';
timerElement.style.backgroundColor = '#fff';
timerElement.style.padding = '10px';
timerElement.style.borderRadius = '5px';
document.body.appendChild(timerElement);
let timerStart = null;

// Adjust the camera position
camera.position.z = 50;

// Create a board of cards (6x6 grid)
const rows = 6;
const cols = 6;
const cardWidth = 5;
const cardHeight = 5;
const cardDepth = 1;
const gap = 0.5;

// Generate card numbers (1-18, each number appears twice)
const numbers = [];
for (let i = 1; i <= 18; i++) {
    numbers.push(i, i);
}

// Shuffle the numbers array
for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
}

let numberIndex = 0;
const cards = [];
let selectedCards = [];
let allCardsFacedDown = false;
let timerStarted = false;

// Card class definition
class Card {
    constructor(number, positionX, positionY) {
        this.number = number;
        this.positionX = positionX;
        this.positionY = positionY;
        this.isFaceUp = true;
        this.rotationSpeed = 0.05; // Control the speed of rotation
        this.createCard();
        this.startTimer();
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
        context.font = '40px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.number, canvas.width / 2, canvas.height / 2);

        const frontTexture = new THREE.CanvasTexture(canvas);
        const frontMaterial = new THREE.MeshBasicMaterial({ map: frontTexture });
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
            } else {
                this.cardMesh.rotation.y = 0;
                this.isFaceUp = true;
                clearInterval(rotateInterval);
            }
        }, 16); // Approximately 60 frames per second
    }

    flipDown() {
        const rotateInterval = setInterval(() => {
            if (this.cardMesh.rotation.y < Math.PI) {
                this.cardMesh.rotation.y += this.rotationSpeed;
            } else {
                this.cardMesh.rotation.y = Math.PI;
                this.isFaceUp = false;
                clearInterval(rotateInterval);
            }
        }, 16); // Approximately 60 frames per second
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
}

// Create the grid of cards
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        // Get the number for each card
        const cardNumber = numbers[numberIndex++];

        // Calculate position for each card
        const positionX = j * (cardWidth + gap) - (cols * (cardWidth + gap)) / 2 + cardWidth / 2;
        const positionY = i * (cardHeight + gap) - (rows * (cardHeight + gap)) / 2 + cardHeight / 2;

        // Create and add the card to the scene
        new Card(cardNumber, positionX, positionY);
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
        if (card && !card.isFaceUp && selectedCards.length < 2) {
            card.flipUp();
            selectedCards.push(card);
        }

        if (selectedCards.length === 2) {
            if (selectedCards[0].number === selectedCards[1].number) {
                setTimeout(() => {
                    selectedCards[0].removeCard();
                    selectedCards[1].removeCard();
                    selectedCards = [];
                }, 1000);
            } else {
                setTimeout(() => {
                    selectedCards[0].flipDown();
                    selectedCards[1].flipDown();
                    selectedCards = [];
                }, 1000);
            }
        }
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Update timer display
    if (allCardsFacedDown && timerStart) {
        const elapsedTime = Math.floor((Date.now() - timerStart) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;

        // Format minutes and seconds to always be two digits
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');

        timerElement.textContent = `Timer: ${formattedMinutes}:${formattedSeconds}`;
    }
}


animate();

// Adjust canvas size on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
