# leap_land_a: two feet landing on grass, plain (the Long leap, dash; Clive, GD's list of 2026-10-24; the game calls `leap_land`). Kenney's grass steps, two at once.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: leap_land_a
# seconds: 3
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

define :one do |v|
  sample K + "footstep_grass_00#{v}.ogg", amp: 1.0
  at [0.008] do sample K + "footstep_grass_00#{v + 2}.ogg", amp: 0.8 end
end

3.times do |v|
  one v
  sleep 1.0
end
