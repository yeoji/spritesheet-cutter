#!/bin/bash
set -e

### CONFIG ###
OWNER="the-33"
REPO="spritesheet-cutter"
APP_NAME="Spritesheet Cutter"
INSTALL_DIR="/opt/$APP_NAME"
BIN_PATH="/usr/local/bin/$APP_NAME"
DESKTOP_FILE="/usr/share/applications/$APP_NAME.desktop"

echo "→ Fetching latest GitHub release…"

LATEST_TAR=$(curl -s "https://api.github.com/repos/$OWNER/$REPO/releases/latest" \
  | grep browser_download_url \
  | grep ".tar.gz" \
  | cut -d '"' -f 4 | head -n 1)

if [ -z "$LATEST_TAR" ]; then
  echo "ERROR: No .tar.gz asset found in the latest release."
  exit 1
fi

echo "→ Latest release found:"
echo "  $LATEST_TAR"

TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo "→ Downloading release asset…"
curl -L -O "$LATEST_TAR"

FILE_NAME=$(basename "$LATEST_TAR")

echo "→ Extracting files…"
tar xzf "$FILE_NAME"

APP_DIR=$(find . -maxdepth 1 -type d ! -name '.' | head -n 1)

if [ -z "$APP_DIR" ]; then
  echo "ERROR: No folder detected inside the tar.gz package."
  exit 1
fi

echo "→ Installing into $INSTALL_DIR …"
sudo rm -rf "$INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo cp -r "$APP_DIR"/. "$INSTALL_DIR"

INSTALL_USER=${SUDO_USER:-$USER}

echo "→ Setting ownership to $INSTALL_USER …"
sudo chown -R "$INSTALL_USER":"$INSTALL_USER" "$INSTALL_DIR"

echo "→ Installing dependencies (yarn install)…"
sudo -u "$INSTALL_USER" bash -c "cd '$INSTALL_DIR' && yarn install"


echo "→ Creating launcher at $BIN_PATH …"
sudo bash -c "cat > '$BIN_PATH' << 'EOF'
#!/bin/bash
cd '/opt/Spritesheet Cutter'
yarn dev &
xdg-open http://localhost:1234
EOF"
sudo chmod +x "$BIN_PATH"

echo "→ Creating desktop entry…"
sudo bash -c "cat > '$DESKTOP_FILE' << EOF
[Desktop Entry]
Type=Application
Name=Spritesheet Cutter
Exec=$BIN_PATH
Icon=$APP_NAME
Terminal=false
Categories=Development;Graphics;
EOF"

# Copy icon if it exists
if [ -f "$INSTALL_DIR/icon.png" ]; then
  sudo cp "$INSTALL_DIR/icon.png" "/usr/share/pixmaps/$APP_NAME.png"
fi

echo "→ Cleaning temporary files…"
rm -rf "$TMP_DIR"

echo ""
echo "✓ Installation completed successfully."
echo "You can launch the app from your application menu or by running: $APP_NAME"
