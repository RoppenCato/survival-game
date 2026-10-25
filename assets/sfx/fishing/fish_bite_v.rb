# fish_bite_v: the float bobbing under (Clive, GD's fishing, 2026-10-24; the game calls `fish_bite`). A drop, sharp, with a tiny tug of the line on it (a rope's pull, short and high).
# Recordings, all CC0: BigSoundBank's small stones into a pond, sliding ropes, water drops and the oar strokes; the sword's
# swishes; the recurve's snap (Robin's bow B); the flesh set's splats and slaps. Cut at their sound (`ref/cut/` folders).
# name: fish_bite_v
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
  sample C + "drop_#{[2, 4, 6][v]}.wav", amp: 1.0
  at [0.01] do
    with_fx :hpf, cutoff: 80 do sample FC + "pull_#{[2, 3, 2][v]}.wav", rate: 1.6, amp: 0.3, attack: 0, sustain: 0.05, release: 0.06 end
  end
end

3.times do |v|
  one v
  sleep 0.8
end
