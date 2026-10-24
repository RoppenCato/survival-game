# stone_break_v: the two other stones breaking, just after the strike (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `stone_break`). Two shatters a quarter of a second apart, each made of three stone clicks in 50 ms (BigSoundBank's fall of stone), a rock
# hit (Kenney's mining impact) and a low thump; then a little debris trickling.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: stone_break_v
# seconds: 8
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

SL = { 1 => 0.045, 2 => 0.045, 3 => 0.05, 4 => 0.237, 5 => 0.05 }   # the stones' cuts open with 45 to 240 ms before their crack
define :stone do |n, o|
  f = C + "stone_#{n}.wav"
  sample f, o.merge(start: SL[n] / sample_duration(f))
end

define :shatter do |r, a, k|
  [0, 0.02, 0.05].each_with_index { |t, i| at [t] do stone (k + i) % 5 + 1, { rate: (0.9 + 0.1 * i) * r, amp: a * 0.9, sustain: 0.3, release: 0.3 } end }
  sample K + "impactMining_00#{k % 5}.ogg", rate: 0.85 * r, amp: a * 0.6
  sample K + "impactWood_heavy_00#{k % 5}.ogg", rate: 0.6 * r, amp: a * 0.15
end

define :one do |v|
  use_random_seed 9300 + v
  r = 1 + rrand(-0.04, 0.04)
  shatter r, 1.0, v
  at [0.25] do shatter r * 0.95, 0.85, v + 2 end
  [0.45, 0.6, 0.78, 0.95].each_with_index { |t, i| at [t] do stone (v + i) % 5 + 1, { rate: rrand(1.1, 1.4), amp: 0.25 - 0.04 * i, sustain: 0.12, release: 0.2 } end }
end

3.times do |v|
  one v
  sleep 2.4
end
