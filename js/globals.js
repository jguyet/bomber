var layer0, layer1;
var ctx0, ctx1;
var fosfo0, fosfo1;
//nombre de bloc a afficher longueur width / bloc_size
//nombre de bloc a afficher hauteur height / bloc_size
var BLOCSIZE = 32;

var SCREENWIDTH = 100000;
var SCREENHEIGHT = 100000;
var MOUSEPOS = [0,0];
var SIZE = 1;
var keyState = [0];

//websocket
var socket = null;
//worldmap
var world = null;
//players
var players = [];
var currentPlayer = null;
//bombs
var bombs = [];
var NBOMBS = 1;
var NBOMBMAX = 1;

//lobby
var playerNickname = '';
var playerSkinId = 0;

// Round state
var roundState = 'waiting'; // 'waiting' | 'active' | 'ended'
var roundTimeRemaining = 0;
var roundWinner = null; // { id, nickname }
var roundResults = []; // [{ id, nickname, kills, deaths }, ...]

// Scoreboard
var scoreboardData = []; // [{ id, nickname, kills, deaths }, ...]

// Kill feed
var killFeed = []; // [{ killerId, killerNick, victimId, victimNick, time }, ...]

// Spectator
var isSpectating = false;