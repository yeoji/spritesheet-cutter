import $ from 'jquery';

import MicroEvent from '../spritecow/MicroEvent';

class SlicePanel extends MicroEvent {
    constructor(spriteCanvas, $appendTo) {
        super();
        this._spriteCanvas = spriteCanvas;
        this._$container = $('<div class="slice-panel"></div>').appendTo($appendTo);

        $('<div class="panel-title">Slice</div>').appendTo(this._$container);
        $('<div>Columns: <input id="gridColumns" type="number" min="1" value="1"/></div><br/>').appendTo(this._$container);
        $('<div>Rows: <input id="gridRows" type="number" min="1" value="1"/></div><br/>').appendTo(this._$container);
        $('<div class="cell-size"></div>').appendTo(this._$container);
        $('<div><label><input id="gridTrim" type="checkbox"/> Trim cells to their sprite</label></div>').appendTo(this._$container);
        $('<div><input id="gridSliceButton" type="button" value="Slice Grid" title="Select every cell of the grid that has a sprite in it"></div>').appendTo(this._$container);

        this._addEvents();
    }

    getGrid() {
        const value = id => Math.max(parseInt(this._$container.find(id).val(), 10) || 1, 1);

        return {
            columns: value('#gridColumns'),
            rows: value('#gridRows'),
            trim: this._$container.find('#gridTrim').prop('checked')
        };
    }

    update() {
        const canvas = this._spriteCanvas.canvas,
            {columns, rows} = this.getGrid(),
            cellWidth = Math.round(canvas.width / columns * 100) / 100,
            cellHeight = Math.round(canvas.height / rows * 100) / 100;

        this._$container.find('.cell-size').text(`Cell: ${cellWidth} x ${cellHeight} px`);
    }

    _addEvents() {
        this._$container.find('#gridColumns, #gridRows').on('input', () => this.update());
        this._$container.find('#gridSliceButton').on('click', () => this.trigger('gridSlice', this.getGrid()));
    }
}

export default SlicePanel;
