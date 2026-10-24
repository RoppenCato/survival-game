# trap_throw_v: a small iron trap tossed underhand, where the trap is (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `trap_throw`). A small chain's jingle (BigSoundBank's),
# softened, a soft swish of the throw under it.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: trap_throw_v
# seconds: 3.5
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
  use_random_seed 13300 + v
  with_fx :lpf, cutoff: 110 do
    sample C + "chain_1.wav", start: [0.0, 0.12, 0.06][v], rate: 0.7 + 0.04 * v, amp: 1.0, attack: 0.01, sustain: 0.25, release: 0.15
  end
  with_fx :hpf, cutoff: 70 do sample C + "dagger_#{v + 1}.wav", rate: 0.8, amp: 0.4, attack: 0, sustain: 0.15, release: 0.1 end
end

3.times do |v|
  one v
  sleep 1.0
end
