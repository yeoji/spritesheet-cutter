import Rect from '../Rect';

class SelectedSprite {
    constructor(rect, highlight) {
        this.rect = rect;
        this.highlight = highlight;
        
        this.highlight.moveTo(rect, true);
    }

    unselect() {
        this.highlight.remove();
    }
}

export default SelectedSprite;