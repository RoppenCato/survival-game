# rune_carve_a: the carvings showing: blade strokes on stone, plain (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `rune_carve`). Raw: BigSoundBank's knife and sickle scraped on a stone, three strokes 0.45 s apart, no hum.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: rune_carve_a
# seconds: 8
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

P = [%w[scrape_4 scrape_2 scrape_5], %w[scrape_2 scrape_6 scrape_4], %w[scrape_5 scrape_4 scrape_1]]

P.each do |st|
  st.each_with_index { |x, i| at [i * 0.45] do sample C + x + ".wav", amp: 1.0 - 0.1 * i, sustain: 0.35, release: 0.2 end }
  sleep 2.6
end
