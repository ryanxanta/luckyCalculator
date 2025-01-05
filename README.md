# Lucky Score Game Rules & Formulas

## Game Components
- **Lucky**: Points gained or lost through lucky actions
- **Game**: Points from game actions
- **Table**: Points related to table penalties
- **Total**: Sum of Lucky + Game + Table points

## Input Fields
- **Lucky Input**: Sets the amount for lucky points transfers
- **Game Input**: Sets the base amount for game points
- **Table Input**: Sets the penalty amount for table points

## Button Actions & Formulas

### Lucky Points (L)
When only P (green) player is selected:
- **+L Button**: All other players lose Lucky Input amount, selected player gains Lucky Input × (number of active players - 1)
- **-L Button**: All other players gain Lucky Input amount, selected player loses Lucky Input × (number of active players - 1)

When both P (green) and B (red) players are selected:
- **+L Button**: B player loses Lucky Input amount, P player gains Lucky Input amount
- **-L Button**: B player gains Lucky Input amount, P player loses Lucky Input amount

### Game Points (G)
When only P (green) player is selected:
- **G Button**: Game action
  - Winner (P): Gets +(Game Input value) × (number of active players - 1)
  - Other players: Each loses -(Game Input value) points
  - Table penalty for winner: -(Table Input value) points

When both P (green) and B (red) players are selected:
- **G Button**: Direct transfer
  - B player loses: -(Game Input value) × (number of active players - 1)
  - P player gains: +(Game Input value) × (number of active players - 1)
  - P player gets: -(Table Input value) points to table

### Penalty Points (P)
- **P Button**: Applies a table penalty
  - Selected player gets -(Table Input value) points to their table score

## Player States
- **P Button**: Marks player as winner/receiver (green)
- **B Button**: Marks player as loser/giver (red)
- **❄️ Button**: Freezes player (inactive state)

## Examples

### Lucky Transfer
Two-player transfer:
1. Select giver with B button (red)
2. Select receiver with P button (green)
3. Enter amount in Lucky Input (e.g., 10)
4. Press +L: B player loses 10, P player gains 10
   Press -L: B player gains 10, P player loses 10

Multi-player transfer:
1. Select only receiver with P button (green)
2. Enter amount in Lucky Input (e.g., 10)
3. Press +L: All other players lose 10 each, P player gains 10 × (players-1)
   Press -L: All other players gain 10 each, P player loses 10 × (players-1)

### Game Scoring
For a 4-player game with Game Input = 5:

Single winner:
1. Select winner with P button (green)
2. Press G button
   - Winner gets: +15 points (5 × 3 players)
   - Other players: -5 points each
   - Table penalty for winner: -3 points (from Table Input)

Direct transfer:
1. Select loser with B button (red)
2. Select winner with P button (green)
3. Press G button
   - B player loses: -15 points (5 × 3 players)
   - P player gains: +15 points
   - P player gets table penalty: -3 points (from Table Input)

### Penalty
1. Select player with P button (green)
2. Press P button
   - Selected player gets table penalty (amount from Table Input)

## Notes
- Maximum 5 active players allowed
- Frozen players don't participate in point calculations
- Total table value shows sum of all absolute table point values
- Always set input values before starting the game 