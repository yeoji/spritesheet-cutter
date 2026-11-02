import $ from 'jquery';

import MicroEvent from './MicroEvent';
import Rect from './Rect';
import { SHIFT_KEY, isKeyDown } from '../cutter/KeyboardEvents';
import SelectedSprite from './extension/SelectedSprite';
import ResizeHandles from './extension/ResizeHandles';

var ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];

var Highlight = (function() {
	function Highlight($appendTo, view) {
		this._$container = $('<div class="highlight"/>').appendTo( $appendTo );
		this._view = view;
	}

	var HighlightProto = Highlight.prototype;

	// rect is in canvas pixels, the highlight is scaled to the current zoom
	HighlightProto.moveTo = function(rect, animate) {
		var zoom = this._view.getZoom(),
			$container = this._$container.transitionStop(true),
			destination = {
				left: rect.x * zoom,
				top: rect.y * zoom,
				width: rect.width * zoom,
				height: rect.height * zoom,
				opacity: 1
			};
		
		
		if (rect.width && rect.height) {
			$container.css('display', 'block');
			
			if (animate) {
				$container.transition(destination, {
					duration: 200,
					easing: 'easeOutQuad'
				});
			}
			else {		
				$container.vendorCss(destination);				
			}
		}
		else {
			this.hide(animate);
		}
	};
	
	HighlightProto.hide = function(animate) {
		var $container = this._$container.transitionStop(true);
		
		if (animate) {
			var currentLeft = parseInt( $container.css('left') ),
				currentTop = parseInt( $container.css('top') );
			
			$container.transition({
				left: currentLeft + $container.width()  / 2,
				top:  currentTop  + $container.height() / 2,
				width: 0,
				height: 0,
				opacity: 0
			}, {
				duration: 200,
				easing: 'easeInQuad'
			});
		}
		else {
			$container.css('display', 'none');
		}
	};

	HighlightProto.remove = function() {
		this._$container.remove();
	}

	HighlightProto.append = function($elm) {
		$elm.appendTo(this._$container);
		return this;
	}
	
	HighlightProto.setHighVisOnDark = function(highVis) {
		this._$container[highVis ? 'addClass' : 'removeClass']('high-vis');
		return this;
	}
	
	return Highlight;
})();

var SelectColor = (function() {
	
	function SelectColor($eventArea, $canvas, view) {
		this._$eventArea = $eventArea;
		this._context = $canvas[0].getContext('2d');
		this._view = view;
		this._listeners = [];
	}
	
	var SelectColorProto = SelectColor.prototype = new MicroEvent;
	
	SelectColorProto.activate = function() {
		var selectColor = this,
			canvasX, canvasY,
			context = selectColor._context,
			$eventArea = selectColor._$eventArea;
		
		selectColor._listeners.push([
			$eventArea, 'mousedown', function(event) {
				if (event.button !== 0) { return; }
				var color = selectColor._getColourAtMouse(event.pageX, event.pageY);
				selectColor.trigger( 'select', color );
				event.preventDefault();
			}
		]);
		
		selectColor._listeners.push([
			$eventArea, 'mousemove', function(event) {
				var color = selectColor._getColourAtMouse(event.pageX, event.pageY);
				selectColor.trigger( 'move', color );
			}
		]);
		
		selectColor._listeners.forEach(function(set) {
			set[0].bind.apply( set[0], set.slice(1) );
		});
		
		return selectColor;
	};
	
	SelectColorProto.deactivate = function() {
		this._listeners.forEach(function(set) {
			set[0].unbind.apply( set[0], set.slice(1) );
		});
		
		return this;
	};
	
	SelectColorProto._getColourAtMouse = function(pageX, pageY) {
		var point = this._view.pagePointToCanvas(pageX, pageY);

		return this._context.getImageData(point.x, point.y, 1, 1).data;
	};
	
	return SelectColor;
})();

