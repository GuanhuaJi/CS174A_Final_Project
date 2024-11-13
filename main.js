// Import the required Three.js components
import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';

// Setting up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize Timer element
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

let initialCountdown = 10;
let countdownStarted = false;
let timerStart = null;

// Adjust the camera position
camera.position.z = 50;

// Create a board of cards (5x5 grid)
const rows = 5;
const cols = 5;
const cardWidth = 5;
const cardHeight = 5;
const cardDepth = 1;
const gap = 0.5;

//Card colors
const colors = [0xFF0000, 0x0000FF, 0xFFFF00, 0x008000];


// Generate combinations of color and number
const colorNumberPairs = [];
for (let color of colors) {
    for (let number = 1; number <= 3; number++) {
        colorNumberPairs.push({ color,number }, { color,number }); // Each combination appears twice
} 
}

// Shuffle the color-number pairs array
for (let i = colorNumberPairs.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
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

    setTargetPosition(x, y) {
        this.targetPosition = new THREE.Vector3(x, y, 0);
    }

    moveTowardsTarget() {
        if (this.targetPosition) {
            const direction = new THREE.Vector3().subVectors(this.targetPosition, this.cardMesh.position);
            const distance = direction.length();
            direction.normalize();
            const speed = 0.05;

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
        const positionY = i * (cardHeight + gap) - (rows * (cardHeight + gap)) / 2 + cardHeight / 2;

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
        if (card && !card.isFaceUp && selectedCards.length < 2) {
            card.flipUp();
            selectedCards.push(card);
        }

        if (selectedCards.length === 2) {
            if (selectedCards[0].number === selectedCards[1].number && selectedCards[0].color === selectedCards[1].color)  {
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

// Create a kitten using Three.js basic geometry shapes
function createKitten() {
    const kittenGroup = new THREE.Group();

    // Body - Cylinder to represent the torso
    const bodyGeometry = new THREE.CylinderGeometry(2, 2.5, 6, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    body.rotation.z = Math.PI / 2;
    kittenGroup.add(body);

    // Head - Sphere to represent the head
    const headGeometry = new THREE.SphereGeometry(2, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(4, 0, 0);
    kittenGroup.add(head);

    // Ears - Cones to represent ears
    const earGeometry = new THREE.ConeGeometry(1, 2, 32);
    const earMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    
    leftEar.position.set(5.5, 1.5, 1);
    leftEar.rotation.z = Math.PI / 8;
    rightEar.position.set(5.5, 1.5, -1);
    rightEar.rotation.z = -Math.PI / 8;
    
    kittenGroup.add(leftEar);
    kittenGroup.add(rightEar);

    // Legs - Cylinders to represent the legs
    const legGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);

    frontLeftLeg.position.set(1, -2, 1.5);
    frontRightLeg.position.set(1, -2, -1.5);
    backLeftLeg.position.set(-1, -2, 1.5);
    backRightLeg.position.set(-1, -2, -1.5);

    kittenGroup.add(frontLeftLeg);
    kittenGroup.add(frontRightLeg);
    kittenGroup.add(backLeftLeg);
    kittenGroup.add(backRightLeg);

    // Tail - Cylinder to represent the tail
    const tailGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 32);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-3.5, 0, 0);
    tail.rotation.z = Math.PI / 4;
    kittenGroup.add(tail);

    // Eyes - Small spheres for the eyes
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);

    leftEye.position.set(5, 0.8, 0.8);
    rightEye.position.set(5, 0.8, -0.8);

    kittenGroup.add(leftEye);
    kittenGroup.add(rightEye);

    // Nose - Small cone for the nose
    const noseGeometry = new THREE.ConeGeometry(0.2, 0.5, 16);
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xff6347 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(5.9, 0.3, 0);
    nose.rotation.x = Math.PI / 2;
    kittenGroup.add(nose);

    // Whiskers - Use thin cylinders to represent whiskers
    const whiskerGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const whiskerMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    for (let i = 0; i < 3; i++) {
        const leftWhisker = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
        leftWhisker.position.set(6, 0.1 * (i - 1), 1.2);
        leftWhisker.rotation.z = Math.PI / 6;
        kittenGroup.add(leftWhisker);

        const rightWhisker = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
        rightWhisker.position.set(6, 0.1 * (i - 1), -1.2);
        rightWhisker.rotation.z = -Math.PI / 6;
        kittenGroup.add(rightWhisker);
    }

    // Add some simple texture using bump mapping (for more realistic fur effect)
    const bumpTexture = new THREE.TextureLoader().load('textures/fur_bump_map.jpg', function() { console.log('Bump map loaded successfully'); }, undefined, function() { console.error('Error loading bump map'); });
    bodyMaterial.bumpMap = bumpTexture;
    bodyMaterial.bumpScale = 0.5;
    headMaterial.bumpMap = bumpTexture;
    headMaterial.bumpScale = 0.5;

    return kittenGroup;
}

// Add the kitten to the scene
const kitten = createKitten();
kitten.position.set(0, -20, 0);
scene.add(kitten);

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

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Countdown
    if (!countdownStarted) {
        countdownStarted = true;

        const formattedMinutes = String(Math.floor(initialCountdown / 60)).padStart(2, '0');
        const formattedSeconds = String(initialCountdown % 60).padStart(2, '0');
        timerElement.textContent = `Timer: ${formattedMinutes}:${formattedSeconds}`;

        const countdownInterval = setInterval(() => {
            initialCountdown--;

            const minutes = Math.floor(initialCountdown / 60);
            const seconds = initialCountdown % 60;
            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(seconds).padStart(2, '0');
            timerElement.textContent = `Timer: ${formattedMinutes}:${formattedSeconds}`;

            if (initialCountdown <= 0) {
                clearInterval(countdownInterval);

                // Flip all cards face down after countdown ends
                cards.forEach(card => card.startRotation());

                // After flipping, initiate the shuffle animation
                setTimeout(() => {
                    Card.initiateShuffle();
                }, 1000); // Wait for 1 second after flipping down before shuffling
            }
        }, 1000);
    }

    // Move each card towards its target position during shuffle animation
    cards.forEach(card => card.moveTowardsTarget());

    // Update game timer display once all cards have faced down and are shuffled
    if (allCardsFacedDown && timerStart) {
        const elapsedTime = Math.floor((Date.now() - timerStart) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
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
