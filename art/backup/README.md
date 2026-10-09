# Backup

`character-editor.html` is the Character Editor as it was before the Art Editor (2026-10-09), kept because the old drawn hero was retired from every page: the ink figure (`lib.playerD`, `inkHero` in src/art.js) is still what the villagers, Brokk and the guards are drawn with, but the hero everywhere is the Blender model (src/sprites.js). To run this page again, put it back in templates/ as sprite.html, add it to PAGES in tools/build.py and give build.py a `__HERO_SPRITES__` placeholder again (or delete the Figure group from it).
