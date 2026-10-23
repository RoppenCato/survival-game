# Rebuilds src/seasons.js from the Art Director's assets/seasons/seasons_grade.js (copied from his out/seasons), keeping the one
# change of the game's copy: the ice's distance from land found on a grid of every fourth pixel (per pixel it was 729 looks a pixel).
#   python3 tools/seasons_sync.py        (after copying his seasons_grade.js into assets/seasons/)
import io
src = io.open('assets/seasons/seasons_grade.js', encoding='utf-8').read().replace('\r\n', '\n')
s = src
a_start = s.index("    if (season === 'winter') {                 // how far each water pixel lies from land")
end_mark = "        iceD[y * w + x] = best; } }\n"
a_end = s.index(end_mark, a_start) + len(end_mark)
new = """    if (season === 'winter') {                 // how far each water pixel lies from land, for the ice at the shore: found on a grid of every fourth pixel (Clive, GD: per pixel it was 729 looks a pixel, seconds a chunk)
      var CS = 4, cw = Math.ceil(w / CS), ch = Math.ceil(h / CS), RC = Math.ceil(R / CS), cwat = new Uint8Array(cw * ch), cd = new Float32Array(cw * ch), gx, gy;
      for (gy = 0; gy < ch; gy++) for (gx = 0; gx < cw; gx++) cwat[gy * cw + gx] = water(Math.min(w - 1, gx * CS + 2), Math.min(h - 1, gy * CS + 2)) ? 1 : 0;
      for (gy = 0; gy < ch; gy++) for (gx = 0; gx < cw; gx++) { var bi = gy * cw + gx; if (!cwat[bi]) { cd[bi] = 0; continue; } var best = 99;
        for (var dy = -RC; dy <= RC; dy++) for (var dx = -RC; dx <= RC; dx++) { var xx = gx + dx, yy = gy + dy; if (xx < 0 || yy < 0 || xx >= cw || yy >= ch) continue; if (!cwat[yy * cw + xx]) { var dd = Math.hypot(dx, dy * 1.3) * CS; if (dd < best) best = dd; } }
        cd[bi] = best; }
      iceD = { cw: cw, CS: CS, d: cd }; }
"""
s = s[:a_start] + new + s[a_end:]
s = s.replace("if (iceD[p] < jag) { var t = 0.85 * clamp(1 - iceD[p] / jag, 0.35, 1);", "var idp = iceD.d[(y / iceD.CS | 0) * iceD.cw + (x / iceD.CS | 0)]; if (idp < jag) { var t = 0.85 * clamp(1 - idp / jag, 0.35, 1);")
assert s.count("iceD.d[") == 1, 'the ice line of his file has changed: look at it'
assert "iceD = new Float32Array" not in s, 'his ice block has changed shape: look at it'
s = s.replace("// seasons_grade.js: the seasons of home's meadow", "// src/seasons.js: the game's copy of the Art Director's seasons_grade.js (assets/seasons/, 2026-10-23), made by tools/seasons_sync.py with the ice's\n// distance found on a coarse grid (the only change). The seasons of home's meadow", 1)
io.open('src/seasons.js', 'w', encoding='utf-8', newline='\n').write(s)
print('src/seasons.js rebuilt')
