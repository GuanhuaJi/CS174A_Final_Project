import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
loader.load('scene_background.jpg', function(texture) {
    scene.background = texture;
});
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const timer_display = document.createElement('div');
timer_display.style.position = 'absolute';
timer_display.style.top = '10px';
timer_display.style.border = '10px solid #f0a0a0'; 
timer_display.style.fontFamily = "'Brush Script MT', cursive, sans-serif";
timer_display.style.left = '10px';
timer_display.style.fontSize = '30px';
timer_display.style.padding = '10px';
timer_display.style.borderRadius = '5px';



timer_display.style.color = '#000';
timer_display.style.backgroundColor = '#fff';
document.body.appendChild(timer_display);

const scoreboard = document.createElement('div');
scoreboard.style.position = 'absolute';

scoreboard.style.backgroundColor = '#fff';
scoreboard.style.padding = '10px';
scoreboard.style.borderRadius = '5px';
scoreboard.style.top = '10px';
scoreboard.style.right = '10px';
scoreboard.style.fontSize = '30px';
scoreboard.style.color = '#000';
scoreboard.style.border = '10px solid #f0a0a0';
scoreboard.style.fontFamily = "'Brush Script MT', cursive, sans-serif";


document.body.appendChild(scoreboard);

let points = 0;
// let initialCountdown = 10;
let countdownStarted = false;
// let timerStart = null;
let consecutiveMatches = 0;
let kittenTail = null;
let kittenPaw = null;
let currentTurn = 0;
let isFishingRodActive = false;


const startbutton = document.createElement('button');
startbutton.innerText = 'Start Game';
startbutton.style.position = 'absolute';
startbutton.style.transform = 'translate(-50%, -50%)';
startbutton.style.top = '50%';
startbutton.style.left = '50%';
startbutton.style.padding = '20px';
startbutton.style.fontSize = '24px';
startbutton.style.cursor = 'pointer';
document.body.appendChild(startbutton);
// not used
function setRandomSeed(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}
//seed is for demo, please remove it during actual play
let seed = 12345;
function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

camera.position.z = 50;

// set the range in which camera can move
const camera_control = new OrbitControls(camera, renderer.domElement);

camera_control.minPolarAngle = Math.PI / 2 - THREE.MathUtils.degToRad(30);
camera_control.maxPolarAngle = Math.PI / 2 + THREE.MathUtils.degToRad(30);
camera_control.minAzimuthAngle = -THREE.MathUtils.degToRad(30);
camera_control.maxAzimuthAngle = THREE.MathUtils.degToRad(30);

camera_control.enableZoom = true;

camera_control.minDistance = 30;
camera_control.maxDistance = 100;

camera_control.update();


const rows = 5;
const cols = 5;
const cardWidth = 8;
const cardHeight = 8;
const cardDepth = 1.5;
const gap = 1;

// these are colors of the card, red, bluc, orange, and green
const colors = [0xFF0000, 0x0000FF, 0xFFA500, 0x008000];

const colorNumberPairs = [];
for (let color of colors) {
    for (let number = 1; number <= 3; number++) {
        colorNumberPairs.push({ color,number }, { color,number });
} 
}

for (let i = colorNumberPairs.length - 1; i > 0; i--) {
     const j = Math.floor(random() * (i + 1));
    [colorNumberPairs[i], colorNumberPairs[j]] = [colorNumberPairs[j], colorNumberPairs[i]];
 }

let numberIndex = 0;
const cards = [];
let selectedCards = [];
let allCardsFacedDown = false;
let timerStarted = false;

class Card {
    constructor(color, number, positionX, positionY) {
        this.number = number;
        this.color = color;
        this.positionX = positionX;
        this.positionY = positionY;
        this.isFaceUp = true;
        this.rotationSpeed = 0.05;
        this.createCard();
        this.locked = false;
        this.attachedObject = null;
    }

    createCard() {
        const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);

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

        const materials = [
            sideMaterial,
            sideMaterial,
            sideMaterial,
            sideMaterial,
            frontMaterial,
            backMaterial
        ];

        this.cardMesh = new THREE.Mesh(cardGeometry, materials);

        this.cardMesh.position.set(this.positionX, this.positionY, 0);

        scene.add(this.cardMesh);

