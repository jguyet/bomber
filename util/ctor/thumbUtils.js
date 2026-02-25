var MAX_CROP_LENGTH_PERCENT = 7;
var MAX_CROP_AREA_PERCENT = 0.5;

var SHOP_THUMB_SIZE = 72;
var SHOP_THUMB_CELL_SIZE = 36;

function getPublicFrame(skin) {
	return skin.publicFrame || [
		(skin.row ? skin.row[2] : 2) + (!skin.idleAnim ? 0 : skin.animMirrorLeft ? 3 : 4),
		skin.colStand != null ? skin.colStand :
			skin.idleCol ? skin.idleCol[0] :
			skin.col ? skin.col[0] :
			skin.animCount == 3 ? 1 : 0
	];
}

function calcThumbCrop(data, thumbSize) {
	// analyse  source
	var sumRow = new Uint16Array(data.height);
	var sumCol = new Uint16Array(data.width);
	var p = 3;	
	for(var i=0; i<data.height; i++) {
		for(var j=0; j<data.width; j++) {
			var v = data.data[p];
			if (v > 0) {
				sumRow[i] += v;
				sumCol[j] += v;
			}
			p += 4;
		}
	}

	// lossless crop
	var minX0 = 0, minY0 = 0, maxX0 = data.width-1, maxY0 = data.height-1;
	while(minX0+2 < maxX0 && sumCol[minX0]==0 && sumCol[maxX0]==0) {
		minX0++;
		maxX0--;
	}
	while(maxX0-minX0 >= thumbSize && sumCol[minX0]==0)
		minX0++;
	while(maxX0-minX0 >= thumbSize && sumCol[maxX0]==0)
		maxX0--;
		
	while(minY0+2 < maxY0 && sumRow[minY0]==0 && sumRow[maxY0]==0) {
		minY0++;
		maxY0--;
	}
	while(maxY0-minY0 >= thumbSize && sumRow[minY0]==0)
		minY0++;
	while(maxY0-minY0 >= thumbSize && sumRow[maxY0]==0)
		maxY0--;		
	
	var maxCropLength = ~~(MAX_CROP_LENGTH_PERCENT / 100 * (data.height + data.width) / 2);
	var maxCropArea = ~~(MAX_CROP_AREA_PERCENT / 100 * data.height * data.width * 255);
	
	// crop with losses
	var minX = minX0, minY = minY0, maxX = maxX0, maxY = maxY0;
	var cropL = 0, cropR = 0, sumL = 0, sumR = 0;
	while(maxX - minX >= thumbSize) {
		var sumTL = sumL + sumCol[minX];
		var sumTR = sumR + sumCol[maxX];
		if (cropR == maxCropLength || sumTR > maxCropArea ||
			cropL < maxCropLength && sumTL <= maxCropArea && sumTL < sumTR)
		{
			sumL = sumTL;
			if (sumL)
				cropL++;
			minX++;
		}else{
			sumR = sumTR;
			if (sumR)
				cropR++;
			maxX--;
		}
	}
	
	var cropU = 0, cropD = 0, sumU = 0, sumD = 0;
	while(maxY - minY >= thumbSize) {
		var sumTU = sumU + sumRow[minY];
		var sumTD = sumD + sumRow[maxY];
		if (cropD == maxCropLength || sumTD > maxCropArea ||
			cropU < maxCropLength && sumTU <= maxCropArea && sumTU < sumTD)
		{
			sumU = sumTU;
			if (sumU)
				cropU++;
			minY++;
		}else{
			sumD += sumTD;
			if (sumD)
				cropD++;
			maxY--;
		}
	}
	
	if (cropL > maxCropLength || sumL > maxCropArea || 
		cropU > maxCropLength || sumU > maxCropArea)
		return new Rect(minX0, minY0, maxX0-minX0+1, maxY0-minY0+1);		
	return new Rect(minX, minY, maxX-minX+1, maxY-minY+1);
}

function calcStrictThumbCrop(data, dataWidth) {
	// analyse  source
	var dataHeight = data.length / 4 / dataWidth;
	var sumRow = new Uint8Array(dataHeight);
	var sumCol = new Uint8Array(dataWidth);
	var p = 3;
	for(var i=0; i<dataHeight; i++) {
		for(var j=0; j<dataWidth; j++) {
			if (data[p])
				sumRow[i] = sumCol[j] = 1;
			p += 4;
		}
	}

	// lossless crop
	var minX0 = 0, minY0 = 0, maxX0 = dataWidth-1, maxY0 = dataHeight-1;
	while(!sumCol[minX0] && minX0 < maxX0) minX0++;
	while(!sumCol[maxX0] && minX0 < maxX0) maxX0--;
	while(!sumRow[minY0] && minY0 < maxY0) minY0++;
	while(!sumRow[maxY0] && minY0 < maxY0) maxY0--;	
	
	return {
		x: minX0,
		y: minY0,
		w: maxX0-minX0+1,
		h: maxY0-minY0+1
	}
}

function makeThumbForCanvas(srcCanvas, thumbSize) {
	if (srcCanvas.width==thumbSize && srcCanvas.height==thumbSize)
		return srcCanvas;
	
	var crop;
	if (Math.max(srcCanvas.width, srcCanvas.height) > thumbSize) {
		var srcImageData = srcCanvas.getContext('2d')
				.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
		crop = calcThumbCrop(srcImageData, thumbSize);
	}else
		crop = new Rect(0, 0, srcCanvas.width, srcCanvas.height);

	var dstW, dstH, dstX, dstY;
	if (crop.w <= thumbSize && crop.h <= thumbSize) {
		dstW = crop.w;
		dstH = crop.h;
		dstX = ~~((thumbSize - dstW) / 2);
		dstY = ~~((thumbSize - dstH) / 2);
	}else {
		if(crop.w > crop.h) {
			dstW = thumbSize;
			dstH = thumbSize / crop.w * crop.h;
		}else {
			dstH = thumbSize;
			dstW = thumbSize / crop.h * crop.w;
		}
		dstX = (thumbSize - dstW) / 2;
		dstY = (thumbSize - dstH) / 2;		
	}
	
	var canvas = createCanvas(thumbSize, thumbSize);
	canvas.getContext('2d').drawImage( srcCanvas, 
		crop.x, crop.y, crop.w, crop.h,
		dstX, dstY, dstW, dstH);
	return canvas;
}

