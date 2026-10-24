# rock_split_v: one blow in three cracks the rock whole, at the blow, about 0.5 s: a deep crack with falling pieces (the Stone-biter, swing (the pick); Clive, GD's list of 2026-10-24; the game calls `rock_split`). A stone's sharp crack (BigSoundBank's
# fall of stone), a deep crack under it (thunder #10's first crack, short), the pick's rock hit (Kenney's), pieces falling.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: rock_split_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SL = { 1 => 0.045, 2 => 0.045, 3 => 0.05, 4 => 0.237, 5 => 0.05 }   # the stones' cuts open with 45 to 240 ms before their crack
define :stone do |n, o|
  f = C + "stone_#{n}.wav"
  sample f, o.merge(start: SL[n] / sample_duration(f))
end

define :one do |v|
  use_random_seed 11500 + v
  r = 0.9 + rrand(-0.03, 0.03)
  stone v + 1, { rate: r, amp: 1.0, attack: 0, sustain: 0.2, release: 0.15 }
  sample C + "crack_small_#{v % 2 + 1}.wav", rate: 1.3, amp: 0.35, attack: 0, sustain: 0.15, release: 0.2
  sample K + "impactMining_00#{v + 1}.ogg", rate: 0.8, amp: 0.22, attack: 0, sustain: 0.12, release: 0.12
  [0.14, 0.24, 0.36].each_with_index { |t, i| at [t] do stone (v + i + 2) % 5 + 1, { rate: rrand(1.2, 1.5), amp: 0.3 - 0.07 * i, sustain: 0.06, release: 0.1 } end }
end

3.times do |v|
  one v
  sleep 1.1
end