var SelectArea = (function() {
	function SelectArea($eventArea, highlight, view) {
		this._$eventArea = $eventArea;
		this._highlight = highlight;
		this._view = view;
		this._listeners = [];

		this.createListeners();
	}

	var SelectAreaProto = SelectArea.prototype = new MicroEvent;

	SelectAreaProto.createListeners = function() {
		var selectArea = this,
			view = selectArea._view,
			rect = new Rect(0, 0, 0, 0),
			start,
			isDragging,
			$document = $(document);

		selectArea._listeners.push([
			selectArea._$eventArea, 'mousedown', function(event) {
				if (event.button !== 0) { return; }
				start = view.pagePointToCanvas(event.pageX, event.pageY);
				rect = new Rect(start.x, start.y, 1, 1);

				selectArea._highlight.moveTo(rect);
				isDragging = true;
				event.preventDefault();
			}
		]);

		selectArea._listeners.push([
			$document, 'mousemove', function(event) {
				if (!isDragging) { return; }
				var point = view.pagePointToCanvas(event.pageX, event.pageY);

				rect.x = Math.min(start.x, point.x);
				rect.y = Math.min(start.y, point.y);
				rect.width = Math.abs(point.x - start.x) + 1;
				rect.height = Math.abs(point.y - start.y) + 1;
				selectArea._highlight.moveTo(rect);
			}
		]);
		
		selectArea._listeners.push([
			$document, 'mouseup', function(event) {
				if (!isDragging) { return; }
				isDragging = false;
				selectArea.trigger('select', rect);
				selectArea._highlight.hide();
			}
		]);
	}
	
	SelectAreaProto.activate = function() {
		var selectArea = this;
		
		selectArea._listeners.forEach(function(set) {
			set[0].bind.apply( set[0], set.slice(1) );
		});
		
		return selectArea;
	};
	
	SelectAreaProto.deactivate = function() {
		this._listeners.forEach(function(set) {
			set[0].unbind.apply( set[0], set.slice(1) );
		});
		
		return this;
	};
	
	return SelectArea;
})();

class SpriteCanvasView extends MicroEvent {
	constructor(spriteCanvas, $appendToElm) {
		super();
		var spriteCanvasView = this,
			$container = $('<div class="sprite-canvas-container"/>'),
			$canvas = $( spriteCanvas.canvas ).appendTo( $container ),
			// this cannot be $appendToElm, as browsers pick up clicks on scrollbars, some don't pick up mouseup http://code.google.com/p/chromium/issues/detail?id=14204#makechanges
			highlight = new Highlight($container, spriteCanvasView),
			selectArea = new SelectArea($container, highlight, spriteCanvasView),
			selectColor = new SelectColor($canvas, $canvas, spriteCanvasView),
			selectedSprites = [];

		this._zoom = 1;
		this._$canvas = $canvas;
		this._$container = $container;
		this._$bgElm = $appendToElm;
		this._spriteCanvas = spriteCanvas;
		this._highlight = highlight;
		this._selectArea = selectArea;
		this._selectColor = selectColor;
		this._selectedSprites = selectedSprites;
		this._resizeHandles = new ResizeHandles(spriteCanvasView);

		$container.appendTo($appendToElm);

		selectArea.bind('select', function (clickedRect) {
			var spriteRect = spriteCanvasView._findSpriteRect(clickedRect);

			if (spriteRect) {
				spriteCanvasView._handleSelectedSprite(clickedRect, spriteRect);
			} else {
				spriteCanvasView._unselectAllSprites();
			}
		});

		$container.on('contextmenu', function (event) {
			event.preventDefault();
			spriteCanvasView._exportAt(event.pageX, event.pageY);
		});

		selectColor.bind('select', function (color) {
			spriteCanvasView.trigger('bgColorSelect', color);
			spriteCanvas.setBg(color);
		});

		selectColor.bind('move', function (color) {
			spriteCanvasView.trigger('bgColorHover', color);
		});

		// ctrl + wheel (or pinch on a trackpad) zooms around the mouse
		$appendToElm.on('wheel', function (event) {
			if (!event.ctrlKey && !event.metaKey) { return; }
			var offset = $appendToElm.offset(),
				focusX = event.pageX - offset.left,
				focusY = event.pageY - offset.top;

			if (event.originalEvent.deltaY < 0) {
				spriteCanvasView.zoomIn(focusX, focusY);
			} else {
				spriteCanvasView.zoomOut(focusX, focusY);
			}
			event.preventDefault();
		});
	}
}

