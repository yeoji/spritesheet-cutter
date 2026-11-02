## Spritesheet Cutter

This project uses [Sprite Cow](https://github.com/jakearchibald/sprite-cow) as a base for sprite selection. It is extended with spritesheet cutting and export features.

### Development

```
yarn install
yarn dev
```

Go to `http://localhost:1234`

### Usage

#### Background Selection
Select the background colour of your sprite sheet so that trimming works as expected.

#### Tolerance
Pixels whose RGBA channels are all within the tolerance of the background colour count as background, and so do nearly transparent pixels. Raise it for sheets with soft glows, anti-aliasing or compression noise around the sprites; set it to `0` for exact matching. It can be edited from the toolbar or the Settings panel.

#### Zoom
Use the `−`, `+` and `Fit` toolbar buttons, or hold Ctrl and scroll over the image to zoom around the mouse. Click the percentage to go back to 100%. Selections stay in image pixels at every zoom level.

#### Exporting a Single Sprite
Click on a sprite, check the preview and click export. A `.png` file will be downloaded.

#### Exporting Multiple Sprites
Click on a sprite, hold shift to select another sprite, and another, and another. Click export. A `.zip` file will be downloaded.

#### Adjusting a Selection
The last selected sprite gets resize handles: drag them to move its edges. You can also type its position and size in the Properties panel.

### Todo
- [x] Export individual selected sprites as PNG
- [x] Preview panel for selected sprite
- [x] Zoom in/out

### Ideas
- [ ] Right-click to export
- [x] Shift to select multiple sprites and export all
- [x] Adjustable rectangle after selection
- [ ] Grid-based slicing
- [ ] Auto select and export all
