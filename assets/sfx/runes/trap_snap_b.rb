# trap_snap_b: the trap's jaws closing, plain: a rat trap (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `trap_snap`). BigSoundBank's rat traps snapping shut, as recorded.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: trap_snap_b
# seconds: 3
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

SNAP = [["rat_1", 0.08], ["rat_2", 0.08], ["rat_1", 0.08]]

define :one do |v|
  s, t = SNAP[v]
  from C + s + ".wav", t, { rate: [1.0, 1.0, 0.9][v], amp: 1.0, attack: 0, sustain: 0.12, release: 0.12 }
end

3.times do |v|
  one v
  sleep 0.8
end
