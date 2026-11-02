import $ from 'jquery';

import SpriteCanvas from './SpriteCanvas';
import SpriteCanvasView from './SpriteCanvasView';
import ImgInput from './ImgInput';
import {Toolbar, ToolbarGroup} from './Toolbar';
import pageLayout from './pageLayout';

import PreviewPanel from '../cutter/PreviewPanel';

(function() {
	// init
	(function() {
		function colourBytesToCss(color) {
			if (color[3] === 0) {
				return 'transparent';
			}
			return 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + String( color[3] / 255 ).slice(0, 5) + ')';
		}

		// the tolerance can be edited from the toolbar and the preview panel, keep both in sync
		function setTolerance(value, source) {
			var tolerance = parseInt(value, 10);

			if ( !(tolerance >= 0 && tolerance <= 255) ) {
				return;
			}
			spriteCanvas.setTolerance(tolerance);

			if (source !== previewPanel) {
				previewPanel.setTolerance(tolerance);
			}
			if (source !== $toleranceInput) {
				$toleranceInput.val(tolerance);
			}
		}

		var $canvasContainer  = $('.canvas-inner');
		var $codeContainer    = $('.code-container');
		var $tutorialLink     = $('.tutorial');
		var spriteCanvas      = new SpriteCanvas();
		var spriteCanvasView  = new SpriteCanvasView( spriteCanvas, $canvasContainer );
		var imgInput          = new ImgInput( $canvasContainer, $canvasContainer, $tutorialLink.attr('href') );
		var previewPanel      = new PreviewPanel( spriteCanvas, $codeContainer );
		var toolbarTop        = new Toolbar('.toolbar-container');
		var toolbarBottom     = new Toolbar('.toolbar-bottom-container');
		var $tolerance        = $('<label class="tolerance" title="How different a pixel can be from the background and still count as background">Tolerance <input type="number" min="0" max="255"></label>');
		var $toleranceInput   = $tolerance.find('input');

		toolbarTop.
			addItem('open-img', 'Open').
			addItem('reload-img', 'Reload Current Image', {noLabel: true}).
			addItem(
				new ToolbarGroup().
					addItem('select-sprite', 'Select Sprite', {active: true}).
					addItem('select-bg', 'Pick Background')
			).
			addElement($tolerance).
			addItem('invert-bg', 'Toggle Dark Background', {noLabel: true});

		setTolerance( spriteCanvas.getTolerance() );

		toolbarTop.$container.addClass('top');

		toolbarBottom.$container.addClass('bottom');

		pageLayout.init();
		
		// listeners
		imgInput.bind('load', function(img) {
			spriteCanvas.setImg(img);
			
			spriteCanvasView.setTool('select-sprite');
			pageLayout.toAppView();
		});
		
		spriteCanvasView.bind('selectedSpritesChange', function(selectedSprites) {
			if(selectedSprites.length === 0) {
				return;
			}

			previewPanel.selectedSprites = selectedSprites;
			previewPanel.update();

			selectedSprites.forEach(({rect}) => {
				if (rect.width === spriteCanvas.canvas.width && rect.height === spriteCanvas.canvas.height) {
					// if the rect is the same size as the whole canvas,
					// it's probably because the background is set wrong
					// let's be kind...
					toolbarTop.feedback( 'Incorrect background colour set? Try a higher tolerance.', true );
				}
			});
		});
		
		spriteCanvasView.bind('bgColorHover', function(color) {
			toolbarTop.feedback( colourBytesToCss(color) );
		});
		
		spriteCanvasView.bind('bgColorSelect', function(color) {
			var toolName = 'select-sprite';
			spriteCanvasView.setTool(toolName);
			toolbarTop.activate(toolName);
			toolbarTop.feedback( 'Background set to ' + colourBytesToCss(color) );
		});

		$toleranceInput.on('input', function() {
			setTolerance(this.value, $toleranceInput);
		});

		previewPanel.bind('toleranceChange', function(value) {
			setTolerance(value, previewPanel);
		});
		
		toolbarTop.bind('open-img', function(event) {
			event.preventDefault();
		});

		toolbarTop.bind('select-bg', function() {
			spriteCanvasView.setTool('select-bg');
		});
		
		toolbarTop.bind('select-sprite', function() {
			spriteCanvasView.setTool('select-sprite');
		});
		
		toolbarTop.bind('reload-img', function(event) {
			imgInput.reloadLastFile();
			event.preventDefault();
		});
		
		imgInput.fileClickjackFor( toolbarTop.$container.find('div.open-img') );
		
		toolbarTop.bind('invert-bg', function(event) {
			if ( event.isActive ) {
				spriteCanvasView.setBg('#fff');
			}
			else {
				spriteCanvasView.setBg('#000');
			}
		});

		toolbarBottom.bind('percent', function(event) {
			cssOutput.percentPos = !event.isActive;
			cssOutput.update();
		});

		toolbarBottom.bind('bg-size', function(event) {
			cssOutput.bgSize = !event.isActive;
			cssOutput.update();
		});
		
		$tutorialLink.click(function(event) {
			imgInput.loadImgUrl( this.href );
			event.preventDefault();
		});
	})();
})();