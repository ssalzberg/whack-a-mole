/*********************************************************************
* WhackAMole
* Author: Shaun Salzberg
*
* Displays UI and handles user interaction for a game of Whack a Mole.
* Be sure to:
*   - have the grass.png, hammer.png, hole.png, and mole.png image
*     files available at /assets/whack-a-mole
*   - have the whack-a-mole.css file available at /assets/whack-a-mole
*   - include the provided Whack-A-Mole HTML template in your DOM
* To initialize the Whack-A-Mole game, do:
*   var game = new WhackAMole.Game();
**********************************************************************/
var WhackAMole = {};

WhackAMole.Game = function() {
  // pick out dom components
  this.highscoreDisplay = $(WhackAMole.Game.DOM_CONTAINER + ".global-stat-bar .high-score .stat");
  this.difficultyDisplay = $(WhackAMole.Game.DOM_CONTAINER + ".global-stat-bar .difficulty .stat");
  this.molesWhackedDisplay = $(WhackAMole.Game.DOM_CONTAINER + ".whack-stat .stat");
  this.timeDisplay = $(WhackAMole.Game.DOM_CONTAINER + ".time-stat .stat");
  this.difficultyDisplays = $(WhackAMole.Game.DOM_CONTAINER +  ".hole.difficulty .text");
  
  // reset highscore to 0 (no memory between page refreshes)
  this.highscore = 0;
  this.molesWhacked = 0;
  this.updateHighscoreDisplay();
  
  // handles mole actions
  this.moleWrangler = new WhackAMole.MoleWrangler();
  
  // handles the mouse-following hammer
  this.hammer = new WhackAMole.Hammer();
  
  // sounds fx
  this.bgSound = document.getElementById("game");
  this.chooseDifficultySound = document.getElementById("choose_difficulty");
  this.buzzerSound = document.getElementById("buzzer");
  
  // let the user choose a difficulty level first
  this.chooseDifficulty();
}

// Shows UI to let the user choose Easy, Medium, Hard, or Very Hard
WhackAMole.Game.prototype.chooseDifficulty = function() {
  this.moleWrangler.showMolesAt([8,9,10,11]);
  this.difficultyDisplays.show();
  this.moleWrangler.setWhackedCallback(this.difficultyChosen.bind(this));
  this.chooseDifficultySound.play();
};

// Callback when difficulty level is chosen. Starts the game at that level.
WhackAMole.Game.prototype.difficultyChosen = function(mole,whichMole) {
  var difficulty = WhackAMole.Game.Difficulty[whichMole - 8];

  this.difficulty = difficulty.difficulty;  
  this.speed = difficulty.speed;
  this.totalTime = difficulty.totalTime;
  this.molesPerRound = difficulty.molesPerRound;
  
  this.moleWrangler.setDifficulty(difficulty);
  
  this.newGame();
};

// Starts a new game.
WhackAMole.Game.prototype.newGame = function() {
  // rest stats
  this.molesWhacked = 0;
  this.timeLeft = this.totalTime;
  this.difficultyDisplays.hide();
  
  // update displays
  this.difficultyDisplay.html(this.difficulty);
  this.updateMolesWhackedDisplay();
  this.updateTimeDisplay();

  // prep the mole wrangler
  this.moleWrangler.hideAll();
  this.moleWrangler.setWhackedCallback(this.moleWhacked.bind(this))
  
  // start the clock
  setTimeout(function() {
    this.counterInterval = setInterval(this.countDown.bind(this),1000);
  }.bind(this),WhackAMole.Game.START_DELAY);
  
  this.bgSound.play();
  
  // go!
  this.moleWrangler.startWrangling();
};

// Callback upon mole whacking
WhackAMole.Game.prototype.moleWhacked = function(e) {
  var mole = $(e.target);
  
  this.molesWhacked += 1;
  this.updateMolesWhackedDisplay();
}

// updates mole whacked stat display
WhackAMole.Game.prototype.updateMolesWhackedDisplay = function() {
  this.molesWhackedDisplay.html(this.formatStat(this.molesWhacked,3))
}

// updates time display
WhackAMole.Game.prototype.updateTimeDisplay = function() {
  this.timeDisplay.html(this.formatStat(this.timeLeft,2))
}

// updates highscore display 
WhackAMole.Game.prototype.updateHighscoreDisplay = function() {
  if(this.molesWhacked >= this.highscore) {
    this.highscore = this.molesWhacked;
    this.highscoreDisplay.html(this.formatStat(this.highscore,3));
  } 
}

// clock countdown. game is over when clock hits 0
WhackAMole.Game.prototype.countDown = function(e) {
  this.timeLeft -= 1;
  this.updateTimeDisplay();
  
  if( this.timeLeft == 0 )
    this.gameOver();
};

// game over
WhackAMole.Game.prototype.gameOver = function() {
  // stop the clock
  clearInterval(this.counterInterval);
  
  // stop the moles
  this.moleWrangler.stopWrangling();

  // update highscore if needed
  this.updateHighscoreDisplay();
  
  this.buzzerSound.play();
  this.bgSound.pause();
  this.bgSound.load();
  
  // let user choose difficulty for next game!
  setTimeout(this.chooseDifficulty.bind(this),2000);
}

