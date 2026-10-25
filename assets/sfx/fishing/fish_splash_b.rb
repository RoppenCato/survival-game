# fish_splash_b: the fish breaking the surface, plain: an oar's stroke (Clive, GD's fishing, 2026-10-24; the game calls `fish_splash`). An oar dipped and pulled (the ships' rowing), as recorded, from just before its splash.
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_splash_b
# seconds: 5
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

OAR = [[1, 0.30], [3, 0.44], [5, 0.38]]   # [stroke, 80 ms before its loudest]

define :one do |v|
  k, t = OAR[v]
  from S + "oar_quick_#{k}.wav", t, { amp: 1.0, attack: 0.01, sustain: 0.4, release: 0.25 }
end

3.times do |v|
  one v
  sleep 1.4
end
