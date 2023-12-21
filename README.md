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

#### Exporting a Single Sprite
Click on a sprite, check the preview and click export. A `.png` file will be downloaded.

#### Exporting Multiple Sprites
Click on a sprite, hold shift to select another sprite, and another, and another. Click export. A `.zip` file will be downloaded.

### Todo
- [x] Export individual selected sprites as PNG
- [x] Preview panel for selected sprite
- [ ] Zoom in/out

### Ideas
- [ ] Right-click to export
- [x] Shift to select multiple sprites and export all
- [ ] Adjustable rectangle after selection
- [ ] Grid-based slicing
