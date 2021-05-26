import $ from 'jquery';

import Rect from '../spritecow/Rect';
import InlineEdit from '../spritecow/InlineEdit';

class PreviewPanel {
    constructor(spriteCanvas, $appendTo) {
        var $container = $('<div class="preview-panel"></div>').appendTo($appendTo);
        this._$container = $container;
        this.$preview = this.createPreviewComponent().appendTo($container);
        this.$settings = this.createSettingsComponent().appendTo($container);

        this.$previewCanvas = this.$preview.find('canvas')[0];
        this.$hiddenExportingCanvas = $(`<canvas style="display:none"/>`)[0];
        this.$exportButton = this.$settings.find('#exportButton');

        this.$spriteCanvas = spriteCanvas.canvas;
        this.fileName = 'sprite.png';
        this.rect = new Rect(0, 0, 0, 0);
        this._addEditEvents();

        this.$exportButton.on('click', this.handleExport.bind(this));
    }

    createPreviewComponent() {
        const container = $('<div></div>');
        $('<div class="panel-title">Sprite Preview</div>').appendTo(container);
        $('<div id="preview"><canvas width="100" height="100"></canvas></div>').appendTo(container);

        return container;
    }

    createSettingsComponent() {
        const container = $('<div></div>');

        $('<div class="panel-title">Settings</div>').appendTo(container);
        $('<div>Name: <span id="fileName" data-inline-edit="file-name"/></div><br/>').appendTo(container);
        $('<div><input id="exportButton" type="button" value="Export" title="Export the selected sprite"></div>').appendTo(container);
        
        return container;
    }

    update() {
        var rect = this.rect;
        const previewCanvas = this.$previewCanvas;
        const hiddenCanvas = this.$hiddenExportingCanvas;

        this.$settings.find('#fileName').text(this.fileName);

        // the preview canvas has a fixed size and the sprite is resized to fit the preview panel
        const previewCanvasContext = previewCanvas.getContext('2d');
        previewCanvasContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCanvasContext.drawImage(
            this.$spriteCanvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, previewCanvas.width, previewCanvas.height
        );

        // we need a hidden canvas that will always match the current selected sprite's height/width so when exporting it is the correct size
        const hiddenCanvasContext = hiddenCanvas.getContext('2d');
        hiddenCanvasContext.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        hiddenCanvas.width = rect.width;
        hiddenCanvas.height = rect.height;
        hiddenCanvasContext.drawImage(
            this.$spriteCanvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, hiddenCanvas.width, hiddenCanvas.height
        );
    };

    handleExport() {
        const image = this.$hiddenExportingCanvas.toDataURL("image/png");
        var link = document.createElement('a');
        link.download = this.fileName;
        link.href = image;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    _addEditEvents() {
        var previewPanel = this;
    
        new InlineEdit( previewPanel._$container ).bind('file-name', function(event) {
            var newVal = event.val;

            if(newVal.trim() !== "") {
                previewPanel.fileName = newVal;
                previewPanel.update();
            }
        });
    };
}

export default PreviewPanel;