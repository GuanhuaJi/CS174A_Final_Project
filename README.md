# Mischievous Kitten Match-Up

![Game Cover](https://github.com/GuanhuaJi/CS174A_FInal_Project/blob/main/41e9514640af6bec704c8a4a92d41601585f9e0f5e0ab44a8edffbc9d7d34613.png)

### Installation
Clone repository
```bash
git clone https://github.com/GuanhuaJi/CS174A_Final_Project.git
```

Install node.js and npm and run
```bash 
npm init -y
npm install --save three
npm install --save-dev vite
```
to install relevent packages, then run
```bash 
npx vite
```
to start the game.


### Game Objective
Players must eliminate all cards by matching pairs while dealing with interference from an AI kitten to successfully complete the game.

---

## Game Rules

### 1. Game Initialization

- **Card Layout:**  
  The game board has a 4x4 layout with 16 cards in total.  
  Each card has a color (red, blue, yellow, green) and a number (1 or 2), with each combination appearing on two cards.

- **Preview Phase:**  
  At the start of the game, all cards are face-up for 10 seconds, allowing players to memorize their positions and details.

- **Initial Shuffle:**  
  After 10 seconds, all cards flip face-down, and a simple shuffle occurs, i.e. moving each card one position clockwise.

### 2. Game Turn Flow

- **Player Flip:**  
  Each turn, the player can flip two cards to check if they match.

- **Matching Check:**  
  The two cards flipped by the player are checked based on the following rules:

  - **Exact Match (same color and number):**  
    - If both color and number are identical, it’s a successful match, and the cards are removed from the board.
    - **Rewards:**  
      - After three consecutive successful matches, the player can reveal an unrevealed card.
      - After five consecutive matches, the player can prevent the kitten from interfering once.

  - **Matching Color, Different Number:**  
    - The kitten is mildly disturbed, stands up, and is "woken up."
    - Two spotlights highlight these cards, temporarily locking them for one turn, so they cannot be flipped in the next round.
    - Afterward, the kitten returns to sleep.

  - **Matching Number, Different Color:**  
    - The kitten wags its tail and slightly interferes by swapping the positions of the two cards.
    - The kitten then returns to sleep.

  - **No Match (different color and number):**  
    - A fish snack falls onto the position of the second mismatched card.
    - The kitten stands up and moves along the shortest path to reach the fish snack, attempting to eat it.
    - **Path Behavior:**  
      - If the kitten successfully reaches the fish snack, it eats it, returns to its original spot, and the remaining cards reshuffle.
      - If the kitten cannot reach the fish snack, it stops at the final card in its path and locks it for one turn.
      - The kitten can only move up, down, left, or right along the cards.

- **Error Feedback:**  
  If the two flipped cards do not match, they shake briefly to indicate an incorrect choice.

### 3. Game End Conditions

- **All Cards Cleared:**  
  When the player successfully matches and clears all cards, the game ends, and the player wins.
