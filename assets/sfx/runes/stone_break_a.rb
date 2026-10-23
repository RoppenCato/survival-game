# stone_break_a: the stones breaking: stone on stone as recorded, two a quarter of a second apart (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `stone_break`). Raw: BigSoundBank's fall of stone,
# two pieces each.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: stone_break_a
# seconds: 7
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"

P = [%w[stone_1 stone_3], %w[stone_2 stone_4], %w[stone_5 stone_1]]

P.each do |a, b|
  sample C + a + ".wav", amp: 1, sustain: 0.4, release: 0.4
  at [0.25] do sample C + b + ".wav", amp: 0.85, sustain: 0.4, release: 0.4 end
  sleep 2
end
