# fish_land_v: a wet fish landing and flapping (Clive, GD's fishing, 2026-10-24; the game calls `fish_land`). A wet splat as it lands, then the tail slapping three or four times,
# quick and getting weaker (the flesh set's slaps, small and wet).
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_land_v
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

SL = [%w[slap_03 slap_07 slap_12 slap_07], %w[slap_12 slap_03 slap_07 slap_03], %w[slap_07 slap_12 slap_03 slap_12]]

define :one do |v|
  use_random_seed 14600 + v
  sample F + "splat_#{[6, 4, 1][v]}.wav", amp: 1.0, attack: 0, sustain: 0.2, release: 0.15
  [0.16, 0.25, 0.36, 0.5].each_with_index do |t, i|
    at [t + rrand(0, 0.02)] do
      sample F + SL[v][i] + ".wav", rate: rrand(1.1, 1.3), amp: 0.55 - 0.1 * i, attack: 0, sustain: 0.04, release: 0.06
      sample F + "splat_#{[1, 6, 4][v]}.wav", rate: 1.6, amp: 0.15 - 0.03 * i, attack: 0, sustain: 0.04, release: 0.06
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
