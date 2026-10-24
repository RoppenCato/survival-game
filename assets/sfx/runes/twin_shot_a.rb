# twin_shot_a: two bow snaps, plain (the Twin shot, shot; Clive, GD's list of 2026-10-24; the game calls `twin_shot`). Two snaps of the recurve 18 ms apart.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: twin_shot_a
# seconds: 3
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SNAP = [%w[rc_1 rc_3], %w[rc_2 rc_4], %w[rc_3 rc_1]]

define :one do |v|
  sample B + SNAP[v][0] + ".wav", amp: 1.0, attack: 0, sustain: 0.18, release: 0.12
  at [0.018] do sample B + SNAP[v][1] + ".wav", amp: 0.85, attack: 0, sustain: 0.18, release: 0.12 end
end

3.times do |v|
  one v
  sleep 0.9
end
