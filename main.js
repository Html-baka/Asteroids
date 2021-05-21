const gameField = document.querySelector('#gameField');
const ctx = gameField.getContext("2d");
const fps = 30;
const showBounding = false; //show or hide collision bounding
const messageFading = 2; // message fading time in sec
const messageSize = 30; // text font size
const shipLives = 3; // game lives at start
let level, ship, asteroids, levelMessage, levelMessageTransp, lives, score;

// set spaceship class
class Ship {
   constructor() {
      this.size = 30; // ship size in pixels
      this.x = gameField.width / 2; 
      this.y = gameField.height / 2; 
      this.direction = 90 / 180 * Math.PI; // convert from degrees to radians
      this.rotation = 0; 
      this.canShoot = true;
      this.lasers = [];
      this.turnSpeed = 360; // turn speed in degrees per second
      this.movingForvard = false; 
      this.moveAcceleration = {
         x: 0,
         y: 0
      }; 
      this.invulnerability = 3;
      this.acceleration = 5; // acceleration of the ship in px per second
      this.slowdown = 0.4; 
      this.explodeDuration = 0.3; // ship explosion in seconds
      this.explodeTime = 0; 
      this.blinkDuration = 0.1; // ship blink duration aftrer explosion
      this.blinkNum = Math.ceil(this.invulnerability / this.blinkDuration ); 
      this.blinkTime = Math.ceil(this.blinkDuration * fps);
      this.laserExplodeDur = 0.1;  // laser explosion in seconds
      this.laserSpeed = 300; // speed of laser in px per sec
      // this.fireRate = params.fireRate; 
      this.dead = false;
   }
   exploding(){
      return this.explodeTime > 0;
   };
   blinkOn(){
     return ship.blinkNum % 2 == 0;
   };
   getShipRadius() {
      return this.size / 2
   };
   keyDown(e) {
      if (!ship.dead) {
         switch(e.keyCode) {
            case 32: // space bar - shoot
               ship.shootLaser();
               this.canShoot = false;
               break;
            case 37: //left arrrow (rotate ship left)
               ship.rotation = ship.turnSpeed / 180 * Math.PI / fps
               break;
            case 38: //up arrow (moving forward)
               ship.movingForvard = true;
               break;
            case 39: //left arrrow (rotate ship right)
               ship.rotation = -ship.turnSpeed / 180 * Math.PI / fps
               break;
            
         }
      } else {
         switch(e.keyCode) {
         case 89: //Y button
               if(ship.dead) {
                  newGame();
               }
               break
            case 78: //N button
            if(ship.dead) {
               if (confirm("Are you sure, you want to exit?")) {
                  close();
               }
            }
            break;
         }
      }
         
   };
   keyUp(e) {
         switch(e.keyCode) {
            case 32: // space bar - allow shooting again
               ship.canShoot = true;
               break;
            case 37: //left arrrow press -  stop rotating left
               ship.rotation = 0
               break;
            case 38: //up arrow press -stop moving forward
               ship.movingForvard = false;
               break;
            case 39: //left arrrow press - stop rotating right
               ship.rotation = 0
               break;
         }
   };
   returnShipImg(x, y, direction) {
      return (
         ctx.strokeStyle = 'white',
         ctx.lineWidth = 2,
         ctx.beginPath(),
         ctx.moveTo( // nose
            x + 4 / 3 * this.getShipRadius() * Math.cos(direction),
            y - 4 / 3 * this.getShipRadius() * Math.sin(direction)
         ),
         ctx.lineTo( //rear left
            x - this.getShipRadius() * (2 / 3 * Math.cos(direction) + Math.sin(direction)),
            y + this.getShipRadius() * (2 / 3 * Math.sin(direction) - Math.cos(direction))
         ),
         ctx.lineTo( //rear right
            x - this.getShipRadius() * (2 / 3 * Math.cos(direction) - Math.sin(direction)),
            y + this.getShipRadius() * (2 / 3 * Math.sin(direction) + Math.cos(direction))   
         ),
         ctx.closePath(),
         ctx.stroke()
      )
         
      
   }
   drawShip(){
         if (!this.exploding()) {
            if(this.blinkOn() && !ship.dead) {
               this.returnShipImg(this.x, this.y, this.direction)
            }
            if (ship.blinkNum > 0) {
               ship.blinkTime--;
               if (ship.blinkTime == 0) {
                  ship.blinkTime = Math.ceil(this.blinkDuration * fps);
                  ship.blinkNum--;
               }
            }
         } else {
            // draw the explosion
            ctx.fillStyle = "darkred";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getShipRadius() * 1.7, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getShipRadius() * 1.4, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getShipRadius() * 1.1, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getShipRadius() * 0.8, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getShipRadius() * 0.5, 0, Math.PI * 2, false);
            ctx.fill();
         }
   };
   accelerateShip(){
         if (this.movingForvard && !this.dead) {
            this.moveAcceleration.x += this.acceleration * Math.cos(this.direction) / fps;
            this.moveAcceleration.y -= this.acceleration * Math.sin(this.direction) / fps;
            //draw the flames
            if(!this.exploding() && this.blinkOn()) {
               ctx.strokeStyle = 'red';
               ctx.fillStyle = 'yellow';
               ctx.lineWidth = 1;
               ctx.beginPath();
               ctx.moveTo( // rear left
                  this.x - this.getShipRadius() * (2 / 3 * Math.cos(this.direction) + 0.5 * Math.sin(this.direction)),
                  this.y + this.getShipRadius() * (2 / 3 * Math.sin(this.direction) - 0.5 * Math.cos(this.direction))
               );
               ctx.lineTo( //behind the ship
                  this.x - this.getShipRadius() * 5 / 3 * Math.cos(this.direction),
                  this.y + this.getShipRadius() * 5 / 3 * Math.sin(this.direction)
               );
               ctx.lineTo( //rear right
                  this.x - this.getShipRadius() * (2 / 3 * Math.cos(this.direction) - 0.5 * Math.sin(this.direction)),
                  this.y + this.getShipRadius() * (2 / 3 * Math.sin(this.direction) + 0.5 * Math.cos(this.direction))   
               );
               ctx.closePath();
               ctx.fill();
               ctx.stroke();
            }
         } else { //slowdown the ship
            this.moveAcceleration.x -=this.slowdown * this.moveAcceleration.x / fps;
            this.moveAcceleration.y -=this.slowdown * this.moveAcceleration.y / fps ;
         }
   };
   moveShip(){
         if(!this.exploding()){
            this.x += this.moveAcceleration.x;
            this.y += this.moveAcceleration.y;
         }
   };
   rotateShip(){
      if(!this.exploding()){
         this.direction += this.rotation;
      }
   };
   moveScreenSides(){
         if (this.x < 0 - this.getShipRadius()){
            this.x = gameField.width + this.getShipRadius();
         } else if (this.x > gameField.width + this.getShipRadius()) {
            this.x = 0 - this.getShipRadius();
         }
         if (this.y < 0 - this.getShipRadius()){
            this.y = gameField.height + this.getShipRadius();
         } else if (this.y > gameField.height + this.getShipRadius()) {
            this.y = 0 - this.getShipRadius();
         }
   };
   asteroidCollisionCheck() {
      if(!this.exploding() && !ship.dead){
         if(ship.blinkNum == 0){
         for (let i = 0; i < asteroids.asteroidsArr.length; i++){
            if (asteroids.distanceBetweenPoints(this.x, this.y, asteroids.asteroidsArr[i].x, 
               asteroids.asteroidsArr[i].y) < this.getShipRadius() + asteroids.asteroidsArr[i].r) {
                  this.explodeShip();
                  asteroids.destroyAsteroid(i);
                  break; // for not going through the cycle while the ship is destroyed
               }
            }
         }
      }
   };
   explodeShip() {
      ship.explodeTime = Math.ceil(ship.explodeDuration * fps);
   };
   shootLaser() {
      //create laser obj
      if (this.canShoot){
         ship.lasers.push({ //from the nose of the ship
            x: this.x + 4 / 3 * this.getShipRadius() * Math.cos(this.direction),
            y: this.y - 4 / 3 * this.getShipRadius() * Math.sin(this.direction),
            xSpeed: this.laserSpeed * Math.cos(this.direction) / fps,
            ySpeed: -this.laserSpeed * Math.sin(this.direction) / fps,
            explodeTime: 0
         })
      }
   };
   drawLasers() { 
      for (let i = 0; i < ship.lasers.length; i++) {

         if(ship.lasers[i].explodeTime == 0) { // if no laser exploding - draw default laser
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, this.size / 15, 0, Math.PI * 2, false);
            ctx.fill()
         } else { 
            //draw the explosion
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.getShipRadius() * 0.99, 0, Math.PI * 2, false);
            ctx.fill()
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.getShipRadius() * 0.77, 0, Math.PI * 2, false);
            ctx.fill()
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.getShipRadius() * 0.55, 0, Math.PI * 2, false);
            ctx.fill()
            ctx.fillStyle = "pink";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.getShipRadius() * 0.33, 0, Math.PI * 2, false);
            ctx.fill()
         }
         
         
      }
   };
   moveLasers() {
      for (let i = ship.lasers.length - 1; i >= 0; i--) {
      if (ship.lasers[i].explodeTime > 0) {
         ship.lasers[i].explodeTime--;
         // destroy the laser after the durration is up
         if (ship.lasers[i].explodeTime == 0) {
            ship.lasers.splice(i, 1);
         }
      } else {
         //move the laser
            ship.lasers[i].x += ship.lasers[i].xSpeed
            ship.lasers[i].y += ship.lasers[i].ySpeed
      }
   }
   };
   drawLives() {
      for (let i = 0; i < lives; i++) {
         ship.returnShipImg(gameField.width - (ship.size + i * ship.size * 1.25) , ship.size, 0.5 * Math.PI); //
      }
   };
   displayLives() {  
      for (let i = 0; i < lives; i++) {
         this.drawLives();
      }
   };
}
// set asteroids class
class Asteroids {
   constructor() {
      this.asteroidsArr = [];
      this.asteroidsNumber = 1; //starting number of asteroids
      this.speed = 50; //max starting speed of asteroids in px per sec
      this.size = 80; // starting size of asteroids in px
      this.jag = 0.4; //jaggedness of the asteroids
      this.bigAstScore = 50; //score points for big asteroid
      this.smallAstScore = 100; //score points for small asteroid
   }
   createAsteroidBelt() {
      this.asteroidsArr = [];
      let x, y;
      for (let i = 0; i < this.asteroidsNumber + level; i++) {
         // random asteroid positioning, but not on spaceship
         do {
            x = Math.floor(Math.random() * gameField.width)
            y = Math.floor(Math.random() * gameField.height)
         } while (this.distanceBetweenPoints(ship.x, ship.y, x, y) < this.size * 2 + ship.getShipRadius());
         this.asteroidsArr.push(this.newAsteroid(x, y, Math.ceil(this.size / 2)));
      }
   };
   distanceBetweenPoints(x1, y1, x2, y2) {  
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
   };
   newAsteroid(x, y, r) {
      let levelUp = 1 + level * 0.1;
      const asteroid = {
         x: x,
         y: y,
         xSpeed: Math.random() * this.speed * levelUp / fps * (Math.random() < 0.5 ? 1 : -1),
         ySpeed: Math.random() * this.speed * levelUp / fps * (Math.random() < 0.5 ? 1 : -1),
         r: r,
         direction: Math.random() * Math.PI *2, // direction angle in radians
         sidesNumber: Math.floor((Math.random() * 9) + 6), //number of sides in asteroid
         offset: []
      }
      //create the vertex offsets array
      for (let i = 0; i < asteroid.sidesNumber; i++) {
         asteroid.offset.push(Math.random() * this.jag * 2 + 1 - this.jag)
      }
      return asteroid;
   };
   drawAsteroids() {
      let x, y, r, direction, sidesNumber, offset;
      for (let i = 0; i < this.asteroidsArr.length; i++) {
         ctx.strokeStyle = "slategrey";
         ctx.lineWidth = 2;
         // get the asteroid properties
            x = this.asteroidsArr[i].x;
            y = this.asteroidsArr[i].y;
            r = this.asteroidsArr[i].r;
            direction = this.asteroidsArr[i].direction;
            sidesNumber = this.asteroidsArr[i].sidesNumber;
            offset = this.asteroidsArr[i].offset;
         //draw a path
         ctx.beginPath();
         ctx.moveTo(
            x + r * offset[i] * Math.cos(direction),
            y + r * offset[i] * Math.sin(direction)
         )
         //draw the polygon
         for (let j = 1; j < sidesNumber; j++){
            ctx.lineTo(
               x + r * offset[j] * Math.cos(direction + j * Math.PI * 2 / sidesNumber),
               y + r * offset[j] * Math.sin(direction + j * Math.PI * 2 / sidesNumber),
            );
         }
         ctx.closePath();
         ctx.stroke();
      }
      for (let i = 0; i < this.asteroidsArr.length; i++) {
         //move the asteroids
         this.asteroidsArr[i].x += this.asteroidsArr[i].xSpeed;
         this.asteroidsArr[i].y += this.asteroidsArr[i].ySpeed;
         //handle edge of screen
         if (this.asteroidsArr[i].x < 0 - this.asteroidsArr[i].r) {
            this.asteroidsArr[i].x = gameField.width + this.asteroidsArr[i].r;
         } else if (this.asteroidsArr[i].x > gameField.width + this.asteroidsArr[i].r) {
            this.asteroidsArr[i].x = 0 - this.asteroidsArr[i].r
         }
         if (this.asteroidsArr[i].y < 0 - this.asteroidsArr[i].r) {
            this.asteroidsArr[i].y = gameField.height + this.asteroidsArr[i].r;
         } else if (this.asteroidsArr[i].y > gameField.height + this.asteroidsArr[i].r) {
            this.asteroidsArr[i].y = 0 - this.asteroidsArr[i].r
         }
      }
   };
   detectLaserHits() {
      let ax, ay, ar, lx, ly;
      for (let i = asteroids.asteroidsArr.length - 1; i >= 0; i--) {
         //grab the asteroid properties
         ax = asteroids.asteroidsArr[i].x;
         ay = asteroids.asteroidsArr[i].y;
         ar = asteroids.asteroidsArr[i].r;
         // loop over the lasers
         for (let j = ship.lasers.length - 1; j >= 0; j--) {
            //grab the laser properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;
            // detect hits
            if (ship.lasers[j].explodeTime == 0 && asteroids.distanceBetweenPoints(ax, ay, lx, ly) < ar) {
               
               //destroy the asteroid + activate the laser explosion
               asteroids.destroyAsteroid(i)
               ship.lasers[j].explodeTime = Math.ceil(ship.laserExplodeDur * fps)
               // asteroids.asteroidsArr.splice(i, 1);
               break;
            }
            
         }
      }
   };
   destroyAsteroid(i) {
      let x = this.asteroidsArr[i].x;
      let y = this.asteroidsArr[i].y;
      let r = this.asteroidsArr[i].r;

      //split the asteroid in 3
      if (r == Math.ceil(this.size / 2)) {
         this.asteroidsArr.push(this.newAsteroid(x, y, Math.ceil(this.size / 6)));
         this.asteroidsArr.push(this.newAsteroid(x, y, Math.ceil(this.size / 6)));
         this.asteroidsArr.push(this.newAsteroid(x, y, Math.ceil(this.size / 6)));
         score += this.bigAstScore;
      } else {
         score += this.smallAstScore;
      }
      //destroy the asteroid
      asteroids.asteroidsArr.splice(i, 1)

      // new level check if no asteroids left
      if (asteroids.asteroidsArr == 0) {
         level++;
         newLevel();
      }
   };
}

