# lightning_small_v: Thor's wrath: a bolt on a man in a fight, shorter and lighter than the altar's (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `lightning_small`). The whip's crack and a hiss in front, a short thunder crack (BigSoundBank's thunder #10) under it, about 0.7 s.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: lightning_small_v
# seconds: 5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

define :one do |v|
  use_random_seed 9700 + v
  r = 1 + rrand(-0.04, 0.04)
  sample F + "whip_2949.wav", rate: (0.9 + 0.05 * v) * r, amp: 1.0, attack: 0, sustain: 0.03, release: 0.05
  with_fx :hpf, cutoff: 95 do
    synth :noise, attack: 0.001, sustain: 0.03, release: 0.15, amp: 0.6
  end
  at [0.02] do
    with_fx :hpf, cutoff: 50 do
      sample C + %w[crack_small_1 crack_small_2 crack_small_1][v] + ".wav", rate: 1.1 * r, amp: 0.4, attack: 0, sustain: 0.3, release: 0.35
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
