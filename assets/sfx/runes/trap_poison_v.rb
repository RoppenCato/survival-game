# trap_poison_v: a clay pot breaking with a wet hiss, where the trap lies (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `trap_poison`). Clay breaking: a stone's crack and its
# shards (BigSoundBank's fall of stone) with a glass ball's break slowed and dulled under it (no free clay pot exists),
# a wet splat as the poison spills, and a hiss rising out of it (BigSoundBank's steam).
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: trap_poison_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
SL = { 1 => 0.045, 2 => 0.045, 3 => 0.05, 4 => 0.237, 5 => 0.05 }   # the stones' cuts open before their crack
define :stone do |n, o|
  f = C + "stone_#{n}.wav"
  sample f, o.merge(start: SL[n] / sample_duration(f))
end
define :from do |f, t, o|                   # a piece started t seconds in (at its sound)
  sample f, o.merge(start: t / sample_duration(f))
end

define :one do |v|
  use_random_seed 13700 + v
  r = 1 + rrand(-0.03, 0.03)
  stone v + 1, { rate: 0.85 * r, amp: 1.0, attack: 0, sustain: 0.2, release: 0.15 }
  with_fx :lpf, cutoff: 105 do sample C + "glass_1.wav", start: 0.09, rate: 0.6, amp: 0.4, attack: 0, sustain: 0.25, release: 0.2 end
  at [0.02] do
    with_fx :hpf, cutoff: 56 do sample F + "splat_#{[6, 1, 6][v]}.wav", rate: 0.9, amp: 0.5, attack: 0, sustain: 0.1, release: 0.15 end
  end
  at [0.08] do sample C + "hiss_2.wav", start: 0.25, amp: 0.45, attack: 0.08, sustain: 0.3, release: 0.35 end
end

3.times do |v|
  one v
  sleep 1.4
end