// new level message + asteroids speed and number boost
function newLevel() {
   levelMessage = "Level " + (level + 1);
   levelMessageTransp = 1.0;
   asteroids.createAsteroidBelt();
}
// new game function
function newGame() {
   level = 0;
   lives = shipLives;
   score = 0;
   ship = new Ship();
   asteroids = new Asteroids();
   newLevel();
}
//check if game is over
function checkForGameOver()  {
   if (ship.exploding()) {
      ship.explodeTime--;
      if (ship.explodeTime === 0) {
         lives--;
         if (lives === 0) {
            gameOver();
         } else {
            ship = new Ship();
         }
      } 
   }
};
// game over function
function gameOver() {
   ship.dead = true;
   levelMessage = "Game Over";
   levelMessageTransp = 1.0;
};
// print score
function scoreOutput() {
   ctx.textAlign = "left";
   ctx.textBaseline = "middle";
   ctx.fillStyle = `#fff`;
   ctx.font=`${messageSize}px sans-serif` ;
   ctx.fillText(score, gameField.width - (gameField.width - 0.5* ship.size), gameField.height - gameField.height + ship.size);
};
// window after ship explosion
function gameOverWindow() {
   //draw the window
   ctx.strokeStyle="#fff";
   ctx.fillStyle="rgba(0, 0, 0, 0.7)"
   ctx.beginPath();
   ctx.strokeRect(gameField.width / 4, gameField.height / 4, gameField.width / 2 , gameField.height / 2);
   ctx.fillRect(gameField.width / 4, gameField.height / 4, gameField.width / 2 , gameField.height / 2);
   ctx.fill();
   // ctx.stroke();

   levelMessage = `Your score is ${score}`;
   ctx.textAlign = "center";
   ctx.textBaseline = "middle";
   ctx.fillStyle = `rgba(255, 255, 255)`;
   ctx.font=`${gameField.width / 30}px sans-serif`;
   ctx.fillText(levelMessage, gameField.width / 2, gameField.height / 3);

   levelMessage = `Do you want to continue?`;
   ctx.textAlign = "center";
   ctx.textBaseline = "middle";
   ctx.fillStyle = `rgba(255, 255, 255)`;
   ctx.font=`${gameField.width / 40}px sans-serif`;
   ctx.fillText(levelMessage, gameField.width / 2, gameField.height / 2.3);
  
   levelMessage = `(Y/N)`;
   ctx.font=`${gameField.width / 20}px sans-serif`;
   ctx.fillText(levelMessage, gameField.width / 2, gameField.height / 1.8);
   
}
// newGame function call
newGame();
// Event handlers for moving/shooting ship
document.addEventListener("keydown", ship.keyDown);
document.addEventListener("keyup", ship.keyUp);

// rerender
setInterval(rerender, 1000 / fps);

function rerender () {
   //draw background
   ctx.fillStyle = "#000";
   ctx.fillRect(0, 0, gameField.width, gameField.height);
   //draw ship
   ship.drawShip();
   //accelerate the ship
   ship.accelerateShip();
   //move the ship
   ship.moveShip();
   //rotate the ship
   ship.rotateShip();
   //move into screen sides
   ship.moveScreenSides();
   // draw asteroids
   asteroids.drawAsteroids();
   ship.asteroidCollisionCheck();
   // draw lasers
   ship.drawLasers();
   ship.moveLasers();
   asteroids.detectLaserHits();
   //print level message
   if (levelMessageTransp >= 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(255, 255, 255, ${levelMessageTransp}`;
      ctx.font=`${messageSize}px sans-serif`;
      ctx.fillText(levelMessage, gameField.width / 2, gameField.height / 3);
      levelMessageTransp -= (1.0 / messageFading / fps);
   } else if (ship.dead) {
      gameOverWindow();
   }
   // display lives
   ship.displayLives()
   //display score
   scoreOutput();
   // check if the game is over of need to increment lives
   checkForGameOver();
}
