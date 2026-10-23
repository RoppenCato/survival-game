# rune_wake_a: a rune bound: a struck bowl, plain (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `rune_wake`). Raw: BigSoundBank's Tibetan bowls struck, cut to 1.5 s.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: rune_wake_a
# seconds: 7.0
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

P = [[C + "bowl_2.wav", 1, 0, 0.6, 0.9, 1], [C + "bowl_3.wav", 1, 0, 0.6, 0.9, 1], [C + "bowl_4.wav", 1, 0, 0.6, 0.9, 1]]   # [file (dir + name), rate, attack, sustain, release, amp]

P.each do |f, r, at, su, re, a|
  sample f, rate: r, amp: a, attack: at, sustain: su, release: re
  sleep 2.0
end
