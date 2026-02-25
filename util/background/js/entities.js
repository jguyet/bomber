BackgroundApp.addModule({beforeStart:function(app) {
	app.addAssets([
	{
		name: 'player',
		density: 24,
		url: '/i/back/skins8bit.png',
		frameWidth: 50,
		renderWidth: 50,
		framesX: 1,
		framesY: 100,
		renderShiftY: -4
    },
	{
		name: "item",
		density: 64, 
		url: "/i/back/items.png",
		frameWidth: 32, 
		renderWidth: 32, 
		framesX: 3, 
		framesY: 7,
		prob: [10, 5, 0, 
			10, 5, 5, 
			10, 10, 10,
			10, 10, 10,
			10, 10, 10,
			5, 0, 0,
			0, 0, 0,
			3, 3, 3,
			1, 5, 1
			]
	},
	{
		name: "bomb",
		density: 64, 
		url: "/i/back/bomb_64x64_2.png", 
		frameWidth: 64, 
		renderWidth: 32, 
		framesX: 1, 
		framesY: 10,
		rndSize: true,
		rndSizeMin: 0.75,
		rndSizeMax: 1.25
	}
	])
}});