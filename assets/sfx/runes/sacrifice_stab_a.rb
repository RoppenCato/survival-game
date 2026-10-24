# sacrifice_stab_a: the knife into the beast on the altar, plain (Clive, GD's rite, 2026-10-23; the game calls
# `sacrifice_stab`). Two recordings and nothing else: the meat of a punch and a wet splat on the same moment (the flesh
# set's, qubodup's and Independent.nu's, CC0).
# name: sacrifice_stab_a
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
P = [%w[meat_2 splat_6], %w[meat_4 splat_1], %w[meat_3 splat_6]]

P.each do |m, s|
  sample F + m + ".wav", amp: 1.0, sustain: 0.1, release: 0.15
  sample F + s + ".wav", amp: 0.6, sustain: 0.15, release: 0.2
  sleep 1.0
end
