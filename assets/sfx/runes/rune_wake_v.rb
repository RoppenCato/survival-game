# rune_wake_v: a rune bound: the carving fills, a low thrum and a short bright tail, about 1.5 s (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `rune_wake`). The sung bowl's thrum, low and swelling, a low hum pulsing under it (the carving filling), then a struck bowl ringing out bright from 0.3 s (the rune
# awake), cut to 1.5 s.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: rune_wake_v
# seconds: 8
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

STRUCK = %w[bowl_1 bowl_3 bowl_4]

define :one do |v|
  use_random_seed 9500 + v
  r = 1 + rrand(-0.02, 0.02)
  sample C + "bowlsing_1.wav", rate: 0.5 * r, amp: 0.8, attack: 0.25, sustain: 0.3, release: 0.35
  with_fx :tremolo, phase: 0.09, depth: 0.45, wave: 3 do
    synth :sine, note: :d2, attack: 0.25, sustain: 0.35, release: 0.6, amp: 0.45
  end
  at [0.3] do sample C + STRUCK[v] + ".wav", rate: r, amp: [1.0, 0.8, 0.8][v], attack: 0, sustain: 0.4, release: 0.8 end
end

3.times do |v|
  one v
  sleep 2.2
end