        cards.push(this);
    }

    startTimer() {
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

                if (!allCardsFacedDown) {
                    allCardsFacedDown = cards.every(card => !card.isFaceUp);
                    if (allCardsFacedDown && !timerStarted) {
                        timerStarted = true;
                        timerStart = Date.now();
                    }
                }
            }
        }, 16);
    }

    flipUp() {
       const rotateInterval = setInterval(() => {
            if (this.cardMesh.rotation.y > 0) {
                this.cardMesh.rotation.y -= this.rotationSpeed;
    
                if (this.attachedObject) {
                    this.attachedObject.rotation.y -= this.rotationSpeed;
    
                    const offset = new THREE.Vector3(0, 0, -5);
                    this.attachedObject.position.copy(this.cardMesh.position).add(offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cardMesh.rotation.y));
                }
            } else {
                this.cardMesh.rotation.y = 0;
                if (this.attachedObject) {
                    this.attachedObject.rotation.y = 0;
                    }
                this.isFaceUp = true;
                clearInterval(rotateInterval);
            }
        }, 16);
    }
    

    flipDown() {
        const rotateInterval = setInterval(() => {
            if (this.cardMesh.rotation.y < Math.PI) {
                this.cardMesh.rotation.y += this.rotationSpeed;
    
                if (this.attachedObject) {
                    this.attachedObject.rotation.y += this.rotationSpeed;
    
                    const offset = new THREE.Vector3(0, 0, -5);
                    this.attachedObject.position.copy(this.cardMesh.position).add(offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cardMesh.rotation.y));
                }
            } 
            else {
                this.cardMesh.rotation.y = Math.PI;
                if (this.attachedObject) this.attachedObject.rotation.y = Math.PI;
                this.isFaceUp = false;
                clearInterval(rotateInterval);
            }
        }, 16);
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

        for (let i = 0; i < outerRingIndices.length; i++) {
            const currentIndex = outerRingIndices[i];
            const nextIndex = outerRingIndices[(i + 1) % outerRingIndices.length];
            cards[currentIndex].setTargetPosition(positions[nextIndex].x, positions[nextIndex].y);
        }

        for (let i = 0; i < innerRingIndices.length; i++) {
            const currentIndex = innerRingIndices[i];
            const nextIndex = innerRingIndices[(i + 1) % innerRingIndices.length];
            cards[currentIndex].setTargetPosition(positions[nextIndex].x, positions[nextIndex].y);
        }
    }

    onMouseOver() {
        if (!this.isFaceUp) {
            this.cardMesh.scale.set(1.1, 1.1, 1.1);
        }
    }

    onMouseOut() {
        if (!this.isFaceUp) {
            this.cardMesh.scale.set(1, 1, 1);
        }
    }

    removeCard() {
        scene.remove(this.cardMesh);
    }

    addFishModel() {
        const objLoader = new OBJLoader();
        objLoader.load('Fish.obj', (object) => {
            const material = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
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

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        if (i === 2 && j === 2) continue;

        const { color, number } = colorNumberPairs[numberIndex++];

        const positionX = j * (cardWidth + gap) - (cols * (cardWidth + gap)) / 2 + cardWidth / 2;
        const positionY = i * (cardHeight + gap) - (rows * (cardHeight + gap)) / 2 + cardHeight / 2 - 10;

        new Card(color, number, positionX, positionY);
    }
}

const raycaster = new Raycaster();
const mouse = new Vector2();

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
                    scoreboard.textContent = `Points: ${points}`;
                    
                    if (kittenTail) {
                        rotateTail();
                    }
                    if (cards.every(card => !card.cardMesh.visible)) {
                        endGame();
                    }
                }, 1000);
            }  else if (selectedCards[0].color === selectedCards[1].color) {
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
                     
                }, 1000);
              
              
            } 
            
            //this is when cards dont have same color but smae number
            else if (selectedCards[0].number === selectedCards[1].number && selectedCards[0].color !== selectedCards[1].color) 
                {
                  selectedCards[0].swapPositionWith(selectedCards[1], () => {
                    if (kittenPaw) {
                        rotatePaw();
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
                        rotatePaw();
                    }
        
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
                        isFishingRodActive = true;
                    
                        const objLoader = new OBJLoader();
                        objLoader.load('Fish.obj', (object) => {
                            const material = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
                            object.traverse((child) => {
                                if (child.isMesh) {
                                    child.material = material;
                                }
                            });
                            object.scale.set(0.5, 0.5, 0.5);
                            object.rotation.set(Math.PI / 2, 0, 0);
                            object.position.set(27, -10, 5);
                
                            scene.add(object);
                
                            const startPosition = object.position.clone();
                            const targetPosition = targetCard.cardMesh.position.clone();
                            targetPosition.z += 5;
                
                            const totalTime = 2000;
                            const intervalTime = 16;
                            let elapsedTime = 0;
                
                            const flyInterval = setInterval(() => {
                                elapsedTime += intervalTime;
                
                                const progress = elapsedTime / totalTime;
                                if (progress >= 1) {
                                    object.position.copy(targetPosition);
                                    targetCard.attachedObject = object;
                                    clearInterval(flyInterval);
                
                                    const startingTurn = currentTurn;
                                    const checkInterval = setInterval(() => {
                                        if (currentTurn >= startingTurn + 3) {
                                            console.log("DONE");
                                            scene.remove(object);
                                            isFishingRodActive = false;
                                            points--; 
                                            scoreboard.textContent = `Points: ${points}`;
                                            clearInterval(checkInterval);
                                        }
                                        const isMatched = selectedCards.length === 2 &&
                                        selectedCards[0].number === selectedCards[1].number &&
                                        selectedCards[0].color === selectedCards[1].color;
                                    
                                        if (isMatched) {
                                            scene.remove(object);
                                            isFishingRodActive = false;
                                            clearInterval(checkInterval);
                                        }
                                    }, 500);
                                }
                                object.position.lerpVectors(startPosition, targetPosition, progress);
                            }, intervalTime);
                        });
                }
                    selectedCards = [];
                    consecutiveMatches = 0;
                }, 1000);
            }
            
        }
    }
});

