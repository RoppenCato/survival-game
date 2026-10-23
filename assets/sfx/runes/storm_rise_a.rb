# storm_rise_a: the storm rising: the stones grinding as they turn, plain (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `storm_rise`). Raw: a tombstone sliding open (BigSoundBank), 3.5 s, faded in and out.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: storm_rise_a
# seconds: 13.6
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

P = [[C + "grind_1.wav", 1, 0.6, 2.3, 0.6, 1], [C + "grind_1.wav", 0.9, 0.6, 2.3, 0.6, 1], [C + "grind_2.wav", 1, 0.5, 2.0, 0.5, 1]]   # [file (dir + name), rate, attack, sustain, release, amp]

P.each do |f, r, at, su, re, a|
  sample f, rate: r, amp: a, attack: at, sustain: su, release: re
  sleep 4.2
end
