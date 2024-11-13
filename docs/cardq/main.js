title = "CARD Q";

description = `
      [Tap]
  Pull out a card

  [A,S,D,F,Space]
 Play from column
`;

characters = [
  `
l  l
l l l
l l l
l l l
l l l
l  l
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 8,
};

const numChars = [
  "",
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

/** @type {{num: number, pos: Vector, tPos:Vector, gPos:Vector , enemyplacing:boolean }[]} */
let playerCards;
/** @type {{num: number, pos: Vector, tPos:Vector, gPos:Vector , enemyplacing:boolean }[]} */
let enemyCards;
/** @type {{num: number, pos: Vector, tPos:Vector, enemyplacing:boolean }[]} */
let placedCards;
/** @type {{num: number, pos: Vector, tPos:Vector, enemyplacing:boolean, pi:number, cn:number }[]} */
let enemyPlacingCards;
/** @type { number[]} */
let placedCardNumbers;
let centerY;
let targetCenterY;
let playerPrevMoveIndex;
let enemyPrevMoveIndex;
let enemyNextMoveIndex;
let enemyNextMoveTicks;
let shuffleTicks;
let shuffleCount;
let penaltyIndex;
let penaltyTicks;
let multiplier;
let scoreBoxY;
let keyPressed = false;
let hitKey;
const cardIntervalX = 15;
const cardRowCount = 5;
const cardColumnCount = 5;

let playerCombo = 0;
let enemyCombo = 0;
let playerScore = 0;
let enemyScore = 0;
document.addEventListener('keydown', (event) => {
  console.log(`Key pressed: ${event.key}`);
  hitKey = event.key;
  keyPressed = true;
});


function update() {
  drawBar();
  drawScoreBox(scoreBoxY);
  if (!ticks) { // "ready" function that occurs once when game runs
    placedCardNumbers = [2, 12];
    placedCards = times(2, (i) => {
      const pos = vec(calcPlacedCardX(i), 0);
      const tPos = vec(pos);
      const enemyplacing = false;
      return { num: placedCardNumbers[i], pos, tPos, enemyplacing };
      
    });
    playerCards = times(cardColumnCount * cardRowCount, (i) => {
      const gPos = vec(i % cardColumnCount, floor(i / cardColumnCount));
      const num = gPos.y === 0 ? [1, 3, 3, 11, 13][gPos.x] : rndi(1, 14);
      const pos = calcPlayerCardPos(gPos);
      const tPos = vec(pos);
      const enemyplacing = false;
      return { num, pos, tPos, gPos, enemyplacing };
    });
    enemyCards = times(cardColumnCount * cardRowCount, (i) => {
      const gPos = vec(i % cardColumnCount, floor(i / cardColumnCount));
      const num = rndi(1, 14);
      const pos = calcEnemyCardPos(gPos);
      const tPos = vec(pos);
      const enemyplacing = true;
      return { num, pos, tPos, gPos, enemyplacing };
    });

    enemyPlacingCards = [];

    centerY = targetCenterY = 50;
    scoreBoxY = 50;

    playerPrevMoveIndex = enemyPrevMoveIndex = 0;
    enemyNextMoveIndex = undefined;
    enemyNextMoveTicks = 120;
    shuffleTicks = shuffleCount = 0;
    penaltyTicks = -1;
    multiplier = 1;
    playerCombo = 0; // Initialize player combo
    enemyCombo = 0; // Initialize enemy combo
  }
  shuffleTicks++;
  if (shuffleTicks > 60) { // after 60 update loops this happens
    let isPlacable = false;
    let isPlayerPlacable = false;
    for (let i = 0; i < cardColumnCount; i++) {
      const [pi, cn, ci] = checkPlacedIndex(
        i,
        playerPrevMoveIndex,
        playerCards
      );
      if (pi >= 0) {
        isPlacable = isPlacable = true;
        break;
      }
      const [epi, ecn, eci] = checkPlacedIndex(
        i,
        enemyPrevMoveIndex,
        enemyCards
      );
      if (epi >= 0) {
        isPlacable = true;
        break;
      }
    } // defines whether cards are playable and if the player has them in their hand
    if (!isPlayerPlacable) { // if the player cannot place a card, the enemy moves quicker
      enemyNextMoveTicks *= 0.3;
    }
    shuffleCount++;
    if (!isPlacable || shuffleCount > 2) { // shuffles the deck if the player cannot play or if nothing has happened in 120 ticks.
      play("powerUp"); // X //
      placedCards.forEach((c) => {
        c.tPos.x = c.pos.x < 50 ? -50 : 150;
      }); // removes cards
      placedCardNumbers = times(2, () => rndi(1, 14)); //
      placedCardNumbers.forEach((n, i) => {// shuffling
        placedCards.push({
          num: n,
          pos: vec(i === 0 ? -5 : 105, 0),
          tPos: vec(calcPlacedCardX(i), 0),
          enemyplacing: false,
        });
      }); // adds new cards
      shuffleCount = 0; // resets the shufflecount 
    }
    shuffleTicks = 0; // resets shuffleticks
  }
  let pci = floor((input.pos.x - 50) / cardIntervalX + cardColumnCount / 2); // finds player card index depending on location of click on screen
  if(keyPressed) {
    if(hitKey == "a"){
      pci = 0;
      playCard(0);

    };
    if(hitKey == "s"){
      pci = 1;
      playCard(1);

    };
    if(hitKey == "d"){
      pci = 2;
      playCard(2);

    };
    if(hitKey == "f"){
      pci = 3;
      playCard(3);

    };
    if(hitKey == " "){
      pci = 4;
      playCard(4);
    }
    keyPressed = false;
  }
  else if (input.isJustPressed) {
    if (pci >= 0 && pci < cardColumnCount) {
      const pi = placeCard(pci, playerPrevMoveIndex, playerCards); // player prevmove starts at 0, pci is index of card played in playerCards
      if (pi < 0) { // pi is -1 if it is incorrect
        play("hit"); // X // play is a function that plays sound, hit is a negative sound
        penaltyIndex = pci; 
        penaltyTicks = 60; // X // // pushes player back by changing the center
        multiplier = 1; 
        shuffleTicks = shuffleCount = 0; 
        playerCombo = 0; // Reset player combo on incorrect move
        scoreBoxY += 5; // Move score box down to represent a hit
      } else { // played correctly
        play("coin"); // X //
        playerPrevMoveIndex = pi; // updates player prev move (for some reason)// changes the center (i think)
        addScore(multiplier, pi === 0 ? 8 : 92, centerY); // X // increases player score (built in to crisp)
        multiplier++; // X // increases the multiplier, which increases the score
        playerCombo++; // Increase player combo on correct move
        enemyCombo = 0; // Reset enemy combo when player plays
        scoreBoxY -= playerCombo; // Update score box position based on combo
        if (scoreBoxY <= 10) { // Check if score box reaches the top
          play("powerUp"); // Play a sound to indicate winning
          end("You Win!"); // End the game with a win message
        }
      }
    }
  }
  enemyNextMoveTicks--;
  if (enemyNextMoveTicks < 0) { // when the enemy is ready to move
    enemyNextMoveTicks = rnd(50, 70) / sqrt(difficulty); // defines when the enemy will move next
    if (enemyNextMoveIndex != null) { // if th
      const [pi, cn, ci] = checkPlacedIndex(
        enemyNextMoveIndex,
        enemyPrevMoveIndex,
        enemyCards
      );
      if (pi < 0) {
        enemyNextMoveTicks *= 3;
        enemyCombo = 0; // Reset enemy combo on incorrect move
      } else {
        play("select");
        placeCard(enemyNextMoveIndex, enemyPrevMoveIndex, enemyCards);
        enemyPrevMoveIndex = pi;
        multiplier = 1;
        enemyCombo++; // Increase enemy combo on correct move
        playerCombo = 0; // Reset player combo when enemy plays
        scoreBoxY += enemyCombo; // Score box moves down based on enemy combo
      }
    }
    enemyNextMoveIndex = undefined; // resets the next move
    let ni = rndi(cardColumnCount); // assigns ni to a random number between 1-5
    for (let i = 0; i < cardColumnCount; i++) { // idk what this does lmao
      const [pi, cn, ci] = checkPlacedIndex(ni, enemyPrevMoveIndex, enemyCards);
      if (pi >= 0) { // if the enemy has made a move
        if (pi !== enemyPrevMoveIndex) { 
          enemyNextMoveTicks *= 1.5;
        }
        enemyNextMoveIndex = ni;
        break;
      }
      ni = wrap(ni + 1, 0, cardColumnCount);
    }
  }
  centerY += (targetCenterY - centerY) * 0.1; // moves center //
  playerCards.forEach((c) => {
    movePos(c.pos, c.tPos, 0.2);
    const ec = c.gPos.y === 0 && c.gPos.x === pci ? "green" : undefined;
    drawCard(c.pos.x, c.pos.y + centerY, c.num, c.gPos.y, ec);
  });
  enemyCards.forEach((c) => {
    movePos(c.pos, c.tPos, 0.2);
    const ec =
      c.gPos.y === 0 && c.gPos.x === enemyNextMoveIndex ? "red" : undefined;
    drawCard(c.pos.x, c.pos.y + centerY, c.num, c.gPos.y, ec);
  });
  enemyPlacingCards.forEach((c) => {
    movePos(c.pos, c.tPos, 0.1);
    drawCard(c.pos.x, c.pos.y + centerY, c.num, 0);
    if (c.enemyplacing == true){
      if (c.pos.y == c.tPos.y && c.pos.x == c.tPos.x){
        placedCards.push({
          num: c.num,
          pos: c.pos,
          tPos: c.pos,
          enemyplacing: c.enemyplacing,
        });
        placedCardNumbers[c.pi] = c.cn;
        console.log("done")
        c.enemyplacing = false; 
      }
      
    }
  });
  placedCards.forEach((c) => {
    //console.log(c.enemyplacing);
    movePos(c.pos, c.tPos, 0.2);
    
    drawCard(c.pos.x, c.pos.y + centerY, c.num, 0);
  }); // moves center //
  if (placedCards.length > 19) {
    placedCards.shift();
  }
  if (penaltyTicks > 0) { // for animation purposes
    penaltyTicks--;
    color("red");
    text("X", calcCardX(penaltyIndex), centerY + 6);
    color("black");
  }
  if (targetCenterY < 16) {
    targetCenterY += (16 - targetCenterY) * 0.1;
  }
  if (scoreBoxY > 89) {
    play("explosion");
    end(); // causes player to lose the game when centerY > 94
  }

  function placeCard(idx, ppi, cards) {
    
    const [pi, cn, ci] = checkPlacedIndex(idx, ppi, cards); // card played index, player prevmove index and cards array gets passed to checkPlacedIndex
   
    
    if ( pi === -1) {
      return -1;
    }
    
    

    const c = cards.splice(ci, 1)[0];
    
    if (c.enemyplacing == true){
      enemyPlacingCards.push({
        num: c.num,
        pos: c.pos,
        tPos: vec(calcPlacedCardX(pi), 0),
        enemyplacing: c.enemyplacing ,
        pi: pi,
        cn: cn,
      })
      
    }
    
    else{
    placedCardNumbers[pi] = cn;
    placedCards.push({
      num: c.num,
      pos: c.pos,
      tPos: vec(calcPlacedCardX(pi), 0),
      enemyplacing: c.enemyplacing,
    });
      if(enemyPlacingCards.length > 0){
        enemyPlacingCards[0].tPos = vec(-10,10);
      }
    }
    cards.forEach((c) => {
      if (c.gPos.x === idx) {
        c.gPos.y--;
        c.tPos =
          cards === playerCards
            ? calcPlayerCardPos(c.gPos)
            : calcEnemyCardPos(c.gPos);
      }
    });
    const gPos = vec(idx, cardRowCount - 1);
    const pos =
      cards === playerCards ? calcPlayerCardPos(gPos) : calcEnemyCardPos(gPos); // moves cards depending on which player placed them
    const tPos = vec(pos); // tpos = vec(return value from calc||||cardPos)
    cards.push({ num: rndi(1, 14), pos, tPos, gPos });
    shuffleTicks = shuffleCount = 0;
    return pi;
  }

  function playCard(column) {
    if (column >= 0 && column < cardColumnCount) {
      const pi = placeCard(column, playerPrevMoveIndex, playerCards); // player prevmove starts at 0, pci is index of card played in playerCards
      if (pi < 0) { // pi is -1 if it is incorrect
        play("hit"); // X // play is a function that plays sound, hit is a negative sound
        penaltyIndex = column; 
        penaltyTicks = 60; // X //
        targetCenterY += 5; // pushes player back by changing the center
        multiplier = 1; 
        shuffleTicks = shuffleCount = 0; 
      } else { // played correctly
        play("coin"); // X //
        playerPrevMoveIndex = pi; // updates player prev move (for some reason)
        targetCenterY -= 5; // changes the center (i think)
        addScore(multiplier, pi === 0 ? 8 : 92, centerY); // X // increases player score (built in to crisp)
        multiplier++; // X // increases the multiplier, which increases the score
      }
    }
  }

  function checkPlacedIndex(idx, ppi, cards) {
    let cn;
    let ci;
    cards.forEach((c, i) => {
      if (c.gPos.y === 0 && c.gPos.x === idx) {
        cn = c.num;
        ci = i;
      }
    });
    let pi = -1;
    placedCardNumbers.forEach((c, i) => {
      if (
        (ppi === 1 || pi === -1) &&
        (cn === wrap(c - 1, 1, 14) || cn === wrap(c + 1, 1, 14))
      ) {
        pi = i;
      }
    });
    return [pi, cn, ci];
  }

  function drawCard(x, y, n, gy, edgeColor = undefined) {
    if (y < -5 || y > 105) {
      return;
    }
    const ec =
      edgeColor != null ? edgeColor : gy === 0 ? "black" : "light_black";
    color(ec);
    box(x, y, 9, 10);
    color("white");
    box(x, y, 7, 8);
    const nc = gy === 0 ? "black" : "light_black";
    color(nc);
    if (n === 10) {
      char("a", x, y);
    } else {
      text(numChars[n], x, y);
    }
  }

  function drawBar(){
    color("black");
    box(10,50,5,75);
  }
  function drawScoreBox(y){
    color("light_black");
    if(y == undefined){
      y = 50;
    }
    if(y > 90){
      y = 90;
    }
    if(y < 10){
      y = 10;
    }
    box(10,y,7,7);
  }

  function calcPlayerCardPos(p) {
    return vec(calcCardX(p.x), (p.y + 1) * 11);
  }

  function calcEnemyCardPos(p) {
    return vec(calcCardX(p.x), (p.y + 1) * -11);
  }

  function calcPlacedCardX(i) {
    return 50 + (i - 0.5) * 25;
  }

  function calcCardX(i) {
    return 50.5 + (i - cardColumnCount / 2 + 0.5) * cardIntervalX;
  }

  function movePos(p, tp, ratio) {
    p.add(vec(tp).sub(p).mul(ratio));
    if (p.distanceTo(tp) < 1) {
      p.set(tp);
      
    }
    
  }
}