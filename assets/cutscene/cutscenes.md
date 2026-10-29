# Cut-scenes: what the research says, and what we take from it

Colin, AD, 2026-10-29. Robin asked (through Clive, GD) for a tool to make cut-scenes, research first, then a skill, with the village's
blót as the first trial. This is what other games and their makers do, boiled down, and the choices it led to. The skill
(`.claude/skills/cutscene/SKILL.md`) is the how-to.

## How others build them

- **Stardew Valley** writes each event as one script, a list of commands run in order. The script opens with the setup in a fixed
  order: music, then where the view stands, then who stands where and which way they face. Then come the beats: `move`, `speak`,
  `emote`, `pause`, `fade`, `viewport`, `end`. Moves can run together (one command after another on a line, the last one waiting).
  Its makers' advice is to build the event in small pieces: an opening shot or fade-in, one middle beat, a closing shot. Test after
  every addition. Name the actor in every command. Count the tiles: a miscounted move leaves a man walking into a wall and the event
  hangs.
- **RPG Maker** has one event that runs the whole scene. It opens with a fade-out so the actors can be placed unseen, then fades in,
  and fades out and back again at the end for the clean-up. The player is hidden and walk-through for the scene, and restored after.
  "Wait for completion" goes on the move that everything after depends on, and the waiting move is put last. A blocked route with a
  wait on it hangs the game. Long walks are split, so the others can act at the right moment.
- **Unity's Timeline and Godot's AnimationPlayer** lay the scene on tracks against a clock, with markers ("signals") that tell the
  game something happened. Their lessons:
  - Keep the scene apart from the game. It sends signals and the game reacts.
  - Put everything the scene changes for good into one "scene over" step. Seeking or skipping the timeline fires every signal it
    passes, so the end state must be set in one place, or a skipped scene and a watched one leave different worlds.
- **Adventure Game Studio and Adventure Creator** skip by running the rest of the scene at once without drawing it. That breaks
  where a scene leans on per-frame work, so the end state is set explicitly: the camera switched back, the actors placed, input
  given back.

## The tips that recur

- **Short.** The most common failure is a scene longer than what it tells. Every beat earns its seconds.
- **Skippable, and the skip lands where the watched scene does.** The end state is written once and run on both.
- **Nothing the player must know lives only in a scene.** What is taught is also written in the book (or the Quests page), and can
  be seen again.
- **Block before the camera.** Settle who stands where first. No camera move fixes unclear staging. Characters need clear sight
  lines to each other and to the camera, and they end where the play that follows needs them.
- **The camera moves for a reason, and something waits at the end of a pan.** Slow moves for the setting and the dread, quicker to
  follow action. Too fast and the eye loses its place. The mute test: with no sound, can you still tell why the camera moved?
- **Keep the player oriented.** Begin from where the player stands, move the view to the scene, and come back to the player before
  handing control back. Blend out, never cut, unless a fade covers the cut.
- **Letterboxing suits wide 3D scenes, less a top-down game**, where height on screen is precious. Factorio chose to feather the
  edges and change the light instead. We use thin bars (6 per cent each) with a soft edge, and the rite's own darkening.
- **Give control back explicitly**: input on, the HUD back, the camera eased to the hero, every actor's state set. Never trust the
  game to work it out.
- **Test in small steps**: play from any step, play to the end, skip at every beat.

## What we do in this game

- **A scene is plain data**, a list of steps (JSON) that the game's small player runs, as Stardew and RPG Maker do. It is easy to
  write by hand, to read in a diff, and to tune in the editor.
  - Each step waits for its end, unless it says `"wait": false`.
  - A `par` block runs steps together and waits for all of them.
  - Variable things (a line read at the player's pace, a choice) just wait, which a fixed timeline cannot do.
- **Places are named, not numbered.** Villages are grown, so every position is relative to an anchor the game gives ("altar", "hero",
  "lead"). The same scene plays in any village.
- **The scene stages its own figures.** It borrows the real person (Arnor, the village's speaker) by role, or makes extras for a
  crowd. When it ends, each goes back to the place and job its `end` steps set.
- **One `end` list** holds what the scene leaves behind (flags, positions, the camera back, input on). It runs at the end and on a
  skip, so the two cannot differ.
- **The game gives the player an `env`**: the only door between the scene and the page. It has the camera, the figures, the speech
  board and talk window, the rite's sky, bolt, stones, blood and motes, the lettering, fades, sounds and music. A scene can do only
  what the env offers. New powers are added to the env, never reached for directly.

Sources:
- [Stardew Modding Wiki: tips for making events](https://stardewmodding.wiki.gg/wiki/Tips_for_Making_Events_from_a_Novice_by_LenneDalben)
- [Stardew Modding Wiki: anatomy of an event](https://stardewmodding.wiki.gg/wiki/Tutorial:_Anatomy_of_an_Event)
- [RPG Maker: cutscene basics](https://rpgmakerweb.com/blog/cutscene-basics)
- [RPG Maker MZ help: Set Movement Route](https://rpgmakerofficial.com/product/MZ_help-en/01_10_06_01.html)
- [Unity: how to use Timeline signals](https://unity.com/blog/engine-platform/how-to-use-timeline-signals)
- [Unity issue tracker: seeking a timeline fires the signals between](https://issuetracker-mig.prd.it.unity3d.com/issues/timeline-will-execute-all-signals-in-between-when-advancing-playabledirector-dot-time)
- [Bugnet: a cutscene skip that leaves state half applied](https://bugnet.io/blog/how-to-fix-unity-cutscene-skip-leaves-state-half-applied)
- [Wayline: cinematic cutscenes in Godot](https://www.wayline.io/blog/godot-cinematic-cutscenes-animationplayer-signals)
- [Adventure Game Studio forums: good habits for cut-scenes](https://www.adventuregamestudio.co.uk/forums/beginners-technical-questions/good-habits-for-cut-scenes)
- [Factorio Friday Facts 273: the cutscene controller](https://forums.factorio.com/viewtopic.php?p=390101)
- [MoCap Online: cutscene direction for games](https://mocaponline.com/blogs/mocap-news/cutscene-animation-direction-guide)
