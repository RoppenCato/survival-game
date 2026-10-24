# lunge_v: a long step into a strike, at the blow; a heavier swish than the sword's, about 0.4 s (the Lunge, swing; Clive, GD's list of 2026-10-24; the game calls `lunge`). A step on turf, the sword's
# swish F slowed so it is heavier, an axe's swing under it (its rumble taken off).
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: lunge_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

AXE = %w[axe_1 axe_3 axe_5]

define :one do |v|
  use_random_seed 10800 + v
  r = 0.8 + rrand(-0.02, 0.02)
  sample K + "footstep_grass_00#{v + 1}.ogg", rate: 0.9, amp: 0.45
  sample SW + "swing_f.wav", rate: r, amp: 1.0, attack: 0, sustain: 0.25, release: 0.12
  with_fx :hpf, cutoff: 55 do sample C + AXE[v] + ".wav", rate: 0.95, amp: 0.7, attack: 0, sustain: 0.25, release: 0.12 end
end

3.times do |v|
  one v
  sleep 1.0
end
