# trap_snap_v: the Tripper's jaws closing on a foot, where the trap lies: iron, short, mean (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `trap_snap`). A crossbow's string loosing
# (the medieval crossbow: a hard iron snap), a rat trap's jaws snapping (BigSoundBank's) slowed into iron, the meat of a foot caught.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: trap_snap_v
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

SNAP = [["xshot_2", 0.044], ["xshot_3", 0.057], ["xshot_4", 0.035]]   # where each snap begins in its cut

define :one do |v|
  use_random_seed 13600 + v
  r = 0.9 + rrand(-0.03, 0.03)
  s, t = SNAP[v]
  from C + s + ".wav", t, { rate: r, amp: 1.0, attack: 0, sustain: 0.1, release: 0.12 }
  from C + "rat_#{v % 2 + 1}.wav", 0.088, { rate: 0.85, amp: 0.55, attack: 0, sustain: 0.05, release: 0.08 }   # the jaws
  with_fx :hpf, cutoff: 50 do sample F + "meat_#{v + 2}.wav", rate: r, amp: 0.4, attack: 0, sustain: 0.05, release: 0.1 end
end

3.times do |v|
  one v
  sleep 0.9
end
