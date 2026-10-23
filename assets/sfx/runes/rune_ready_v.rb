# rune_ready_v: an active rune's blood ring full: a small cue by the toolbar, in a fight (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `rune_ready`). A heartbeat, low and short (two soft beats, lub-dub), and a tiny chime of a bowl on the second, high and quiet: noticed,
# never in the way.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: rune_ready_v
# seconds: 5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

define :one do |v|
  use_random_seed 9600 + v
  r = 1 + rrand(-0.02, 0.02)
  sample :bd_pure, rate: 0.55 * r, amp: 0.9, sustain: 0.05, release: 0.25
  at [0.2] do sample :bd_pure, rate: 0.6 * r, amp: 0.65, sustain: 0.05, release: 0.25 end
  at [0.2] do sample C + %w[bowl_3 bowl_4 bowl_2][v] + ".wav", rate: 1.5 * r, amp: 0.3, attack: 0, sustain: 0.1, release: 0.35 end
end

3.times do |v|
  one v
  sleep 1.4
end
