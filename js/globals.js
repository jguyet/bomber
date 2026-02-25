var layer0, layer1;
var ctx0, ctx1;
var fosfo0, fosfo1;
//nombre de bloc a afficher longueur width / bloc_size
//nombre de bloc a afficher hauteur height / bloc_size
var BLOCSIZE = 32;
var MAP_WIDTH_PX = 40 * 32;   // 1280
var MAP_HEIGHT_PX = 22 * 32;  // 704
var cameraX = 0;
var cameraY = 0;

var SCREENWIDTH = window.innerWidth;
var SCREENHEIGHT = window.innerHeight;
var MOUSEPOS = [0,0];
var SIZE = 0;
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