// format a number with padded 0's
WhackAMole.Game.prototype.formatStat = function(stat, digits) {
  var res = stat.toString();
  while(res.length < digits)
    res = "0" + res;
  return res;
}

WhackAMole.Game.START_DELAY = 2200;

WhackAMole.Game.DOM_CONTAINER = ".whack-a-mole-container ";

WhackAMole.Game.Difficulty = [
  {
    difficulty: "EASY",
    speed: 5000,
    totalTime: 60,
    molesPerRound: 7
  },
  
  {
    difficulty: "MEDIUM",
    speed: 3000,
    totalTime: 50,
    molesPerRound: 5
  },
  
  {
    difficulty: "HARD",
    speed: 2000,
    totalTime: 40,
    molesPerRound: 4
  },
  
  {
    difficulty: "VERY HARD",
    speed: 1000,
    totalTime: 30,
    molesPerRound: 3
  }
];

/*****************************************************************
* WhackAMole.MoleWrangler
* Handles mole-related functionality for the game.
*****************************************************************/
WhackAMole.MoleWrangler = function() {
  // grab the moles from the dom
  this.moles = $(WhackAMole.Game.DOM_CONTAINER + ".mole");
  this.moles.each(function(i,mole) {
    $(mole).attr("index",i);
    $(mole).click(this.moleWhacked.bind(this));
  }.bind(this));
  
  this.molesWhackedThisRound = 0;
  this.setDifficulty(WhackAMole.Game.Difficulty[0]);
  
  this.whackedCallback = null;
  this.moleHideTimeout = null;
  
  this.isWrangling = false;
}

// set difficulty level (i.e. speed and number of moles)
WhackAMole.MoleWrangler.prototype.setDifficulty = function(difficulty) {
  this.speed = difficulty.speed;
  this.molesPerRound = difficulty.molesPerRound;
}

// hide all moles
WhackAMole.MoleWrangler.prototype.hideAll = function() {
  this.moles.hide();
}

// show moles at a list of indexes
WhackAMole.MoleWrangler.prototype.showMolesAt = function(indexes) {
  this.hideAll();
  
  $(indexes).each(function(i,index) {
    $(this.moles[index]).show();
  }.bind(this));
}

// set a function to receive a callback when a mole has been whacked
WhackAMole.MoleWrangler.prototype.setWhackedCallback = function(fn) {
  this.whackedCallback = fn;
};

// mole whacked callback
WhackAMole.MoleWrangler.prototype.moleWhacked = function(e) {
  var mole = $(e.target);
  var whichMole = parseInt(mole.attr("index"));
  mole.hide();
  
  this.molesWhackedThisRound += 1;
  
  if(this.isWrangling && (this.molesWhackedThisRound == this.molesPerRound))
    this.showMoleGroup();
  
  if(this.whackedCallback != null)
    this.whackedCallback(mole,whichMole);
}

// start showing some moles!
WhackAMole.MoleWrangler.prototype.startWrangling = function() {  
  this.stopWrangling();
  
  this.isWrangling = true;
  
  setTimeout(this.showMoleGroup.bind(this),WhackAMole.Game.START_DELAY);
}

// picks a set number of moles to display and hides them after
// a set time
WhackAMole.MoleWrangler.prototype.showMoleGroup = function() {  
  this.moles.hide();
  
  this.molesWhackedThisRound = 0;
  
  var moleIndexesChosen = [];
  
  while(moleIndexesChosen.length < this.molesPerRound) {
    var index = Math.floor((Math.random()*(this.moles.length)));
    if( moleIndexesChosen.indexOf(index) == -1 )
      moleIndexesChosen.push(index);
  }
  
  $(moleIndexesChosen).each(function(i,index) {
    $(this.moles[index]).show();
  }.bind(this));
  
  if( this.moleHideTimeout != null )
    clearTimeout(this.moleHideTimeout);
    
  this.moleHideTimeout = setTimeout(this.showMoleGroup.bind(this),this.speed);
}

// stop it with the moles already!
WhackAMole.MoleWrangler.prototype.stopWrangling = function() {  
  this.moles.hide();
  
  if( this.moleHideTimeout != null )
    clearTimeout(this.moleHideTimeout);
  
  this.isWrangling = false;
}

/*****************************************************************
* WhackAMole.Hammer
* Follows the user's mouse within the confines of the game's DOM
* container and handles the whacking animation.
*****************************************************************/
WhackAMole.Hammer = function() {
  this.hammer = $(WhackAMole.Game.DOM_CONTAINER + ".hammer");
  $(WhackAMole.Game.DOM_CONTAINER).mousemove(this.dragHammer.bind(this));
  $(WhackAMole.Game.DOM_CONTAINER).mousedown(this.animateHammer.bind(this));
  this.soundFX = document.getElementById("whacked");
}

WhackAMole.Hammer.prototype.dragHammer = function(e) {
    var mouseLeft = e.pageX;
    var mouseTop = e.pageY;
    this.hammer.css({
      left: mouseLeft + 1,
      top: mouseTop - 35
    });
    this.hammer.show();
};

WhackAMole.Hammer.prototype.animateHammer = function() {
  this.hammer.addClass("rotated");
  setTimeout(function() {
    this.hammer.removeClass("rotated")
  }.bind(this),200);
  this.soundFX.play();
}

