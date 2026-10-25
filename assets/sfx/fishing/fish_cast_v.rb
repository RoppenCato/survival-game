# fish_cast_v: the cast: a rod's whip and the line hissing out (Clive, GD's fishing, 2026-10-24; the game calls `fish_cast`). The sword's swish E thin and quick for the rod,
# then the line running out after it (a rope slipping, faster and lighter), dying away.
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_cast_v
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

R = [["rope_2", 0.15], ["rope_1", 0.2], ["rope_3", 0.15]]

define :one do |v|
  use_random_seed 14000 + v
  with_fx :hpf, cutoff: 60 do sample SW + "swing_e.wav", rate: 1.25, amp: 1.0, attack: 0, sustain: 0.2, release: 0.1 end
  at [0.12] do
    f, t = R[v]
    with_fx :hpf, cutoff: 70 do from FC + f + ".wav", t, { rate: 1.35, amp: 0.6, attack: 0.03, sustain: 0.3, release: 0.3 } end
  end
end

3.times do |v|
  one v
  sleep 1.4
end
