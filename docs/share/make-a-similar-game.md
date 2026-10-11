I want to make a game with you, step by step. This is a guide to the tools, the setup and a sensible order of work. It does not say what the game is or how it should look. Ask me about the genre, setting, art style and rules before deciding any of that. Where I am new to something (git, GitHub, the terminal), explain it briefly the first time and do the commands with me.

## Part 1: set up the machine (do this first, once)

1. **Install** Node.js (LTS), Git, and Python 3. A code editor such as VS Code is optional, since Claude edits the files for you.
2. **Install Claude Code** and sign in with your Claude account. Check it with `claude --version`.
3. **Make a project folder** and start Claude Code inside it by running `claude`. Ask it to create a `CLAUDE.md` file at the root. This is the project's memory: what the game is, the folder layout, the commands, and the decisions made so far. Claude reads it at the start of every session, so keep it current.

## Part 2: git and GitHub for a beginner

Git records the history of your project, so any change can be undone. GitHub keeps a copy online, so it is backed up and reachable from other devices.

1. Make a free GitHub account. Make a new **private** repository there, with no starter files.
2. In the project folder, ask Claude to run `git init`, make the first commit, and connect the repository with `git remote add origin <the repository's address>`. Push with `git push -u origin main`. GitHub asks you to sign in once in the browser. The easiest way is to install the GitHub CLI and run `gh auth login`.
3. **The rhythm:** finish a small working step, run it and check it, then commit with a plain message and push. A commit is a save point you can return to. Small commits are easier to undo than big ones.
4. Add a `.gitignore` so folders like `node_modules` and big temporary files are not committed.
5. If something breaks, do not panic: ask Claude to show `git status` and `git log`, and to restore the last good commit. Never run destructive commands such as a hard reset without asking Claude to explain what they will do first.
6. Optional: use a branch for any risky experiment (`git switch -c experiment`) so the main line stays safe.

## Part 3: work from your phone with Remote Control

Remote Control lets you open the same Claude Code session, running on your computer, from the Claude app on your phone or from a browser.

- Your computer must stay on, awake and connected, and the terminal running Claude must stay open. The phone is only a window into it.
- You need a recent Claude Code (`claude update`), a paid Claude plan, and to be signed in with your account, not an API key.
- **Start it** in one of three ways: type `/remote-control` (or `/rc`) inside a running session; start a session with `claude --rc`; or run `claude remote-control` in its own terminal for a session that stays running.
- Claude shows a link and a QR code. Scan it with the Claude mobile app, or open the Code tab in the app or at claude.ai/code and pick the session. If you lack the app, `/mobile` in Claude Code shows a download QR code.
- This is good for approving steps, giving the next instruction, and checking results while away from the desk. Keep commits small and pushed, so the work is also safe on GitHub.
- Check Anthropic's official Claude Code documentation for the current requirements, because they change.

## Part 4: the tools for a game in the browser (suggested, change if you prefer)

- Plain JavaScript and the HTML5 Canvas 2D API. No framework or engine to learn first. Docs: MDN "Canvas API" and "Window.requestAnimationFrame".
- One self-contained HTML file per page, built from small source files by a short Python or Node script into a `dist/` folder, and opened directly or served with `python -m http.server`.
- Web Audio for generated sound, and `localStorage` for saves.
- Node scripts for tests and for rendering images without a browser (the `@napi-rs/canvas` package acts as a fake canvas).
- Alternatives worth discussing with me: Phaser or PixiJS for a 2D framework, Godot or Unity for an engine, TypeScript for safer code. Pick one early. Changing later is expensive.

## Part 5: the order of work for any game

Finish each step, check it, commit and push it before the next.

1. **Decide the game in one page:** genre, the single main verb the player repeats, what makes it different, and what is out of scope. Put it in `CLAUDE.md`.
2. **Project skeleton:** folders, build script, one page that opens, git connected.
3. **The loop:** a game loop, a camera, and a placeholder player that moves.
4. **The core verb alone:** make the one thing the player does all game feel right with boxes for art. If it is not fun with boxes, no art will save it.
5. **The world or level:** a first small level or map, and how the player moves in it, with simple collision.
6. **Opponents or obstacles:** one of each, then the rules for winning, losing and dying.
7. **The first complete loop:** start, play, end, restart. Then play it yourself and write down what is boring.
8. **Systems that support the loop:** items, progression, saving and loading. Add one at a time.
9. **Menus and settings.**
10. **Replace placeholders with real art and sound.** Do this late. Art made too early gets thrown away.
11. **Balance, polish and bug fixing,** then show it to other people.

## Part 6: habits that keep a project healthy

- Keep numbers (speeds, costs, health, drop rates) in plain data tables, not buried in code, so tuning means editing a table.
- For anything you tune by eye, build a small page with sliders and a way to copy the settings out as text.
- Write short Node scripts that run the game's rules without a browser and print values, then read them.
- Keep a decisions file, `docs/decisions.md`, and update it whenever something is settled, so no decision lives only in a chat.
- Do not add a tutorial or help text until the mechanics are settled.
- Ask Claude to explain anything you do not understand. Learning as you go is part of the plan.

## Part 7: optional, Blender for characters instead of drawing them in code

- Model and rig the character in Blender, or take animations from Mixamo (free). Its auto-rigger fails on messy meshes, so upload a joined, simplified version.
- Script Blender with its Python module and render headless (`blender -b -P script.py`) from a fixed orthographic camera, one render per direction per animation frame.
- Pack the frames into sprite sheets with a Node script, and draw them with `drawImage` and a frame index chosen from the character's state. Held items and clothing can be separate transparent layers over the body.
- The costs: sheets get large, and any change to the rig means re-rendering. Keep the world and buildings drawn in code unless you have a reason not to.
