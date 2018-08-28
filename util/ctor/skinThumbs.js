
/**
 * @classdesc Builds items thumbnails
 * @constructor 
 */
function SkinThumbs(skinTypes, skinBuilder) {
	var self = this;
	
	/**
	 * Creates thumbs list for owned items
	 * caller must creates canvases for them
	 */
	this.genAllThumbs = function(featureId) {
		var thumbs = [];
		var items = skinTypes.getFeature(featureId).items;
		for(var i=0; i<items.length; i++) {
			var item = items[i];
			var thumb = {
				id: new ItemId(featureId.type, featureId.key, i),
				canvasId: "thumb_" + canvasIdCounter,
				flippable:	item.flippable,
				cost: item.cost,
				item: item
			};
			thumbs.push(thumb);
			canvasIdCounter = (canvasIdCounter + 1) % 1000000;			
		}
		return thumbs;
	}
	
	this.buildThumbs = function(thumbs) {
		var maxTime = 30000;
		var delay = 50;
		function inner() {
			for(var i=0; i<thumbs.length; i++) {
				var dstCanvas = document.getElementById(thumbs[i].canvasId);
				if (dstCanvas == null) {
					maxTime -= delay;
					if (maxTime > 0)
						setTimeout(inner, delay);
					return;
				}
				if (dstCanvas.isDone)
					continue;
				buildThumb(dstCanvas, thumbs[i].id);
				dstCanvas.isDone = true;
			}
		}
		inner();
	}
	
	function buildThumb(dstCanvas, id) {
		var item = skinTypes.getItem(id);
		var scale = item.thumb ? item.thumb.scale : 2;
		skinBuilder.build(id, function(result) {
			var canvas = result.canvas;
			if (canvas) {
				dstCanvas.width = canvas.width * scale;
				dstCanvas.height = canvas.height * scale;
				var dstCtx = dstCanvas.getContext('2d');
				dstCtx.clearRect(0, 0, dstCanvas.width, dstCanvas.height);
				dstCtx.imageSmoothingEnabled = false;
				dstCtx.webkitImageSmoothingEnabled = false;
				dstCtx.mozImageSmoothingEnabled = false;
				dstCtx.drawImage(canvas, 
					0, 0, canvas.width, canvas.height,
					0, 0, dstCanvas.width, dstCanvas.height);
			}
		});
	}
	
	var canvasIdCounter = Math.floor(1000000 * Math.random());
	var self = this;
}

// SkinThumbs extends SkinBuilder
SkinThumbs.prototype = Object.create(SkinGraphics.prototype);
SkinThumbs.prototype.constructor = SkinThumbs; 