# altar_lay_a: a beast laid on the altar: body falls, plain (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `altar_lay`). Raw: BigSoundBank's body falls.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: altar_lay_a
# seconds: 5.8
# count: 3

use_bpm 60                                  # times in seconds
LEAD = { "fall_1" => 0.157, "fall_3" => 0.249 }   # the falls' thump comes late in their file
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

P = [[C + "fall_4.wav", 1, 0, 0.6, 0.3, 1], [C + "fall_1.wav", 1, 0, 0.6, 0.3, 1], [C + "fall_3.wav", 1, 0, 0.6, 0.3, 1]]   # [file (dir + name), rate, attack, sustain, release, amp]

P.each do |f, r, at, su, re, a|
  sample f, start: (LEAD[File.basename(f, ".wav")] || 0) / sample_duration(f), rate: r, amp: a, attack: at, sustain: su, release: re
  sleep 1.6
end
