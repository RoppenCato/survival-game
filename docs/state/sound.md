# Sound and music

How this part of the game stands now, moved out of `CLAUDE.md` on 2026-10-27 (the doctor: it was read at every start). Keep it current, as `CLAUDE.md` was: what is true now, Robin's decisions marked as his.


- **Synthesized:** each page has its own set in code (the engine's sounds, chop, clink, build); `src/ambient.js` is the
  place's sound (wind, leaves, sea, birds by day, crickets from dusk, fire, water, caves, footsteps by the ground), its
  loudness the Escape menu's second bar, each layer a switch on Admin's Light and sound board (`LAB.snd`). Everything hushes
  when the window loses focus.
- **Recorded sounds: Robin's picks, locked in (2026-10-20,** pasted from the arena; `DEFAULT_PICK` in both pages). `src/sfx.js`
  plays `assets/sfx/combat.js`, built from **only what the game plays** (`assets/sfx/keep.txt`, 40 sounds, 6.3 MB): `node
  tools/sfxjs.js "C:/dev/SG/Sound Director/out/sfx/combat|C:/dev/SG/Sound Director/out/sfx/chapter1|C:/dev/SG/Sound
  Director/out/sfx/flesh|C:/dev/SG/Sound Director/out/sfx/ui|assets/sfx/free" combat @assets/sfx/keep.txt` (the `ui` folder since 2026-10-22: the talk window's and the book's); `Sfx.vol` 0.5; where no recording exists the
  synthesized sound plays. Sources and licences in `assets/sfx/free/CREDITS.md`. What plays:
  - the sword's swing (and fists, the men's, the club's and any weapon with no swish of its own, Robin 2026-10-26) the free swish E, F on a heavy blow (`SWING_SETS`); the other weapons' the
    studio's `swish_<kind>` (axe, Dane axe, seax, spear);
  - the hit **W** (the slap: hand slaps on skin over a punch) and the heavy hit **X** (the punch with a whip-crack snap), the
    studio's flesh set, every weapon's, pitched by the weapon (`HIT_RATE`), **the club's too since 2026-10-21** (Robin: the dry
    wooden knock **V** was bad; it stays a candidate in the arena);
  - the shield going up **H** (the straps and the boards together), the block **A** (wood knocks);
  - the hit on a tree **A** and on a rock **A** (free packs), a tree falling **A** (played from the felling blow, trimmed so
    its crash lands with the trunk, which then plays nothing more), a log coming off the trunk **V**, a box breaking **V**;
  - **the struck beasts' cries W** (boar, deer, adder, wolf): the engine calls `sfx('pain')` after a hit on a beast that does
    not kill it (`e.bkind`, set by `tuneBeast`); the page plays the cry 50 ms later, always on a heavy blow, every other light
    one, never two within 0.35 s (mine), a grown boar's slower (0.88: the cry was made for the young). Real boar, wolf and
    deer recordings would need Robin's Freesound account or a Sonniss bundle;
  - the studio's own for the rest (parry, crit, the tell, the chain, finish, broken, perfect, stagger, dash, hurt,
    slam, die);
  - **the bow shot B** (Derek, SD's `assets/sfx/bow`, Robin's pick of 2026-10-23: a recurve's snap; the studio's old `shoot` and the other candidates are out);
  - **the weather's sounds** (Derek, SD's candidates of 2026-10-23, `assets/sfx/weather`, copied whole; **their own bundle
    `assets/sfx/weather.js`**, 21 MB, built by `node tools/sfxjs.js assets/sfx/weather weather`, `__TAG_WSFX__`, **loaded when
    the first wet spell comes**, `WSFX`, `weatherSfx`; Robin picks in the arena, where its rows are the world's): the rain as
    beds, seamless 16 s loops (`Sfx.loop`, `Sfx.setLoop`, `Sfx.cut`) crossfaded by each spell's own strength (the shower
    `rain_light`, rain `rain`, the storm `rain_heavy`; `rain_water` beside them while the sea is in sight), through the place's
    own volume; **the thunder** 1.5 to 5 s after each of the storm's flashes, quieter and lower the longer the delay
    (`weatherThunder`); **a step** where a print shows (`step_snow`, `step_wetsand`, `step_mud`) and **a splash** through a
    puddle on wet ground (`weatherStep`, `weatherSplash`, from `wgTick`'s footfall); the gust is not played (the game's own
    wind). The numbers are mine. `debug().weather().sfx` counts what played;
  - **the wave on the shore V** (`amb.wave`, through the place's volume, ashore only): each wave ±2 dB and ±4%, gaps 4.6 to
    11 s with now and then a close pair, and between them the old wash low and unswept (0.01: measured 11 to 17 dB under the
    waves; 0.012 for a more continuous shore, under 0.007 it no longer fills the gaps).
  The arena's The sounds panel lists what plays, offers a Choose row only where there is still more than one candidate (new
  ones from the studio land there), and shows the picks as text to paste back (`game.sfxpick2`). A pick of something no
  longer in the bundle falls back to Robin's. The candidates he did not pick were removed; the hunt for the hit (the
  studio's "bump", the free layers I to L, V, then W to Y from a brief on how other games do it) is in git and the archive.
- **The sound bundle and the music scripts carry `?v=` and a hash of their bytes** (`file_tag` in `tools/build.py`): a browser
  kept the old bundle.
- **Music:** the studio's recorded meadow by day and by night (`assets/music/*.js`, wrapped by `tools/musicjs.js` so they load
  from disk), crossfading at dusk and dawn; **the day's loop by the season** (Derek, SD's meadow-day-spring at 124 bpm and meadow-day-winter at 90, Robin's picks of 2026-10-23, "I like spring and winter"; `dayTheme` by `year.season`, a season's turn crossfading it as dusk does; and meadow-day-autumn at 104 with its start reworked, "Autumn is good now"; summer the meadow as before; the nights' seasons come next); the synthesized songs in `src/music.js` are the fallback. Music is off until the
  Escape menu's bar is turned up; there is no mute key (M is the map).
