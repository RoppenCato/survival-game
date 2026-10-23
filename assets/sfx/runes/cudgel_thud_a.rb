# cudgel_thud_a: the cudgel knocking a beast out: a heavy punch as recorded (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `cudgel_thud`). Raw: Kenney's heavy punches (CC0), a
# little slower.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: cudgel_thud_a
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"

3.times do |v|
  sample K + "impactPunch_heavy_00#{v + 1}.ogg", rate: 0.9, amp: 1
  sleep 1.0
end
