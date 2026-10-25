# fish_plop_a: a small cork float landing on calm water, plain (Clive, GD's fishing, 2026-10-24; the game calls `fish_plop`). A small stone thrown into a pond (BigSoundBank's), as recorded.
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_plop_a
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
FC = "C:/dev/SG/Sound Director/sfx/fishing/ref/cut/"
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
W = "C:/dev/SG/Sound Director/sfx/weather/ref/cut/"
S = "C:/dev/SG/Sound Director/sfx/ships/ref/cut/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
define :from do |f, t, o|                   # a piece started t seconds in (at its sound)
  sample f, o.merge(start: t / sample_duration(f))
end

P = [["plop_3", 0.015], ["plop_2", 0.01], ["plop_6", 0.08]]

define :one do |v|
  f, t = P[v]
  from FC + f + ".wav", t, { amp: 1.0, attack: 0, sustain: 0.3, release: 0.15 }
end

3.times do |v|
  one v
  sleep 1.0
end
