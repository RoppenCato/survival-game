# lightning_strike_a: the bolt on the altar: the thunder cracks as recorded (deep, rolling) (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `lightning_strike`). Raw: BigSoundBank's thunder #8 and #10, from their crack.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: lightning_strike_a
# seconds: 10.6
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

P = [[C + "crack_1.wav", 1, 0, 1.5, 1.0, 1], [C + "crack_2.wav", 1, 0, 1.5, 1.0, 1], [C + "crack_3.wav", 1, 0, 1.5, 1.0, 1]]   # [file (dir + name), rate, attack, sustain, release, amp]

P.each do |f, r, at, su, re, a|
  sample f, rate: r, amp: a, attack: at, sustain: su, release: re
  sleep 3.2
end
