# blood_drip_a: the blood dripping: three drops of water as recorded (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `blood_drip`). Raw: BigSoundBank's drops of water, at
# their own pitch, 0.4 s apart.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: blood_drip_a
# seconds: 6
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"

P = [%w[drop_1 drop_3 drop_5], %w[drop_2 drop_4 drop_6], %w[drop_3 drop_1 drop_4]]

P.each do |d|
  d.each_with_index { |x, i| at [i * 0.4] do sample C + x + ".wav", amp: 1 - 0.2 * i end }
  sleep 1.8
end