var SpriteCanvasViewProto = SpriteCanvasView.prototype;

// returns null if the clicked area only has bg pixels
SpriteCanvasViewProto._findSpriteRect = function(clickedRect) {
	var spriteCanvas = this._spriteCanvas,
		rect = Object.assign({}, clickedRect),
		trimmedRect = spriteCanvas.trimBg(rect);

	if (!trimmedRect.width || !trimmedRect.height) {
		return null;
	}
	return spriteCanvas.expandToSpriteBoundry(rect);
}

// right-click inside the selection exports it, anywhere else selects the sprite under the mouse first
SpriteCanvasViewProto._exportAt = function(pageX, pageY) {
	var point = this.pagePointToCanvas(pageX, pageY),
		clickedRect = new Rect(point.x, point.y, 1, 1),
		spriteRect,
		insideSelection = this._selectedSprites.some(({rect}) =>
			point.x >= rect.x && point.x < rect.x + rect.width &&
			point.y >= rect.y && point.y < rect.y + rect.height
		);

	if (!insideSelection) {
		spriteRect = this._findSpriteRect(clickedRect);
		if (!spriteRect) {
			return;
		}
		this._handleSelectedSprite(clickedRect, spriteRect);
	}
	this.trigger('exportRequest', this._selectedSprites);
}

SpriteCanvasViewProto._handleSelectedSprite = function(clickedRect, spriteRect) {
	if(isKeyDown(SHIFT_KEY)) {
		const alreadySelectedSpriteIndex = this._selectedSprites.findIndex(sprite => JSON.stringify(sprite.rect) == JSON.stringify(spriteRect));
		if(alreadySelectedSpriteIndex > -1) {
			this._selectedSprites[alreadySelectedSpriteIndex].unselect();
			this._selectedSprites.splice(alreadySelectedSpriteIndex, 1);
		} else {
			this._selectedSprites.push(this._selectSprite(clickedRect, spriteRect));
		}
	} else {
		this._unselectAllSprites();
		this._selectedSprites = [this._selectSprite(clickedRect, spriteRect)];
	}

	this._attachResizeHandles();
	this.trigger('selectedSpritesChange', this._selectedSprites);
}

// the last selected sprite is the one shown in the preview, so that's the one that can be resized
SpriteCanvasViewProto._attachResizeHandles = function() {
	this._resizeHandles.attachTo( this._selectedSprites[this._selectedSprites.length - 1] );
}

SpriteCanvasViewProto.setSpriteRect = function(sprite, rect) {
	var canvas = this._spriteCanvas.canvas,
		left = Math.min( Math.max(rect.x, 0), canvas.width - 1 ),
		top = Math.min( Math.max(rect.y, 0), canvas.height - 1 ),
		right = Math.min( Math.max(rect.x + rect.width, left + 1), canvas.width ),
		bottom = Math.min( Math.max(rect.y + rect.height, top + 1), canvas.height );

	sprite.rect = new Rect(left, top, right - left, bottom - top);
	sprite.highlight.moveTo(sprite.rect);
	this.trigger('selectedSpritesChange', this._selectedSprites);
}

SpriteCanvasViewProto.setActiveSpriteRect = function(rect) {
	var sprite = this._selectedSprites[this._selectedSprites.length - 1];

	if (sprite) {
		this.setSpriteRect(sprite, rect);
	}
}

