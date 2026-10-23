# rune_carve_v: the chosen stones showing their carvings: a chiselled scrape with a hum, about 2 s (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `rune_carve`). Three blade strokes on stone (BigSoundBank's knife and sickle scraped on a stone), softened under 6 kHz, a stroke every
# 0.6 s; under them the hum of a sung bowl, low, swelling and dying with the strokes.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: rune_carve_v
# seconds: 8
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

STROKES = [%w[scrape_4 scrape_2 scrape_5], %w[scrape_2 scrape_6 scrape_4], %w[scrape_5 scrape_4 scrape_1]]

define :one do |v|
  use_random_seed 9100 + v
  r = 1 + rrand(-0.03, 0.03)
  sample C + "bowlsing_1.wav", rate: 0.75 * r, amp: 0.3, attack: 0.3, sustain: 1.2, release: 0.5
  with_fx :lpf, cutoff: 116 do
    STROKES[v].each_with_index do |st, i|
      at [i * 0.6] do sample C + st + ".wav", rate: (0.95 + 0.04 * i) * r, amp: 1.0 - 0.1 * i, attack: 0.02, sustain: 0.35, release: 0.2 end
    end
  end
end

3.times do |v|
  one v
  sleep 2.6
end
