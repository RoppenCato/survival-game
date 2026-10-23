# storm_rise_v: the storm rising over the altar as the stones turn, about 3.5 s, once (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `storm_rise`). Stone grinding on stone (a tombstone sliding open), slowed and swelling; under it a low drone rising a fifth through a
# filter that opens, and a rising breath of noise (the wind coming up); it ends on the turn, before the strike.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: storm_rise_v
# seconds: 12
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

define :one do |v|
  use_random_seed 9000 + v
  r = 1 + rrand(-0.03, 0.03)
  sample C + %w[grind_1.wav grind_2.wav grind_1.wav][v], rate: 0.8 * r, amp: 1.0, attack: 1.2, sustain: 1.6, release: 0.7
  with_fx :lpf, cutoff: 55, cutoff_slide: 3.2 do |f|
    control f, cutoff: 82
    s = synth :saw, note: note(:d1) + v, attack: 1.5, sustain: 1.5, release: 0.5, amp: 0.3, note_slide: 3.2
    control s, note: note(:a1) + v
    synth :sine, note: note(:d2) + v, attack: 1.5, sustain: 1.5, release: 0.5, amp: 0.25
  end
  with_fx :hpf, cutoff: 70 do
    with_fx :lpf, cutoff: 95, cutoff_slide: 3.2 do |f|
      control f, cutoff: 115
      synth :bnoise, attack: 2.5, sustain: 0.6, release: 0.4, amp: 0.25
    end
  end
end

3.times do |v|
  one v
  sleep 4
end
