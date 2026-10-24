# axe_throw_v: the Throwing axe leaves the hand spinning, at the hero: a whoosh with a flutter in it (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `axe_throw`). An axe's swing
# (the medieval Axe Swing, its rumble off) shaken fast so it flutters like a blade turning over and over, a dagger's
# swish on top for the edge.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: axe_throw_v
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

AXE = %w[axe_2 axe_4 axe_3]

define :one do |v|
  use_random_seed 13100 + v
  r = 1.05 + rrand(-0.04, 0.04)
  with_fx :hpf, cutoff: 62 do
    with_fx :tremolo, phase: 0.055, depth: 0.5, wave: 1 do
      sample C + AXE[v] + ".wav", rate: r * 0.92, amp: 1.0, attack: 0, sustain: 0.36, release: 0.15
    end
    sample C + "dagger_#{v + 1}.wav", rate: 0.95, amp: 0.4, attack: 0, sustain: 0.15, release: 0.1
  end
end

3.times do |v|
  one v
  sleep 1.0
end
