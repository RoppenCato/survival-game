# lightning_small_a: Thor's wrath: a short thunder crack as recorded (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `lightning_small`). Raw: BigSoundBank's thunder #10, its first
# crack, 0.7 s.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: lightning_small_a
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"

P = %w[crack_small_1 crack_small_2 crack_small_1]

P.each_with_index do |x, i|
  sample C + x + ".wav", rate: 1 + 0.05 * i, amp: 1, sustain: 0.3, release: 0.4
  sleep 1.3
end
