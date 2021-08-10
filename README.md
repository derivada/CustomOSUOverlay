# CustomOSUOverlay by *derivadas*

**STILL WIP, MAY NOT BE USABLE**

Custom overlay for osu! replays, using https://github.com/l3lackShark/gosumemory. Should be used as a recording overlay and not a streaming one, as it's pretty detailed. Features content divided in `sections` such as `accSection` or `URSection`. It can be run along an internal server that fetches user data that requires osu!API authentication for a richer `playerSection` (check `server/index.js`).

## TODO:

### Overall: 

    - Experiment with different fonts
    - Toggle sections on GameStates (replay overview, watching replay, menu)
    - Experiment with HP Section
    - Experiment with custom replay overview screen

### Acc Section:

    - Experiment with pp line graph along with the SR graph for contrast 

### Key Section:

    - Make a cool design
    - Dynamic colors

### UR Section:
    - Experiment with color coding for different ranges

### Player data server:
    - Compact and refactor code
    - Try using axios library for the image downloading

