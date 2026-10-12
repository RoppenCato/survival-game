# Lighting: what other games do, what was tried here, what works

Robin, 2026-10-12: *do extensive research online for similar games. How do they make good lighting? What are some good
techniques? Test a few and see what works best.* The priorities from the questionnaire: **fire and torch at night** first, and
**atmosphere**; compare **in pictures, then as switches** in the game.

This file is the research, the nine techniques that were built as switches, and a verdict on each. The switches are on the
Admin board under **Light and sound** (Esc, Admin, Light and sound); they are kept across reloads (`game.lab`).

## 1. What the research found

**Graveyard Keeper** (Lazy Bear Games; the nearest thing to this game's pipeline: 2D sprites, a three-quarter camera). From the
lead programmer's own write-up:
- The ambient light is a gradient over the hour, and on top of it the whole picture goes through **one of ten colour tables**
  (LUTs) for night, twilight, evening and so on. An artist grades a screenshot by hand and the grade is turned into the table.
- **Shadows are not computed.** Every object has up to four shadow sprites, one for the sun and one for each of the three nearest
  lights, and each is **turned about its foot toward its light**. About ten stock shadow shapes are shared. Long things (a fence)
  come out badly.
- **A light behind a thing does not light it.** The shader measures how far the light lies in front of or behind a sprite: in
  front, lit as usual; behind (the sprite stands between the light and the camera), the light fades quickly. That alone makes a
  figure before a fire a dark shape.
- Sprites carry **normal maps** (painted roughly from four sides and merged by a script) so a moving light models them.
- **Fog lies in horizontal layers**, and the tops of tall sprites pass through fewer of them, so roofs and treetops stand clear.
- The sequel gave up and went 3D for the lighting: nearly every object is a model with the pixel art projected onto it.

**Factorio** (Friday Facts 320): the night used to be **a black sheet laid over the game** with its strength turned up, and that
sheet was "part of the annoying darkness". They replaced it with a colour table: at night the colours **lose saturation and turn
blue and cold**. A night is a change of palette, not a subtraction of light.

**Stardew Valley, Factorio, the Excalibur engine** (the common 2D recipe): lights are **added into a small off-screen light map**
and the map is **multiplied over the finished picture**; on a 2D canvas the lights are cut out of a dark sheet. The light map can
be far smaller than the screen because light is smooth. This is what the game already did.

**Red Blob Games, "2D Visibility"**: to make walls stop light, sort the walls' ends by angle round the light, sweep, and keep the
nearest wall in each wedge; the lit area is a fan of triangles. Costly on the processor. The cheaper cousin: draw the light, then
**subtract a quad behind every wall**. Soft edges come from blurring or from a low-resolution light map.

**Octopath Traveler (HD-2D)**: flat sprites in a 3D scene; what makes it is **point lights that make the characters cast
shadows**, bloom, a vignette, depth of field, and particles in the air.

**Sea of Stars**: shadows that move as the sun crosses, and characters that glow in dark places; the announced plan was normal
maps, shadow receiving and volumetric light on sprites.

**Painters' rules for firelight** (illustration guides): warm where the light falls and **cool in the shadow**; darken the inside
of a figure so the **silhouette** reads and put a **rim of light only on the edges that face the fire**; a second, cool light
(the moon) for the other edge; light bounced off the ground.

**Hollow Knight-style atmosphere** (as other developers reconstruct it): a mostly dark, single-hued picture so the few highlights
stand out; **particles with long lives that fade in and out**; fog between the layers.

**Don't Starve, Core Keeper, Darkwood**: light is the survival tool itself (a small circle you must keep fed), which is this
game's own rule for the night (Robin, 2026-10-06: the night dark and dangerous, a fire the safe place).

What this adds up to for a game drawn on a 2D canvas with no shaders and no normal maps:

| Idea | Who | Can it be done here? |
| --- | --- | --- |
| Light map multiplied over the picture | everyone | It already was |
| Shadows as the sprite's own shape turned away from each light | Graveyard Keeper | Yes: built (`shadows`) |
| A light behind a thing leaves it dark; a lit rim | Graveyard Keeper, painters | Yes, by the thing's shape in one colour: built (`sides`) |
| Walls stop light; it falls out through openings | Red Blob | Yes, by clipping and a quad a wall: built (`walls`) |
| Flicker, a hot heart, light in the air | Octopath's bloom, painters | Yes: built (`glow`) |
| Night as a palette, not a black sheet | Factorio | Yes, with the canvas's `saturation` blend: built (`moon`) |
| Fog in layers by height | Graveyard Keeper | Yes, one layer under what stands and a veil over: built (`mist`) |
| Shafts of light, motes | Octopath, Hollow Knight | Yes: built (`shafts`); the cave's beams were the model |
| Moving cloud shadows | (common practice) | Yes: built (`clouds`) |
| Normal maps on every sprite | Graveyard Keeper, Eastward, Sea of Stars | No: needs shaders and a second painting of every sprite |
| Colour tables graded by hand per hour | Graveyard Keeper, Factorio | Not on a 2D canvas without reading pixels back (which broke the game's speed once) |
| Depth of field, tilt-shift | Octopath | No (and it does not suit an ink drawing) |

## 2. What was built, and the verdicts

All nine are in `templates/game.html` under "the lighting trials" (and `src/sprites.js` for the figures). The pictures are real
frames of the game from the browser pane, the same view with a switch off and on.

### Fire and torch at night

`docs/lighting-fire.jpg` (a campfire by a hut), `docs/lighting-village.jpg`, `docs/lighting-torch.jpg`.

| Switch | What it does | Verdict |
| --- | --- | --- |
| **glow** | The fire's reach and strength gutter and flare (three sines and a slow swell: `flick`). A hot glow sits on the flame and a faint warm haze hangs in the air round it, both added after the dark. | **Keep, on.** The single biggest change for the least work. Without it the firelight on grass is yellow-green; with it it is warm. |
| **shadows** | Every prop, built thing and sprite figure near a fire or the torch throws its own shape on the ground, away from the light, longer the further off (`figLit`, `shadowOf`, `Sprites.cast`). People drawn in ink get a long soft shape. | **Keep, on.** Subtle at a campfire, strong with the torch in a wood (the trees' shadows swing as you walk). |
| **sides** | What stands south of a fire (between it and you) is darkened and gets a thin warm edge toward the fire; what stands north of it catches warm light. | **Keep, on.** The hero before a fire becomes a shape with a lit edge, which is the picture everyone has of a campfire. Not on a thing you stand behind (it is drawn thin there). **Not yet on the villagers** (they are drawn afresh each frame, with no shape kept): a row of lit backs round the village fire is the obvious next step. |
| **walls** | A fire indoors lights its own room when you are in it, and from outside only what falls out through the door and the windows, as soft patches on the ground; an outdoor fire is cut by the shadow of every wall (the faces that look at it stay lit); windows of a room with a fire glow, and a door shows light under it and down its edges. | **Keep, on. The best of the nine.** Before, a house with a hearth glowed through its roof as a blob. Now a village at night is dark houses with lit windows. The light out of a window still reads as a beam more than a pool on the ground; shorter and rounder would be truer. |
| **moths** | Four pale flecks round every fire, circling, blinking as their wings turn. | **Keep, on.** Small; costs nothing. |

### The night itself

| Switch | What it does | Verdict |
| --- | --- | --- |
| **moon** | The night's blue a little lighter and bluer; colour drained from whatever no fire lights (grey laid on with the `saturation` blend, the lights cut out of it); glints on the sea in a band. | **Off; Robin's call.** It is the better picture (warm fire against a cold grey-blue world, and you can read the land), but it is a gentler night, and Robin asked for the night to be dark and dangerous. The glints on the sea are too faint to matter yet. It could become a thing that happens on some nights (a clear night against an overcast one). |

### The air

`docs/lighting-air.jpg`.

| Switch | What it does | Verdict |
| --- | --- | --- |
| **mist** | For the first four minutes of the day, thinner at dusk and thinner still all night, banks of mist drift over the ground: one layer drawn under whatever stands (trees rise out of it) and a faint veil over all. | **Off; worth trying.** It reads well and makes dawn a moment. It is also a pale layer over a game whose look is "happy, lush, green", so it should be Robin's choice. The first try was a white wash over everything; it has to be banks with clear ground between. |
| **shafts** | By day, where at least three trees stand close, light slants down between them from the upper left with motes turning in it; strongest when the sun is low. | **Off; worth trying.** Gives a wood a reason to walk into. They are placed by a hash of the ground and do not follow the real gaps in the crowns. |
| **clouds** | By day, soft shadows drift over the land with the wind. | **Off; judge it moving.** Nearly invisible in a still picture; in motion it should make open ground feel alive. It is a full-screen pass by day. |

### What it costs

Measured in the browser pane (which draws in software, so only differences mean anything): the five fire techniques together
add about one to two milliseconds a frame in a village at night, the same as the noise between two runs of nothing. They add **no
full-screen pass** (the shadows and the lit sides are a picture or two more for each thing near a fire). **`moon`, `mist` and
`clouds` each add full-screen passes**, which is what the graphics card paid for last time (the frame log of 2026-10-08), so they
should be judged on Robin's machine with the frame readout on.

## 3. What was not tried, and why

- **Normal maps.** The technique behind Graveyard Keeper, Eastward and Sea of Stars. It needs a second picture of every sprite
  and a shader. The Blender models could render their normals for free, so if the drawing ever moves to WebGL this is the first
  thing to do; the props drawn in code could not.
- **A true visibility polygon** for every light. The quad-behind-each-wall method does the job for houses; trees and rocks
  throw their shapes instead.
- **The hour of the day** (shadows that turn, a golden evening). Robin did not pick it. The old Light Editor (removed
  2026-10-09) had the sun's shadows by the hour; the props' shadows are baked into their sprites, so it means baking them without.
- **Heat haze, depth of field, bloom over the whole picture.** Need pixel access or shaders.

## 4. Sources

- [Graveyard Keeper: how the graphics effects are made](https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made) (also on [Game Developer](https://gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made))
- [80.lv on Graveyard Keeper 2 going 3D for its lighting](https://80.lv/articles/almost-every-object-in-this-stardew-valley-style-cemetery-sim-is-actually-3d)
- [Factorio Friday Facts 320: colour correction](https://www.factorio.com/blog/post/fff-320)
- [Red Blob Games: 2D visibility](https://www.redblobgames.com/articles/visibility/)
- [Excalibur's LightingSystem](https://excaliburjs.com/api/class/LightingSystem) and [MDN: globalCompositeOperation](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)
- [Octopath Traveler II and HD-2D](https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style), [HD-2D on Wikipedia](https://en.wikipedia.org/wiki/HD-2D)
- [Sea of Stars' lighting, as reviewed](https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/)
- [inkle: rim lighting in A Highland Song](https://www.inklestudios.com/highland/2021/03/11/rim-lighting.html)
- [Clip Studio: backlit illustrations](https://tips.clip-studio.com/en-us/articles/10888) (warm light, cool shadow, the rim)
- [Unity: 2D lights to set a mood](https://unity.com/en/how-to/use-2d-lights-unity-set-mood) (fog between layers, particles)
- [Don't Starve wiki: all about night](https://dontstarve.wiki.gg/wiki/Guides/All_About_Night)

Some searches found little first-hand (Eastward, Core Keeper, Children of Morta, Hollow Knight, Stardew Valley): what is said
of those above is what reviewers and other developers report, not the studios' own accounts.
