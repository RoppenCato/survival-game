# storm_gather_a: the power gathering before the bolt, plain: a thunder roll played backwards, 2.6 s, ending on its crack
# as the bolt comes (Clive, GD's rite, 2026-10-23; the game calls `storm_gather`). BigSoundBank's thunder #8 and #10, CC0.
# name: storm_gather_a
# seconds: 11
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
T = 2.6
REV = [["crack_1", 0.078], ["crack_3", 0.020], ["crack_2", 0.048]]   # the crack's peak, as a part of the 3 s file

REV.each do |f, pk|
  sample C + f + ".wav", start: pk + T / 3.0, finish: pk, amp: 1.0, attack: 0.3, sustain: T - 0.34, release: 0.04
  sleep 3.6
end
