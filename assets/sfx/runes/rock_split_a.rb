# rock_split_a: a rock cracking, plain (the Stone-biter, swing (the pick); Clive, GD's list of 2026-10-24; the game calls `rock_split`). Stone falling on stone, as recorded, two pieces together.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: rock_split_a
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

P = [[1, 2], [2, 5], [3, 1]]
SL = { 1 => 0.045, 2 => 0.045, 3 => 0.05, 4 => 0.237, 5 => 0.05 }   # the stones' cuts open with 45 to 240 ms before their crack
define :stone do |n, o|
  f = C + "stone_#{n}.wav"
  sample f, o.merge(start: SL[n] / sample_duration(f))
end

define :one do |v|
  stone P[v][0], { amp: 1.0, sustain: 0.3, release: 0.2 }
  at [0.03] do stone P[v][1], { amp: 0.7, sustain: 0.3, release: 0.2 } end
end

3.times do |v|
  one v
  sleep 1.0
end
