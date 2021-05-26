import $ from 'jquery';

import Rect from '../spritecow/Rect';
import InlineEdit from '../spritecow/InlineEdit';

class PreviewPanel {
    constructor(spriteCanvas, $appendTo) {
        var $container = $('<div class="preview-panel"></div>').appendTo($appendTo);
        this._$container = $container;
        this.$preview = this.createPreviewComponent().appendTo($container);
        this.$settings = this.createSettingsComponent().appendTo($container);

        this.$spriteCanvas = spriteCanvas.canvas;
        this.backgroundFileName = '';
        this.fileName = 'sprite.png';
        this.rect = new Rect(0, 0, 0, 0);
        this.imgWidth = 0;
        this.imgHeight = 0;
        this.scaledWidth = 0;
        this.scaledHeight = 0;
        this.useTabs = true;
        this.useBgUrl = true;
        this.percentPos = false;
        this.bgSize = false;
        this.selector = '.sprite';
        this._addEditEvents();
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

        this.$settings.find('#fileName').text(this.fileName);

        const selectedSprite = this.$spriteCanvas.getContext('2d').getImageData(rect.x, rect.y, rect.width, rect.height);

        const previewCanvas = this.$preview.find('canvas')[0];
        const previewCanvasContext = previewCanvas.getContext('2d');
        previewCanvasContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCanvasContext.drawImage(
            this.$spriteCanvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, previewCanvas.width, previewCanvas.height
        );
    };

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