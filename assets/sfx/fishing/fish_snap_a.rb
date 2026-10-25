# fish_snap_a: the line snapping, plain (Clive, GD's fishing, 2026-10-24; the game calls `fish_snap`). The recurve's string loosing (your bow B's recordings), as recorded.
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_snap_a
# seconds: 3
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

define :one do |v|
  sample B + "rc_#{[2, 3, 4][v]}.wav", amp: 1.0, attack: 0, sustain: 0.2, release: 0.12
end

3.times do |v|
  one v
  sleep 0.9
end
