# leap_land_v: the landing on turf after a running jump, about 0.35 s (the Long leap, dash; Clive, GD's list of 2026-10-24; the game calls `leap_land`). Two feet on grass at once (Kenney's grass steps,
# 8 ms apart, a little heavier), a body's weight under them, short.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: leap_land_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

define :one do |v|
  use_random_seed 10700 + v
  r = 0.85 + rrand(-0.03, 0.03)
  sample K + "footstep_grass_00#{v}.ogg", rate: r, amp: 1.0
  at [0.008] do sample K + "footstep_grass_00#{v + 2}.ogg", rate: r * 0.95, amp: 0.8 end
  with_fx :lpf, cutoff: 88 do sample C + "fall_4.wav", rate: 1.1, amp: 0.35, attack: 0, sustain: 0.12, release: 0.1 end
  sample K + "impactSoft_heavy_00#{v}.ogg", rate: 1.0, amp: 0.2, attack: 0, sustain: 0.08, release: 0.1
end

3.times do |v|
  one v
  sleep 1.0
end
