# Install
`npm install`

## Run
`npm start`

### Requires:
Electron.


#### Notes:
If using linux, try to use a wayland compositor if you're on Nvidia, web content with Nvidia Proprietary drivers on linux has a tiny rendering bug, also it forcefully sets some kind of janky synchronization so its all kinds of hecc. AMD Recommended on Linux, though oddly enough if you do force a wayland compositor to work with Nvidia (sway, hyprland, etc) it seems to be okay? Idk, nvidia+linux be weird mang