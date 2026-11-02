import MicroEvent from './MicroEvent';
import Rect from './Rect';

export default (function() {
	function pixelsEquivalent(pixels1, offset1, pixels2, offset2, tolerance) {
		if ( pixels1[offset1 + 3] <= tolerance && pixels2[offset2 + 3] <= tolerance ) {
			// if both are (nearly) transparent, they're the same
			return true;
		}
		// otherwise only true if all RGBA vals are within the tolerance
		for (var i = 4; i--;) if ( Math.abs( pixels1[offset1 + i] - pixels2[offset2 + i] ) > tolerance ) {
			return false;
		}
		return true;
	};
	
	function rectsOverlap(rect1, rect2) {
		return rect1.x < rect2.x + rect2.width && rect2.x < rect1.x + rect1.width &&
			rect1.y < rect2.y + rect2.height && rect2.y < rect1.y + rect1.height;
	}

	// merges rects until none overlap, so loose bits inside a sprite's bounds become part of it
	function mergeOverlappingRects(rects) {
		var merged = true;

		while (merged) {
			merged = false;
			rects = rects.reduce(function(result, rect) {
				var overlapping = result.find(function(other) { return rectsOverlap(rect, other); });

				if (overlapping) {
					var right = Math.max(overlapping.x + overlapping.width, rect.x + rect.width),
						bottom = Math.max(overlapping.y + overlapping.height, rect.y + rect.height);

					overlapping.x = Math.min(overlapping.x, rect.x);
					overlapping.y = Math.min(overlapping.y, rect.y);
					overlapping.width = right - overlapping.x;
					overlapping.height = bottom - overlapping.y;
					merged = true;
				}
				else {
					result.push(rect);
				}
				return result;
			}, []);
		}
		return rects;
	}

	// top to bottom, left to right. Rects starting above the bottom of a row's first rect are in that row
	function sortInReadingOrder(rects) {
		var rows = [];

		rects.slice().sort(function(a, b) { return a.y - b.y; }).forEach(function(rect) {
			var row = rows[rows.length - 1];

			if (row && rect.y < row.bottom) {
				row.rects.push(rect);
			}
			else {
				rows.push({ bottom: rect.y + rect.height, rects: [rect] });
			}
		});

		return rows.reduce(function(result, row) {
			return result.concat( row.rects.sort(function(a, b) { return a.x - b.x; }) );
		}, []);
	}

	function allArrayOrTrue(arr1, arr2) {
		for (var i = arr1.length; i--;) if ( !( arr1[i] || arr2[i] ) ) {
			return false;
		}
		return true;
	}
	
	function allArrayFalse(arr1) {
		for (var i = arr1.length; i--;) if ( arr1[i] ) {
			return false;
		}
		return true;
	}
	
	function SpriteCanvas() {
		var canvas = document.createElement('canvas');
		this.canvas = canvas;
		this._context = canvas.getContext('2d');
		this._bgData = [0, 0, 0, 0];
		// how far each RGBA channel can be from the bg and still count as bg
		this._tolerance = 10;
	}
	
	var SpriteCanvasProto = SpriteCanvas.prototype = new MicroEvent;
	
	SpriteCanvasProto.setImg = function(img) {
		var canvas = this.canvas,
			context = this._context;
		
		canvas.width = img.width;
		canvas.height = img.height;
		
		context.drawImage(img, 0, 0);

		this._img = img;
		this._pixels = null;
	};

	// pixels of the whole image, read once per image
	SpriteCanvasProto._getPixels = function() {
		if (!this._pixels) {
			this._pixels = this._context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
		}
		return this._pixels;
	};

	SpriteCanvasProto._isBgAt = function(pixels, x, y) {
		return pixelsEquivalent(this._bgData, 0, pixels, (y * this.canvas.width + x) * 4, this._tolerance);
	};

	// shrinks the rect to the sprite pixels inside it, its width & height are 0 if there are none
	SpriteCanvasProto.trimRectToContent = function(rect) {
		var pixels = this._getPixels(),
			left = Infinity,
			top = Infinity,
			right = -1,
			bottom = -1;

		for (var y = rect.y; y < rect.y + rect.height; y++) {
			for (var x = rect.x; x < rect.x + rect.width; x++) {
				if ( !this._isBgAt(pixels, x, y) ) {
					left = Math.min(left, x);
					top = Math.min(top, y);
					right = Math.max(right, x);
					bottom = Math.max(bottom, y);
				}
			}
		}

		if (right < 0) {
			return new Rect(rect.x, rect.y, 0, 0);
		}
		return new Rect(left, top, right - left + 1, bottom - top + 1);
	};

	// splits the image into columns x rows cells, skipping the ones with only bg pixels
	SpriteCanvasProto.getGridRects = function(columns, rows, trim) {
		var canvas = this.canvas,
			rects = [];

		for (var row = 0; row < rows; row++) {
			for (var column = 0; column < columns; column++) {
				var x = Math.round(column * canvas.width / columns),
					y = Math.round(row * canvas.height / rows),
					cell = new Rect(
						x, y,
						Math.round((column + 1) * canvas.width / columns) - x,
						Math.round((row + 1) * canvas.height / rows) - y
					),
					content = this.trimRectToContent(cell);

				if (content.width && content.height) {
					rects.push(trim ? content : cell);
				}
			}
		}
		return rects;
	};

	// finds the bounds of every group of touching sprite pixels (diagonals included)
	SpriteCanvasProto.findSprites = function() {
		var width = this.canvas.width,
			height = this.canvas.height,
			pixels = this._getPixels(),
			bg = this._bgData,
			tolerance = this._tolerance,
			// 0: bg, 1: sprite pixel, 2: sprite pixel already in a group
			state = new Uint8Array(width * height),
			rects = [];

		for (var i = 0; i < state.length; i++) {
			state[i] = pixelsEquivalent(bg, 0, pixels, i * 4, tolerance) ? 0 : 1;
		}

		for (var start = 0; start < state.length; start++) {
			if (state[start] !== 1) { continue; }

			var stack = [start],
				left = width, top = height, right = 0, bottom = 0;

			state[start] = 2;
			while (stack.length) {
				var index = stack.pop(),
					x = index % width,
					y = (index - x) / width;

				left = Math.min(left, x);
				top = Math.min(top, y);
				right = Math.max(right, x);
				bottom = Math.max(bottom, y);

				for (var ny = Math.max(y - 1, 0); ny <= Math.min(y + 1, height - 1); ny++) {
					for (var nx = Math.max(x - 1, 0); nx <= Math.min(x + 1, width - 1); nx++) {
						var neighbour = ny * width + nx;
						if (state[neighbour] === 1) {
							state[neighbour] = 2;
							stack.push(neighbour);
						}
					}
				}
			}
			rects.push( new Rect(left, top, right - left + 1, bottom - top + 1) );
		}

		return sortInReadingOrder( mergeOverlappingRects(rects) );
	};
	
	SpriteCanvasProto.setBg = function(pixelArr) {
		this._bgData = pixelArr;
	};
	
	SpriteCanvasProto.getBg = function() {
		return this._bgData;
	};

	SpriteCanvasProto.setTolerance = function(tolerance) {
		this._tolerance = tolerance;
	};

	SpriteCanvasProto.getTolerance = function() {
		return this._tolerance;
	};
	
	SpriteCanvasProto.trimBg = function(rect) {
		var edgeBgResult;
		
		rect = this._restrictRectToBoundry(rect);
		
		if (rect.width && rect.height) do {
			edgeBgResult = this._edgesAreBg(rect);
			rect = this._contractRect(rect, edgeBgResult);
		} while ( rect.height && rect.width && !allArrayFalse(edgeBgResult) );
		
		return rect;
	};
	
	SpriteCanvasProto._restrictRectToBoundry = function(rect) {
		var canvas = this.canvas,
			restrictedX = Math.min( Math.max(rect.x, 0), canvas.width ),
			restrictedY = Math.min( Math.max(rect.y, 0), canvas.height );
		
		if (restrictedX !== rect.x) {
			rect.width -= restrictedX - rect.x;
			rect.x = restrictedX;
		}
		if (restrictedY !== rect.y) {
			rect.height -= restrictedY - rect.y;
			rect.y = restrictedY;
		}
		rect.width  = Math.min(rect.width,  canvas.width - rect.x);
		rect.height = Math.min(rect.height, canvas.height - rect.y);
		return rect;
	}
	
	SpriteCanvasProto.expandToSpriteBoundry = function(rect, callback) {
		var edgeBgResult = this._edgesAreBg(rect),
			edgeBoundsResult = this._edgesAtBounds(rect);
			
		// expand
		while ( !allArrayOrTrue(edgeBgResult, edgeBoundsResult) ) {
			rect = this._expandRect(rect, edgeBgResult, edgeBoundsResult);
			edgeBgResult = this._edgesAreBg(rect);
			edgeBoundsResult = this._edgesAtBounds(rect);
			// callback(); // for debugging
		}
		
		// trim edges of bg
		rect = this._contractRect(rect, edgeBgResult);
		
		return rect;
	};
	
	SpriteCanvasProto._edgesAreBg = function(rect) {
		// look at the pixels around the edges
		var canvas = this.canvas,
			context = this._context,
			top    = context.getImageData(rect.x, rect.y, rect.width, 1).data,
			right  = context.getImageData(rect.x + rect.width - 1, rect.y, 1, rect.height).data,
			bottom = context.getImageData(rect.x, rect.y + rect.height - 1, rect.width, 1).data,
			left   = context.getImageData(rect.x, rect.y, 1, rect.height).data;
			
		
		return [
			this._pixelsContainOnlyBg(top),
			this._pixelsContainOnlyBg(right),
			this._pixelsContainOnlyBg(bottom),
			this._pixelsContainOnlyBg(left)
		];
	};
	
	SpriteCanvasProto._edgesAtBounds = function(rect) {
		var canvas = this.canvas;
		
		return [
			rect.y === 0,
			rect.x + rect.width === canvas.width,
			rect.y + rect.height === canvas.height,
			rect.x === 0
		];
	};
	
	SpriteCanvasProto._pixelsContainOnlyBg = function(pixels) {
		var bg = this._bgData,
			tolerance = this._tolerance;

		for (var i = 0, len = pixels.length; i < len; i += 4) {
			if ( !pixelsEquivalent(bg, 0, pixels, i, tolerance) ) {
				return false;
			}
		}
		return true;
	};
	
	SpriteCanvasProto._expandRect = function(rect, edgeBgResult, edgeBoundsResult) {
		if ( !edgeBgResult[0] && !edgeBoundsResult[0] ) {
			rect.y--;
			rect.height++;
		}
		if ( !edgeBgResult[1] && !edgeBoundsResult[1] ) {
			rect.width++;
		}
		if ( !edgeBgResult[2] && !edgeBoundsResult[2] ) {
			rect.height++;
		}
		if ( !edgeBgResult[3] && !edgeBoundsResult[3] ) {
			rect.x--;
			rect.width++;
		}
		
		return rect;
	};
	
	SpriteCanvasProto._contractRect = function(rect, edgeBgResult) {
		if ( edgeBgResult[0] && rect.height ) {
			rect.y++;
			rect.height--;
		}
		if ( edgeBgResult[1] && rect.width ) {
			rect.width--;
		}
		if ( edgeBgResult[2] && rect.height ) {
			rect.height--;
		}
		if ( edgeBgResult[3] && rect.width ) {
			rect.x++;
			rect.width--;
		}
		
		return rect;
	};
	
	return SpriteCanvas;
})();