const ambient_light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient_light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

//not used anymore, please skip

startbutton.addEventListener('click', () => {
    cards.forEach(card => card.startTimer());
    document.body.removeChild(startbutton);
    document.body.appendChild(renderer.domElement);
    scoreboard.textContent = `Points: ${points}`;
    
    const objLoader = new OBJLoader();
    // here I defined all the objects taht are used in this scene
    objLoader.load('Bowl.obj', (object) => {
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

    const fbxLoader = new FBXLoader();
    fbxLoader.load('kitten_body.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10);
        object.rotation.set(Math.PI / 2, 0, 0);

        const material = new THREE.MeshStandardMaterial({ color: 0xfcebb1 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });

    fbxLoader.load('kitten_backlegs.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });

    fbxLoader.load('kitten_head.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -2);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0xfcebb1 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });

    fbxLoader.load('kitten_ears.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -2);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });

    fbxLoader.load('kitten_eyes.fbx', (object) => {
        object.scale.set(2.5, 2.5, 2.5);
        object.position.set(0, 23, -7);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });
    fbxLoader.load('kitten_leftpaw.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
        kittenPaw = object;
    });
    
    fbxLoader.load('kitten_rightpaw.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(object);
    });

    fbxLoader.load('kitten_tail.fbx', (object) => {
        object.scale.set(3, 3, 3);
        object.position.set(0, 23, -10);
        object.rotation.set(Math.PI / 2, 0, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0xfce186 });
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
        } 
       else {
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

function endGame() {
    cancelAnimationFrame(animationId);

    const gameendMessage = document.createElement('div');
    gameendMessage.innerText = `Game Over! Final Score: ${points}`;
    gameendMessage.style.position = 'absolute';
    gameendMessage.style.top = '50%';
    gameendMessage.style.left = '50%';
    gameendMessage.style.padding = '20px';
    gameendMessage.style.fontSize = '32px';
    gameendMessage.style.transform = 'translate(-50%, -50%)';
    gameendMessage.style.color = '#000';
    gameendMessage.style.backgroundColor = '#fff';
    gameendMessage.style.borderRadius = '10px';
    document.body.appendChild(gameendMessage);

    const replay_key = document.createElement('button');
    replay_key.innerText = 'Replay';
    replay_key.style.position = 'absolute';
    replay_key.style.top = '60%';
    replay_key.style.transform = 'translate(-50%, -50%)';
    replay_key.style.padding = '20px';
    replay_key.style.fontSize = '24px';
    replay_key.style.cursor = 'pointer';
    replay_key.style.left = '50%';

    
    document.body.appendChild(replay_key);

    replay_key.addEventListener('click', () => {
        location.reload();
    });
}

let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);

    camera_control.update();

    if (!countdownStarted) {
        countdownStarted = true;

        let preGameCountdown = 10;

        const preGameInterval = setInterval(() => {
            const formattedSeconds = String(preGameCountdown).padStart(2, '0');
            timer_display.textContent = `Starting in: 00:${formattedSeconds}`;
            preGameCountdown--;

            if (preGameCountdown < 0) {
                clearInterval(preGameInterval);

                cards.forEach(card => card.startRotation());

                setTimeout(() => {
                    Card.initiateShuffle();
                    startGameTimer();
                }, 1000);
            }
        }, 1000);
    }

    cards.forEach(card => card.moveTowardsTarget());
}

function startGameTimer() {
    let gameCountdown = 180;

    const gameInterval = setInterval(() => {
        const minutes = Math.floor(gameCountdown / 60);
        const seconds = gameCountdown % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        timer_display.textContent = `Timer: ${formattedMinutes}:${formattedSeconds}`;
        gameCountdown--;

        if (gameCountdown < 0) {
            clearInterval(gameInterval);
            endGame();
        }
    }, 1000);
}


window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
