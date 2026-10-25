# fish_splash_v: the fish breaking the surface on a run (also the hook going in, a fish darting off) (Clive, GD's fishing, 2026-10-24; the game calls `fish_splash`). A splash (the
# weather's, from the pond stones), an oar's swirl under it for the body of the fish, a few drops falling back.
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_splash_v
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

define :one do |v|
  use_random_seed 14300 + v
  r = 1 + rrand(-0.05, 0.05)
  sample W + "splash_#{[4, 1, 3][v]}.wav", rate: r, amp: 1.0, attack: 0, sustain: 0.4, release: 0.2
  sample S + "oar_quick_#{[2, 4, 1][v]}.wav", rate: 1.1 * r, amp: 0.5, attack: 0.02, sustain: 0.3, release: 0.2
  [0.25, 0.38, 0.5].each_with_index { |t, i| at [t] do sample C + "drop_#{(v + i) % 6 + 1}.wav", rate: rrand(1.1, 1.4), amp: 0.3 - 0.07 * i end }
end

3.times do |v|
  one v
  sleep 1.4
end
