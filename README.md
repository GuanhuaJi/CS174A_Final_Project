# CS174A_FInal_Project

# Mischievous Kitten Match-Up

Game Objective

Players must eliminate all cards by matching pairs, while dealing with interference from an AI kitten to successfully complete the game.

Game Rules

	1.	Game Initialization
	•	Card Layout: The game board has a 6x6 layout with 36 cards in total.
	•	Each card has a color (red, blue, yellow, green, pink, purple) and a number (1-3), with each combination appearing on two cards.
	•	Preview Phase:
	•	At the start of the game, all cards are face-up for 10 seconds to allow players to memorize their positions and details.
	•	Initial Shuffle:
	•	After 10 seconds, all cards flip face-down, and a simple shuffle occurs, such as moving each card one position clockwise.
	2.	Game Turn Flow
	•	Player Flip:
	•	Each turn, the player can flip two cards to check if they match.
	•	Matching Check:
	•	The two cards flipped by the player are checked based on the following rules:
	•	Exact Match (same color and number):
	•	If both color and number are identical, it’s a successful match, and the cards are removed from the board.
	•	Rewards:
	•	If the player makes three consecutive successful matches, they can reveal an unrevealed card.
	•	With five consecutive matches, they can prevent the kitten from interfering once.
	•	Matching Color, Different Number:
	•	The kitten is mildly disturbed, stands up, and is “woken up.”
	•	Two spotlights highlight these cards, which are temporarily locked for one turn and cannot be flipped in the next round.
	•	Afterward, the kitten returns to sleep.
	•	Matching Number, Different Color:
	•	The kitten wags its tail and slightly interferes by swapping the positions of the two cards.
	•	The kitten then goes back to sleep.
	•	No Match (different color and number):
	•	A fish snack falls onto the position of the second mismatched card.
	•	The kitten stands up and moves along the shortest path to reach the fish snack, attempting to eat it.
	•	Path Behavior:
	•	If the kitten successfully reaches the fish snack, it eats it and returns to its original spot, causing the remaining cards to reshuffle.
	•	If the kitten cannot reach the fish snack, it stops at the final card in its path and locks it for one turn.
	•	The kitten can only move up, down, left, or right along the cards.
	•	Error Feedback:
	•	If the two flipped cards do not match, they shake briefly to indicate an incorrect choice.
	3.	Game End Conditions
	•	All Cards Cleared: When the player successfully matches and clears all cards, the game ends, and the player wins.