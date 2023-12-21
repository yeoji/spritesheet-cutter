import $ from 'jquery';
import JSZip from 'jszip';

import InlineEdit from '../spritecow/InlineEdit';

class PreviewPanel {
    constructor(spriteCanvas, $appendTo) {
        var $container = $('<div class="preview-panel"></div>').appendTo($appendTo);
        this._$container = $container;
        this.$preview = this.createPreviewComponent().appendTo($container);
        this.$properties = this.createPropertiesComponent().appendTo($container);
        this.$settings = this.createSettingsComponent().appendTo($container);

        this.$previewCanvas = this.$preview.find('canvas')[0];
        this.$hiddenExportingCanvas = $(`<canvas style="display:none"/>`)[0];
        this.$exportButton = this.$settings.find('#exportButton');

        this.$spriteCanvas = spriteCanvas.canvas;
        this.fileName = 'sprite';
        this.selectedSprites = [];
        this._addEditEvents();

        this.$exportButton.on('click', this.handleExport.bind(this));
    }

    createPreviewComponent() {
        const container = $('<div></div>');
        $('<div class="panel-title">Sprite Preview</div>').appendTo(container);
        $('<div id="preview"><canvas width="100" height="100"></canvas></div>').appendTo(container);

        return container;
    }

    createPropertiesComponent() {
        const container = $('<div></div>');

        $('<div class="panel-title">Properties</div>').appendTo(container);
        $('<div>Top X: <input id="topX" disabled/></div><br/>').appendTo(container);
        $('<div>Top Y: <input id="topY" disabled/></div><br/>').appendTo(container);
        $('<div>Width: <input id="width" disabled/></div><br/>').appendTo(container);
        $('<div>Height: <input id="height" disabled/></div><br/>').appendTo(container);
        
        return container;
    }

    createSettingsComponent() {
        const container = $('<div></div>');

        $('<div class="panel-title">Settings</div>').appendTo(container);
        $('<div>Name: <span id="fileName" data-inline-edit="file-name"/></div><br/>').appendTo(container);
        $('<div><span id="selectedSpritesCount">0</span> sprite(s) selected!</div>').appendTo(container);
        $('<div><input id="exportButton" type="button" value="Export" title="Export the selected sprite"></div>').appendTo(container);
        
        return container;
    }

    update() {
        var rect = this.selectedSprites[this.selectedSprites.length - 1].rect;
        const previewCanvas = this.$previewCanvas;

        this.$settings.find('#fileName').text(this.fileName);
        this.$settings.find('#selectedSpritesCount').text(this.selectedSprites.length);
        this.$properties.find('#topX').val(rect.x);
        this.$properties.find('#topY').val(rect.y);
        this.$properties.find('#width').val(rect.width);
        this.$properties.find('#height').val(rect.height);

        // the preview canvas has a fixed size and the sprite is resized to fit the preview panel
        const previewCanvasContext = previewCanvas.getContext('2d');
        previewCanvasContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCanvasContext.drawImage(
            this.$spriteCanvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, previewCanvas.width, previewCanvas.height
        );
    };

    handleExport() {
        if(this.selectedSprites.length > 1) {
            this.createZipExport().then(base64 => {
                const dataUrl = "data:application/zip;base64," + base64;
                this.downloadExport(dataUrl, '.zip');
            });
        } else {
            const image = this.createImageData(this.selectedSprites[0]);
            this.downloadExport(image, '.png');
        }
    }

    downloadExport(dataUrl, ext) {
        var link = document.createElement('a');
        link.download = this.fileName + ext;
        link.href = dataUrl;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    createImageData(sprite) {
        const rect = sprite.rect;
        const hiddenCanvas = this.$hiddenExportingCanvas;
        const hiddenCanvasContext = hiddenCanvas.getContext('2d');

        hiddenCanvasContext.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        hiddenCanvas.width = rect.width;
        hiddenCanvas.height = rect.height;
        hiddenCanvasContext.drawImage(
            this.$spriteCanvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, hiddenCanvas.width, hiddenCanvas.height
        );

        return hiddenCanvas.toDataURL("image/png");
    }

    createZipExport() {
        var zip = new JSZip();

        this.selectedSprites.forEach((sprite, i) => {
            const base64Image = this.createImageData(sprite).split(';base64,')[1];
            zip.file(`${i}.png`, base64Image, {base64: true});
        });

        return zip.generateAsync({type:"base64"});
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