SpriteCanvasViewProto._selectSprite = function(clickedRect, spriteRect) {
	const highlight = new Highlight(this._$container, this);
	highlight.moveTo(clickedRect); // move to clicked area so the animation starts from click position

	return new SelectedSprite(spriteRect, highlight);
}

SpriteCanvasViewProto._unselectAllSprites = function() {
	this._selectedSprites.forEach(sprite => sprite.unselect());
	this._selectedSprites = [];
	this._resizeHandles.detach();
}

SpriteCanvasViewProto.setTool = function(mode) {
	var selectArea = this._selectArea,
		selectColor = this._selectColor;
	
	selectArea.deactivate();
	selectColor.deactivate();
	
	switch (mode) {
		case 'select-sprite':
			selectArea.activate();
			break;
		case 'select-bg':
			selectColor.activate();
			break;
	}
};

SpriteCanvasViewProto.setBg = function(color) {
	if ( $.support.transition ) {
		this._$bgElm.transition({ 'background-color': color }, {
			duration: 500
		});								
	}
	else {
		this._$bgElm.css({ 'background-color': color });
	}
	
	this._highlight.setHighVisOnDark( color === '#000' );
};

SpriteCanvasViewProto.getZoom = function() {
	return this._zoom;
};

SpriteCanvasViewProto.pagePointToCanvas = function(pageX, pageY) {
	var offset = this._$canvas.offset(),
		zoom = this._zoom;

	return {
		x: Math.floor( (pageX - offset.left) / zoom ),
		y: Math.floor( (pageY - offset.top) / zoom )
	};
};

// focusX/focusY are relative to the visible area (its centre by default),
// the image point under them stays in place
SpriteCanvasViewProto.setZoom = function(zoom, focusX, focusY) {
	var scroller = this._$bgElm[0],
		canvas = this._spriteCanvas.canvas,
		oldZoom = this._zoom,
		imgX, imgY;

	zoom = Math.min( Math.max(zoom, ZOOM_LEVELS[0]), ZOOM_LEVELS[ZOOM_LEVELS.length - 1] );

	if (focusX === undefined) {
		focusX = scroller.clientWidth / 2;
		focusY = scroller.clientHeight / 2;
	}
	imgX = (scroller.scrollLeft + focusX) / oldZoom;
	imgY = (scroller.scrollTop + focusY) / oldZoom;

	this._zoom = zoom;
	this._$canvas.css({
		width: canvas.width * zoom,
		height: canvas.height * zoom,
		// keep pixel art crisp when zoomed in
		'image-rendering': zoom > 1 ? 'pixelated' : ''
	});
	scroller.scrollLeft = imgX * zoom - focusX;
	scroller.scrollTop = imgY * zoom - focusY;

	this._selectedSprites.forEach(sprite => sprite.highlight.moveTo(sprite.rect));
	this.trigger('zoomChange', zoom);
};

SpriteCanvasViewProto.zoomIn = function(focusX, focusY) {
	var zoom = this._zoom,
		nextZoom = ZOOM_LEVELS.find(level => level > zoom);

	if (nextZoom) {
		this.setZoom(nextZoom, focusX, focusY);
	}
};

SpriteCanvasViewProto.zoomOut = function(focusX, focusY) {
	var zoom = this._zoom,
		prevZoom = ZOOM_LEVELS.filter(level => level < zoom).pop();

	if (prevZoom) {
		this.setZoom(prevZoom, focusX, focusY);
	}
};

SpriteCanvasViewProto.zoomToFit = function() {
	var scroller = this._$bgElm[0],
		canvas = this._spriteCanvas.canvas;

	this.setZoom( Math.min(scroller.clientWidth / canvas.width, scroller.clientHeight / canvas.height) );
};

export default SpriteCanvasView;