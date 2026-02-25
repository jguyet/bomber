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
var isFullSpectator = false; // True when joined as spectator (not from death)

// Room system
var currentRoomId = null;    // ID of the room the player is in
var currentRoomName = '';     // Name of current room
var isRoomCreator = false;    // Whether current player created the room
var roomPlayerList = [];      // Players in the waiting room [{ id, nickname, skinId }]

// Theme system
var currentTheme = 'default'; // Active theme: 'default' | 'winter' | 'moon'
var THEME_TILESETS = {
  'default': 'assets/maps/1.png',
  'winter': 'assets/maps/1-winter.png',
  'moon': 'assets/maps/tileset-moon.png'
};

// ─── Global Utilities ───────────────────────────────────────────────────────
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}