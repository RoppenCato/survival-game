# blood_drip_v: the hero's blood dripping into a carving at the altar, 1.2 s, a few drops (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `blood_drip`). Three drops (BigSoundBank's drops of water) played slower so they are thicker and darker, a little further apart each
# time, each quieter: blood, not water.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: blood_drip_v
# seconds: 6
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

DROPS = [%w[drop_1 drop_3 drop_5], %w[drop_2 drop_4 drop_6], %w[drop_3 drop_1 drop_4]]

define :one do |v|
  use_random_seed 9400 + v
  r = 0.78 + rrand(-0.03, 0.03)
  with_fx :lpf, cutoff: 108 do
    [[0, 1.0], [0.38, 0.8], [0.82, 0.6]].each_with_index { |(t, a), i| at [t] do sample C + DROPS[v][i] + ".wav", rate: r * (1 - 0.03 * i), amp: a end }
  end
end

3.times do |v|
  one v
  sleep 1.8
end
