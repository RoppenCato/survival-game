# fish_snap_v: the line snapping (Clive, GD's fishing, 2026-10-24; the game calls `fish_snap`). The recurve's string, higher and thinner (a line, not a bowstring), a little
# of the whip's crack in front, then the slack line slipping away (a rope's slip, short).
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_snap_v
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

define :one do |v|
  use_random_seed 14500 + v
  sample B + "rc_#{[2, 3, 4][v]}.wav", rate: 1.3, amp: 1.0, attack: 0, sustain: 0.15, release: 0.1
  sample F + "whip_2949.wav", rate: 1.2, amp: 0.3, attack: 0, sustain: 0.02, release: 0.04
  at [0.05] do
    with_fx :hpf, cutoff: 75 do from FC + "rope_#{v + 1}.wav", 0.25, { rate: 1.5, amp: 0.35, attack: 0.02, sustain: 0.15, release: 0.15 } end
  end
end

3.times do |v|
  one v
  sleep 1.0
end
