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
		
		var $canvasContainer  = $('.canvas-inner');
		var $codeContainer    = $('.code-container');
		var $tutorialLink     = $('.tutorial');
		var spriteCanvas      = new SpriteCanvas();
		var spriteCanvasView  = new SpriteCanvasView( spriteCanvas, $canvasContainer );
		var imgInput          = new ImgInput( $canvasContainer, $canvasContainer, $tutorialLink.attr('href') );
		var previewPanel      = new PreviewPanel( spriteCanvas, $codeContainer );
		var toolbarTop        = new Toolbar('.toolbar-container');
		var toolbarBottom     = new Toolbar('.toolbar-bottom-container');
		
		toolbarTop.
			addItem('open-img', 'Open').
			addItem('reload-img', 'Reload Current Image', {noLabel: true}).
			addItem(
				new ToolbarGroup().
					addItem('select-sprite', 'Select Sprite', {active: true}).
					addItem('select-bg', 'Pick Background')
			).
			addItem('invert-bg', 'Toggle Dark Background', {noLabel: true});

		toolbarTop.$container.addClass('top');

		toolbarBottom.
			addItem('bg-size', 'Scale for retina displays', {noLabel: true}).
			addItem('percent', 'Percentage positioning', {noLabel: true});

		toolbarBottom.$container.addClass('bottom');

		pageLayout.init();
		
		// listeners
		imgInput.bind('load', function(img) {
			spriteCanvas.setImg(img);
			
			previewPanel.imgWidth = spriteCanvas.canvas.width;
			previewPanel.imgHeight = spriteCanvas.canvas.height;
			previewPanel.scaledWidth = Math.round( previewPanel.imgWidth / 2 );
			previewPanel.scaledHeight = Math.round( previewPanel.imgHeight / 2 );

			spriteCanvasView.setTool('select-sprite');
			previewPanel.backgroundFileName = imgInput.fileName;
			pageLayout.toAppView();
		});
		
		spriteCanvasView.bind('rectChange', function(rect) {
			previewPanel.rect = rect;
			previewPanel.update();

			if (rect.width === spriteCanvas.canvas.width && rect.height === spriteCanvas.canvas.height) {
				// if the rect is the same size as the whole canvas,
				// it's probably because the background is set wrong
				// let's be kind...
				toolbarTop.feedback( 'Incorrect background colour set?', true );
			}
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