window.sprites.version=8
function loadSprites() {
var sprites = window.sprites

sprites.add([{name: "perks-atlas", filename: "perks.png", frameWidth: 320, frameHeight: 192},
{
	name: "perks-bar", atlas: "perks-atlas", frameWidth: 300, frameHeight:43
},
{
	name: "perks",
	group: true,
	atlas: "perks-atlas",
	x: 0,
	y: 64,
	frameWidth: 32, 
	rows: [
		["slot-empty", "slot-locked", "slot-number", "slot-amount", "slot-unknown", "slot-add"],
		["generic", "autoshield", "immune", "premium", "starter", "autojetpack", "money1", "bombs1", "diamond_mimic", 
		 {name: "money2", col: 6}, {name: "bombs2", col: 7}],
		["power1", "scate1", "immune_nyan", "immune_screen", "immune_slow", "immune_invis", "atomic1", "atomic2",
		 {name: "power2", col: 0}, {name: "scate2", col: 1}, {name: "infect_nyan", col: 2}, {name: "infect_fastexp", col: 3}, {name: "infect_small", col: 4}, {name: "infect_invis", col: 5}],
		["battle1", "pumpkin_bomb", "mine_bomb", {name: "mine_bomb_c", col: 9}]
	]
}])

//items.js

sprites.add({
	name: "items",
	group: true,
	filename: "items.png",
	frameWidth: 32,
	rows: [
		["bomb", "detonator"],
		["power", "bomb_super", "atomic"],
		["scate", "kick", "bat"],
		["shield", "heart", "surprise"],
		["random", "disease", "jelly"],
		["jetpack"],
		[],
		["silver", "gold", "diamond"],
		["muffin", "key", "plutonium"]
	]
})

//icons-hud.js

sprites.add([
	{
		name: "icons-hud", filename: "icons-hud.png", frameWidth: 340, frameHeight: 140
	},
	{
		atlas: "icons-hud", name: "font", frameWidth: 10, frameHeight: 10, frames: [
{x:0, y:140},{x:10, y:140},{x:20, y:140},{x:30, y:140},{x:40, y:140},{x:50, y:140},{x:60, y:140},{x:70, y:140},{x:80, y:140},{x:90, y:140},{x:100, y:140}
	]
	},
	{
		name: "icons",
		group: true,
		atlas: "icons-hud",
		x: 0,
		y: 0,
		frameWidth: 20, 
		frameHeight: 20,
		rows: [
		    ["generic"], 
			["money", "kills", "plutonium", {name: "medals", frameCount: 3}, "kills_player", "kills_mob", "kills_bot", "fun"],
			["players", "time", "coords", "slowmo", {name: "ping", frameCount: 4}],
			[{name: "bomb", frameCount: 17}, {name: "detonator", col: 2}],
			[{name: "power", frameCount: 3}, {name:"scate", frameCount:2}, {name: "bat", frameCount: 2}, {name: "bomb_super", col: 1}],
			["disease", "atomic", "kick", "jelly", "heart", "shield", "key", "jetpack", "diamond_mimic", "infect_nyan", "infect_fastexp", "infect_small", "infect_invis"],
			["autoshield", "immune", "premium", "starter", "autojetpack", "money1", "bombs1", "power1", "team_capture", "pumpkin_bomb", "football_goals","suicides", "deaths"]
		]	
	},
	{
		name: "glyph",
		group: true,
		atlas: "icons-hud",
		x: 0,
		y: 160,
		frameWidth:9,
		frameHeight:9,
		rows: [["dots", "skull", "bomb"]]
	},
	{
		name: "main",
		group: true,
		atlas: "icons-hud",
		x: 0,
		y: 169,
		frameWidth:32,
		frameHeight:32,
		rows: [["bomb", "power", "scate", "bat"]]
	},
	{
		name: "btn_shift",
		atlas: "icons-hud",
		x: 0,
		y: 201,
		frameWidth:64,
		frameHeight:24
	},
	{
		name: "hpbar",
		atlas: "icons-hud",
		frameWidth: 27,
		frameHeight: 6,
		frames: [{x:30, y:162}, {x:58, y:162}, {x:86, y:162}, {x:114, y:162}]
	}
])	

sprites.add([
    {
    	name: "blast", filename: "blast.png", frameWidth: 32,
    	group: true,
    	rows: [
    	    [{name: "blast-0", frameCount: 9}],
    	    [{name: "blast-1", frameCount: 9}],
    	    [{name: "blast-2", frameCount: 9}],
    	    [{name: "blast-3", frameCount: 9}],
    	    [{name: "blast-4", frameCount: 9}],
    	    [{name: "blast-5", frameCount: 9}],
    	    [{name: "blast-6", frameCount: 9}]
    	]
    }
])

sprites.add([
    {
    	name: "turret", filename: "turret.png", frameWidth: 32,
    	group: true,
    	rows: [
    	    [{name: "0", frameCount: 8, renderShiftY: -3}]
    	]
    }
])

sprites.add([
	{
		name: "atlas-teambar", filename: "teambar.png", frameWidth:192, frameHeight:21
	},   
    {
		name: 'teambar-red', atlas:'atlas-teambar',frameWidth: 5,frameHeight:21,
        frames: [{x:36,y:0},{x:41,y:0},{x:46,y:0},{x:51,y:0},{x:56,y:0},{x:61,y:0}]
    },
    {
		name: 'teambar-blue', atlas:'atlas-teambar',frameWidth: 5,frameHeight:21,
        frames: [{x:66,y:0},{x:71,y:0},{x:76,y:0},{x:81,y:0},{x:86,y:0},{x:91,y:0}]
    },
    {
		name: 'teambar-yellow', atlas:'atlas-teambar',frameWidth: 5,frameHeight:21,
        frames: [{x:96,y:0},{x:101,y:0},{x:106,y:0},{x:111,y:0},{x:116,y:0},{x:121,y:0}]
    },
    {
		name: 'teambar-purple', atlas:'atlas-teambar',frameWidth: 5,frameHeight:21,
        frames: [{x:126,y:0},{x:131,y:0},{x:136,y:0},{x:141,y:0},{x:146,y:0},{x:151,y:0}]
    },
    {
		name: 'teambar-edges', atlas:'atlas-teambar',frameWidth: 36,frameHeight:21,
        frames: [{x:0,y:00},{x:161,y:0}]
    }
])

sprites.add([
	{
		name: "atlas-hud", filename: "hud.png", frameWidth:156, frameHeight:113
	},   
    {
		name: 'hud-circle', atlas:'atlas-hud',frameWidth: 52,frameHeight:52,
        frames: [{x:0,y:0},{x:52,y:0},{x:104,y:0}]
    },
    {
		name: 'hud-underscore', atlas:'atlas-hud',frameWidth: 3,frameHeight:34,
        frames: [{x:0,y:55},{x:3,y:55},{x:6,y:55}]
    },
    {
		name: 'hud-slot', atlas:'atlas-hud',frameWidth: 32,frameHeight:32,
        frames: [{x:12,y:56},{x:44,y:56}]
    },
    {
		name: 'hud-border', atlas:'atlas-hud',frameWidth: 8,frameHeight:8,
        frames: [{x:0,y:89},{x:8,y:89},{x:16,y:89},{x:0,y:97},{x:8,y:97},{x:16,y:97},{x:0,y:105},{x:8,y:105},{x:16,y:105}]
    },
    {
		name: 'hud-hide', atlas:'atlas-hud',frameWidth: 7,frameHeight:23,
        frames: [{x:28,y:90},{x:35,y:90}]
    }
])

sprites.add(
	{
		name: "quest-icons", filename: "questicons.png",
		group: true,
		frameWidth: 50, frameHeight: 50,
        rows: [["frame", "unknown", "walk", "bomb", "crush", "kill"],
               ["destroy", "mine"]]
	}
)


sprites.add([{
	filename: "mine.png",
	name: "mine",
	skin: {
		frameWidth: 64,
		renderWidth: 32,
		animCount: 6,
		renderShiftY: 4,  //HACK!!!
		rolls: true
	}
}, {
	filename: "color_bombs_64x64_strip32.png",
	name: "bomb_skin",
	frameWidth: 64,
	renderWidth: 32,
	renderShiftY: 0,
	frames: [{x:0, y:0},{x:64, y:0},{x:128, y:0},{x:192, y:0},{x:256, y:0},{x:320, y:0},{x:384, y:0},{x:448, y:0},{x:512, y:0},{x:576, y:0},{x:640, y:0},{x:704, y:0},{x:768, y:0},{x:832, y:0},{x:896, y:0},{x:960, y:0},{x:1024, y:0},{x:1088, y:0},{x:1152, y:0},{x:1216, y:0},{x:1280, y:0},{x:1344, y:0},{x:1408, y:0},{x:1472, y:0},{x:1536, y:0},{x:1600, y:0},{x:1664, y:0},{x:1728, y:0},{x:1792, y:0},{x:1856, y:0},{x:1920, y:0}]
}, {
	filename: "bomb_white_and_black_strip26.png",
	name: "bomb_skin2",
	frameWidth: 48,
	renderWidth: 24,
	renderShiftY: 0,
	frames: [{x:0, y:0},{x:48, y:0},{x:96, y:0},{x:144, y:0},{x:192, y:0},{x:240, y:0},{x:288, y:0},{x:336, y:0},{x:384, y:0},{x:432, y:0},{x:480, y:0},{x:528, y:0},{x:576, y:0},{x:624, y:0},{x:672, y:0},{x:720, y:0},{x:768, y:0},{x:816, y:0},{x:864, y:0},{x:912, y:0},{x:960, y:0},{x:1008, y:0},{x:1056, y:0},{x:1104, y:0},{x:1152, y:0},{x:1200, y:0}]
}])
//all.js
sprites.add([
	{
		name: "atlas", filename: "atlas5.png", frameWidth:512, frameHeight:512
	},   
    {
		name: 'signs', atlas:'atlas',frameWidth: 16,
        frames: [{x:74,y:300},{x:92,y:300},{x:110,y:300},{x:128,y:300},{x:146,y:300},{x:164,y:300},{x:182,y:300},{x:200,y:300},{x:218,y:300},{x:236,y:300},{x:254,y:300},{x:272,y:300},{x:290,y:300},{x:308,y:300},{x:326,y:300},{x:344,y:300},{x:362,y:300},{x:380,y:300}]
    },
    {
		name: 'arrows', atlas:'atlas',frameWidth: 16,
        frames: [{x:464,y:0},{x:480,y:0},{x:496,y:0},{x:464,y:16},{x:480,y:16},{x:496,y:16}]
    },
    {
		name: 'ball', atlas:'atlas',frameWidth: 64, renderWidth: 32,
        frames: [{x:2,y:2},{x:68,y:2}]
    },
	{
		name: 'bomb', atlas:'atlas', frameWidth: 64, renderWidth: 32, renderShiftY: -2,
		frames: [{x:134,y:2},{x:200,y:2},{x:266,y:2},{x:332,y:2},{x:398,y:2},{x:2,y:68},{x:68,y:68},{x:134,y:68},{x:200,y:68},{x:266,y:68},{x:332,y:68},{x:398,y:68},{x:2,y:134},{x:68,y:134},{x:134,y:134},{x:200,y:134},{x:266,y:134},{x:332,y:134},{x:398,y:134},{x:2,y:200},{x:68,y:200},{x:134,y:200},{x:2,y:368},{x:68,y:368},{x:134,y:368},{x:200,y:368}]
    },
	{
		name: 'pumpkin_bomb', atlas:'atlas', frameWidth: 32,
		frames: [{x:0,y:434},{x:32,y:434}, {x:32, y:480}]
    },
	{
		name: 'slime_bomb', atlas:'atlas', frameWidth: 32,
		frames: [{x:384,y:384}]
    },
	{
		name: 'big_arrow', atlas:'atlas', frameWidth: 36,
		frames: [{x:468,y:152}]
    },
	{
		name: 'sweets', atlas:'atlas', frameWidth: 20,
		frames: [{x:64,y:434},{x:84,y:434},{x:104,y:434},{x:124,y:434},{x:144,y:434},{x:164,y:434},{x:184,y:434}]
    },
    {
		name: 'snowball', atlas:'atlas', frameWidth: 32, frameHeight: 34, renderShiftY: 1,
		frames: [{x:272,y:384},{x:304,y:384},{x:336,y:384}]
    },
	{
		name: 'smoke', atlas:'atlas', frameWidth: 32, 
		frames: [{x:398,y:300},{x:432,y:300},{x:466,y:300},{x:2,y:334},{x:36,y:334},{x:70,y:334},{x:104,y:334},{x:138,y:334}]
	},
	{
		name: 'stun', atlas:'atlas', frameWidth: 32, 
		frames: [{x:470,y:40},{x:470,y:72},{x:470,y:104}]
	},
    {
		name: "explosion", frameWidth: 32, colors: 1
	},
	{
		name: "regen", frameWidth: 32, frames: [{x:0, y:0}, {x:32, y:0},{x:64, y:0},{x:96, y:0},{x:128, y:0},{x:160, y:0}]
	},
	{
		name: "stars", frameWidth: 128, glRepeat: true
	},
	{
		name: "shield", frameWidth: 47
	},
	{
		name: "langolier", filename:"monsters/langolier.png", skin: { frameWidth: 64, renderWidth: 32, alwaysRun: true }
	},
	{
		name: "mimic_1", filename:"monsters/mimic_1.png", skin: { frameWidth: 34, animSpeed: 1500, idleAnimSpeed: 2000, idleAnim: true }
	},
	{
		name: "mimic_3", filename:"monsters/mimic_3.png", skin: { frameWidth: 34, animSpeed: 1500, idleAnimSpeed: 2000, idleAnim: true }
	},
	{
		name: "robot", filename:"monsters/robot.png", skin: { frameWidth: 34, animSpeed: 1500, idleAnimSpeed: 2000,  idleAnim: true }
	},
	{
		name: "orb", filename:"monsters/orb.png", skin: { frameWidth: 34, animSpeed: 1500, idleAnimSpeed: 2000, idleAnim: true }
	},
	{
		name: "jelly", filename:"monsters/jelly.png", skin: { frameWidth: 34, animSpeed: 1500, idleAnimSpeed: 2000, idleAnim: true }
	},
	{
		name: "splash", frameWidth: 640, frameHeight:380
	}
])

//spines
sprites.add({
	name: "arrowtest",
	path: "spine/",
	filename: "skeleton.png",
	spine: {
		atlasFilename: "skeleton.atlas",
		skeletonFilename:  "skeleton.json",
		dirs: 4,
		scaleX: 0.5,
		scaleY: 0.5,
		dirRoots: ["up", "right", "down", "left"],
		anims: {
			"idle": { name: "idle" },
			"walk": { name: "idle" }
		}
	},
	skin: {
		frameWidth: 128,
		renderWidth: 128
		//nothing
	}
})

//skins.js
sprites.add([
	{
		filename: "character_silver.png",
		name: "default",
		skin: {
			frameWidth: 42,
			renderWidth: 42,
			animSpeed: 1600
		}
	}, 
	{
		filename: "character_gold.png",
		name: "default2",
		skin: {
			frameWidth: 42,
			renderWidth: 42,
			animSpeed: 1600
		}
	}, 
	{
		filename: "character_flying.png",
		name: "flying",
		skin: {
			frameWidth: 34,
			renderWidth: 34,
			alwaysRun: true
		}
	}, 
	{
		filename: "character_crawling.png",
		name: "slowpoke",
		skin: {
			frameWidth: 34,
			renderWidth: 34
		}
	}, 
	{
		filename: "character_jetpack.png",
		name: "jetpack",
		skin: {
			frameWidth: 34,
			renderWidth: 34,
			alwaysRun: true
		}
	}, 
	{
		filename: "nyan.png",
		name: "nyan",
		skin: {
			frameWidth: 34,
			renderWidth: 34,
			animCount: 6,
			alwaysRun: true
		}
	},
	{
		filename: "nyan_chest.png",
		name: "nyan_chest",
		skin: {
			frameWidth: 34,
			renderWidth: 34,
			animCount: 6,
			alwaysRun: true
		}
	}
])

//tileset.js

sprites.add({
	name: "tiles-winter",
	group: true,
	filename: "tileset-winter.png",
	frameWidth: 32,
	frameHeight: 32,
	border: 1,
	rows: [
		["grass1", "", "deep", "", "sand", "", "dirt"],
		[],
		[],
		["rocky1", "grass2", "grass3", "field", "hole1", "hole2", "hole3", "hole4"],
		["", "rocky_hole", "", "dirty_hole", "bridge_h", "bridge_v", "bridge_metal_v", "bridge_metal_h"],
		["tile", "tile2", "tile3", "tile4", "left", "up", "right", "down"],
		["button_off", "button_on", "bridge_off", "bridge_on", "tile_blue", "tile_red", "tile_yellow", "tile_purple"],
		["deep_default", "deep_bridge", "", "", "", ""],
		["rock3-plain", "rock3", "rock2-plain", "rock2", "rock1-plain", "rock1", "rock0-plain", "rock0"],
		["chest_in_rock-plain", "chest_in_rock", "silver2-plain", "silver2", "silver1-plain", "silver1", "silver0-plain", "silver0"],
		["tough9", "tough6", "gold2-plain", "gold2", "gold1-plain", "gold1", "gold0-plain", "gold0"],
		["tough4", "tough2", "diamond2-plain", "diamond2", "diamond1-plain", "diamond1", "diamond0-plain", "diamond0"],
		["wall6-plain", "wall6", "wall4-plain", "wall4", "wall2-plain", "wall2", "metal"],
		["brick-plain", "brick", "bush-plain", "bush", "box_block", "logs", "cactus", "well"],
		["chest", "gold_chest", "diamond_chest", "metal_chest", "portal1", "portal2", "portal3", "portal4"],
		["box1", "box_with_bombs", "goal", "wc", "prise1", "prise2", "prise3"],
		["gate_closed", "tunnel", "gate_opened", "red_chest", "", ""],
		["tube1", "tube2", "tube3", "tube4", "spike_off", "spike_on", "jumppad_off", "jumppad_on"],
		["flag_white", "flag_red", "flag_blue", "flag_yellow", "flag_purple", "walls-sn1", "walls-ew1"],
		["base-s", "base-es", "base-esw", "base-sw", "walls-s", "walls-es", "walls-esw", "walls-sw"],
		["base-sn", "base-esn", "base-eswn", "base-swn", "walls-sn", "walls-esn", "walls-eswn", "walls-swn"],
		["base-n", "base-en", "base-ewn", "base-wn", "walls-n", "walls-en", "walls-ewn", "walls-wn"],
		["base-e", "base-ew", "base-w", "base", "walls-e", "walls-ew", "walls-w", "walls"]
	]
})

sprites.add({
	name: "tiles",
	group: true,
	filename: "tileset.png",
	frameWidth: 32,
	frameHeight: 32,
	border: 1,
	rows: [
		["grass1", "", "deep", "", "sand", "", "dirt"],
		[],
		[],
		["rocky1", "grass2", "grass3", "field", "hole1", "hole2", "hole3", "hole4"],
		["", "rocky_hole", "", "dirty_hole", "bridge_h", "bridge_v", "bridge_metal_v", "bridge_metal_h"],
		["tile", "tile2", "tile3", "tile4", "left", "up", "right", "down"],
		["button_off", "button_on", "bridge_off", "bridge_on", "tile_blue", "tile_red", "tile_yellow", "tile_purple"],
		["deep_default", "deep_bridge", "", "", "skeleton", "well"],
		["rock3-plain", "rock3", "rock2-plain", "rock2", "rock1-plain", "rock1", "rock0-plain", "rock0"],
		["chest_in_rock-plain", "chest_in_rock", "silver2-plain", "silver2", "silver1-plain", "silver1", "silver0-plain", "silver0"],
		["tough9", "tough6", "gold2-plain", "gold2", "gold1-plain", "gold1", "gold0-plain", "gold0"],
		["tough4", "tough2", "diamond2-plain", "diamond2", "diamond1-plain", "diamond1", "diamond0-plain", "diamond0"],
		["wall6-plain", "wall6", "wall4-plain", "wall4", "wall2-plain", "wall2", "metal"],
		["brick-plain", "brick", "bush-plain", "bush", "box_block", "logs", "cactus"],
		["chest", "gold_chest", "diamond_chest", "metal_chest", "portal1", "portal2", "portal3", "portal4"],
		["box1", "box_with_bombs", "goal", "wc"],
		["gate_closed", "tunnel", "gate_opened", "red_chest"],
		["tube1", "tube2", "tube3", "tube4", "spike_off", "spike_on", "jumppad_off", "jumppad_on"],
		["flag_white", "flag_red", "flag_blue", "flag_yellow", "flag_purple", "walls-sn1", "walls-ew1"],
		["base-s", "base-es", "base-esw", "base-sw", "walls-s", "walls-es", "walls-esw", "walls-sw"],
		["base-sn", "base-esn", "base-eswn", "base-swn", "walls-sn", "walls-esn", "walls-eswn", "walls-swn"],
		["base-n", "base-en", "base-ewn", "base-wn", "walls-n", "walls-en", "walls-ewn", "walls-wn"],
		["base-e", "base-ew", "base-w", "base", "walls-e", "walls-ew", "walls-w", "walls"]
	]
})

sprites.add({
	name: "tiles-moon",
	group: true,
	filename: "tileset-moon.png",
	frameWidth: 32,
	frameHeight: 32,
	border: 1,
	rows: [
		["deep", "", "hexTile", "", "blueTile", "", "lava", "", "goo", ""],
		[],
		[],  
		["surf", "deep_default", "hexTile1", "hexTile2", "blueTile1", "blueTile2", "lava1", "lava2", "goo1", "goo2"],
		["surf1", "surf2", "bridge_v", "bridge_h", "surf_crater1", "surf_crater2", "boulder1", "boulder2", "boulder3"],
		["surf3", "surf4", "bridge_c", "", "surf_crater3", "surf_crater4", "surf_hole1", "surf_hole2", "surf_hole3", "surf_hole4"],		["walls-t0-s",  "walls-t0-es",  "walls-t0-esw", "walls-t0-sw"],
		["walls-t0-sn", "walls-t0-esn", "walls-t0-eswn","walls-t0-swn"],
		["walls-t0-n",  "walls-t0-en",  "walls-t0-ewn", "walls-t0-wn"],
		["walls-t0-e",  "walls-t0-ew",  "walls-t0-w",   "walls-t0"],
		["walls-t1-s",  "walls-t1-es",  "walls-t1-esw", "walls-t1-sw", "walls-t2-s", "walls-t2-es", "walls-t2-esw", "walls-t2-sw"],
		["walls-t1-sn", "walls-t1-esn", "walls-t1-eswn","walls-t1-swn","walls-t2-sn","walls-t2-esn","walls-t2-eswn","walls-t2-swn"],
		["walls-t1-n",  "walls-t1-en",  "walls-t1-ewn", "walls-t1-wn", "walls-t2-n", "walls-t2-en", "walls-t2-ewn", "walls-t2-wn"],
		["walls-t1-e",  "walls-t1-ew",  "walls-t1-w",   "walls-t1",    "walls-t2-e", "walls-t2-ew", "walls-t2-w",   "walls-t2"],
		["walls-t3-s",  "walls-t3-es",  "walls-t3-esw", "walls-t3-sw", "walls-t4-s", "walls-t4-es", "walls-t4-esw", "walls-t4-sw"],
		["walls-t3-sn", "walls-t3-esn", "walls-t3-eswn","walls-t3-swn","walls-t4-sn","walls-t4-esn","walls-t4-eswn","walls-t4-swn"],
		["walls-t3-n",  "walls-t3-en",  "walls-t3-ewn", "walls-t3-wn", "walls-t4-n", "walls-t4-en", "walls-t4-ewn", "walls-t4-wn"],
		["walls-t3-e",  "walls-t3-ew",  "walls-t3-w",   "walls-t3",    "walls-t4-e", "walls-t4-ew", "walls-t4-w",   "walls-t4"],        
		["tough9-t0", "tough9-t1", "tough9-t2", "tough9-t3", "tough9-t4",   "pit_off", "pit_on", "", "deep_bridge"],
		["tough6-t0", "tough6-t1", "tough6-t2", "tough6-t3", "tough6-t4",   "spikes_off", "spikes_on", "gate_closed", "tunnel", "gate_opened"],
		["tough3-t0", "tough3-t1", "tough3-t2", "tough3-t3", "tough3-t4",   "button_off", "button_on", "base"],
		["box-t0", "box-t1", "box-t2", "box-t3", "box-t4",                  "blueBrick-plain", "blueBrick"],
		["box4-t0", "box4-t1", "box4-t2", "box4-t3", "box4-t4",             "metal-plain", "metal"],
		["crystal3-t0", "crystal3-t1", "crystal3-t2", "crystal3-t3", "crystal3-t4", "brick-plain", "brick"],
		["crystal2-t0", "crystal2-t1", "crystal2-t2", "crystal2-t3", "crystal2-t4", "tubes_v", "tubes_h"],
		["crystal1-t0", "crystal1-t1", "crystal1-t2", "crystal1-t3", "crystal1-t4", "wc", "barrels"],
		["flag-t0", "flag-t1", "flag-t2", "flag-t3", "flag-t4", "", "box_with_bombs"],
		["rock3-plain", "rock3", "rock2-plain", "rock2", "rock1-plain", "rock1", "rock0-plain", "rock0"],
		["", "", "silver2-plain", "silver2", "silver1-plain", "silver1", "silver0-plain", "silver0"],
		["", "", "gold2-plain", "gold2", "gold1-plain", "gold1", "gold0-plain", "gold0"],
		["", "", "diamond2-plain", "diamond2", "diamond1-plain", "diamond1", "diamond0-plain", "diamond0"],        
	]
})

}