# rune_ready_a: an active rune ready: a small bowl's chime alone (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `rune_ready`). Raw: BigSoundBank's bowl struck, played higher and short.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: rune_ready_a
# seconds: 4.0
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

P = [[C + "bowl_4.wav", 1.3, 0, 0.15, 0.45, 1], [C + "bowl_3.wav", 1.3, 0, 0.15, 0.45, 1], [C + "bowl_2.wav", 1.3, 0, 0.15, 0.45, 1]]   # [file (dir + name), rate, attack, sustain, release, amp]

P.each do |f, r, at, su, re, a|
  sample f, rate: r, amp: a, attack: at, sustain: su, release: re
  sleep 1.0
end
