# CustomOSUOverlay by *derivadas*

**STILL WIP, MAY NOT BE USABLE**

Custom overlay for osu! replays, using https://github.com/l3lackShark/gosumemory. Should be used as a recording overlay and not a streaming one, as it's pretty detailed. Features content divided in `sections` such as `accSection` or `URSection`. It can be run along an internal server that fetches user data that requires osu!API authentication for a richer `playerSection` (check `server/index.js`).

## TODO:

### Overall: 

    - Experiment with different fonts
    - Toggle sections on GameStates (replay overview, watching replay, menu)
    - Experiment with HP Section

### Acc Section:
    - Experiment with pp line graph along with the SR graph for contrast 
    - Misses marked in pp graph to correlate with difficulty strains
    
### UR Section:
    - Experiment with custom UR bar

In the future I might do an after replay screen with all the data presented in a fancy way and other stats like the leaderboard position achieved and more player from the data (total PP, top plays...)
