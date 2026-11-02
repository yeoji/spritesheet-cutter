import $ from 'jquery';

import Rect from '../Rect';

const DIRECTIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

// moves the edges named by direction (e.g. 'nw') by dx/dy, never letting the rect go below 1x1
function resizeRect(rect, direction, dx, dy) {
    let left = rect.x,
        top = rect.y,
        right = rect.x + rect.width,
        bottom = rect.y + rect.height;

    if (direction.includes('w')) {
        left = Math.min(left + dx, right - 1);
    }
    if (direction.includes('e')) {
        right = Math.max(right + dx, left + 1);
    }
    if (direction.includes('n')) {
        top = Math.min(top + dy, bottom - 1);
    }
    if (direction.includes('s')) {
        bottom = Math.max(bottom + dy, top + 1);
    }

    return new Rect(left, top, right - left, bottom - top);
}

class ResizeHandles {
    constructor(view) {
        this._view = view;
        this._$handles = null;
    }

    attachTo(sprite) {
        this.detach();
        if (!sprite) {
            return;
        }

        const $handles = $(DIRECTIONS.map(direction =>
            `<div class="resize-handle ${direction}" data-direction="${direction}"></div>`
        ).join(''));

        $handles.on('mousedown', event => this._startResize(event, sprite));
        sprite.highlight.append($handles);
        this._$handles = $handles;
    }

    detach() {
        if (this._$handles) {
            this._$handles.remove();
            this._$handles = null;
        }
    }

    _startResize(event, sprite) {
        if (event.button !== 0) {
            return;
        }
        // don't let the canvas start a new selection underneath
        event.stopPropagation();
        event.preventDefault();

        const view = this._view,
            direction = $(event.currentTarget).data('direction'),
            start = view.pagePointToCanvas(event.pageX, event.pageY),
            startRect = sprite.rect,
            $document = $(document);

        const onMove = moveEvent => {
            const point = view.pagePointToCanvas(moveEvent.pageX, moveEvent.pageY);
            view.setSpriteRect(sprite, resizeRect(startRect, direction, point.x - start.x, point.y - start.y));
        };
        const onUp = () => {
            $document.off('mousemove', onMove).off('mouseup', onUp);
        };

        $document.on('mousemove', onMove).on('mouseup', onUp);
    }
}

export default ResizeHandles;