function makeThumbForUrl(path, asset, thumbSize, onDone, onError) {
	var img = new Image();
	img.onload = function() {
		var skin = asset.skin || {}
		var w = skin.frameWidth || 32;
		var h = skin.frameHeight || w;
		var pf = getPublicFrame(skin);		
		var canvas = createCanvas(w, h);
		canvas.getContext('2d').drawImage(img, w*pf[1], h*pf[0], w, h, 0, 0, w, h);
		onDone( makeThumbForCanvas(canvas, thumbSize) );
	}
	img.onerror = onError;
	img.src = path + asset.filename;
}

function drawBigThumb(srcCanvas, srcCtx, srcWidth, srcHeight, renderWidth,
		dstCtx, dstSize, dstRow, srcX, srcY)
{
	dstRow = dstRow || 0;
	srcX = srcX | 0;
	srcY = srcY | 0;
	var srcData = srcCtx.getImageData(srcX, srcY, srcWidth, srcHeight).data;	
	var crop = calcStrictThumbCrop(srcData, srcWidth);
	
	// scale estimation
	var scale = renderWidth / srcWidth * (dstSize / SHOP_THUMB_CELL_SIZE);
	// try to make integer scale to improve quality
	var intScale = ~~Math.floor(scale + 0.5);
	if (scale <= intScale*1.1 && scale >= intScale*0.95) {
		scale = intScale;
	}
	
	// make it fit
	var maxScale = dstSize / Math.max(crop.w, crop.h);			
	scale = Math.min(maxScale, scale);			
	var rw = ~~(crop.w * scale);
	var rh = ~~(crop.h * scale);
	var yDown = ~~Math.min((dstSize - rh) / 2, dstSize/18);
	var y = dstSize - rh - yDown;
    
	var smoothing = scale != ~~scale;
	dstCtx.imageSmoothingEnabled = smoothing;
	dstCtx.webkitImageSmoothingEnabled = smoothing;
	dstCtx.mozImageSmoothingEnabled = smoothing;
	
    dstCtx.clearRect(
		0, dstRow * dstSize,
		dstSize, dstSize);
	dstCtx.drawImage(srcCanvas,
		srcX + crop.x, srcY + crop.y,
		crop.w, crop.h,
		(dstSize - rw) >> 1, y + dstRow * dstSize,
		rw, rh);
}

function makeBigThumbForCanvas(srcCanvas, renderWidth, thumbSize) {
	var canvas = createCanvas(thumbSize, thumbSize);
	drawBigThumb(srcCanvas, srcCanvas.getContext("2d"),
		srcCanvas.width, srcCanvas.height, renderWidth,
		canvas.getContext("2d"), thumbSize, 0);
	return canvas;
}

function calcShadow(srcCtx, srcX, srcY, srcWidth, srcHeight) {
    var minWidth = srcWidth * 0.4;
    var maxWidth = srcWidth * 0.8;
    var maxHeight = srcWidth * 0.2;
    var heightWidthRatio = 0.5;
    
    var analyzeHeight = ~~(srcHeight * 0.7);
    var dy = srcHeight - analyzeHeight;
    var srcData = srcCtx.getImageData(
            srcX, srcY + dy,
            srcWidth, analyzeHeight).data;
    var p = 3;
    var maxY = -1;
    var sumMinX = 0, sumMaxX = 0, countX = 0;
    for(var i=0; i<analyzeHeight; i++) {
        var maxX, minX = -1;
        for(var j=0; j<srcWidth; j++) {
            if (srcData[p] > 128) {
                maxY = i;
                if (minX < 0)
                    minX = j;
                maxX = j;
            }
            p += 4;
        }
        if (maxY == i) {
            sumMinX += minX;
            sumMaxX += maxX;
            countX++;
        }
    }
    var minX = sumMinX / countX;
    var maxX = sumMaxX / countX;
    var w = maxX - minX;
    if (w < minWidth)
        w = (w + minWidth) / 2;
    if (w > maxWidth)
        w = (w + maxWidth) / 2;
    var h = w * heightWidthRatio;
    if (h > maxHeight)
        h = (h + maxHeight) / 2;    
    return [
        ~~((minX + maxX) / 2),
        maxY + dy,
        ~~w,
        ~~h
    ]
}

function shadowStyle(meta) {
    if (undef(meta))
        return {};
    return {
        'left': '' + meta[0] + 'px',
        'top': '' + meta[1] + 'px',
        'width': '' + meta[2] + 'px',
        'height': '' + meta[3] + 'px'
    }
}

if (typeof exports != "undefined") {
	exports.SHOP_THUMB_SIZE = SHOP_THUMB_SIZE;
	exports.getPublicFrame = getPublicFrame;
	exports.drawBigThumb = drawBigThumb;
	exports.makeBigThumbForCanvas = makeBigThumbForCanvas;
	exports.makeThumbForUrl = makeThumbForUrl;
	exports.makeThumbForCanvas = makeThumbForCanvas;
    exports.calcShadow = calcShadow;
}