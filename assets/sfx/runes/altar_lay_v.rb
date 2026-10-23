# altar_lay_v: a beast laid on the altar stone: a sack-like thump, hooves (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `altar_lay`). A body laid down (BigSoundBank's body fall), and two small knocks of hooves on the stone after it (rubberduck's wood
# hammer and hit, small and quiet).
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: altar_lay_v
# seconds: 6
# count: 3

use_bpm 60                                  # times in seconds
LEAD = { "fall_1" => 0.157, "fall_3" => 0.249 }   # the falls' thump comes late in their file
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

FALL = %w[fall_4 fall_1 fall_3]

define :one do |v|
  use_random_seed 9900 + v
  r = 1 + rrand(-0.03, 0.03)
  ff = C + FALL[v] + ".wav"
  sample ff, start: (LEAD[FALL[v]] || 0) / sample_duration(ff), rate: r, amp: 1.0, attack: 0, sustain: 0.6, release: 0.3
  at [0.18] do sample RD + "wood_hammer_02.ogg", rate: 1.4 * r, amp: 0.45 end
  at [0.33] do sample RD + "wood_hit_05.ogg", rate: 1.5 * r, amp: 0.35 end
end

3.times do |v|
  one v
  sleep 1.7
end
