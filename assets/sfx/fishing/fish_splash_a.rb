# fish_splash_a: the fish breaking the surface, plain (Clive, GD's fishing, 2026-10-24; the game calls `fish_splash`). Stones into a pond as recorded, a different one each time.
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_splash_a
# seconds: 4
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

P = [["plop_5", 0.0], ["plop_4", 0.0], ["plop_1", 0.035]]   # 1 the hook going in (the sharp one), 2 a run (the big one), 3 a fish darting off (Clive, GD's order)

define :one do |v|
  f, t = P[v]
  from FC + f + ".wav", t, { rate: 0.9, amp: 1.0, attack: 0, sustain: 0.45, release: 0.2 }
end

3.times do |v|
  one v
  sleep 1.3
end
