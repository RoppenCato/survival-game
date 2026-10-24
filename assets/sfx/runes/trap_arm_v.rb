# trap_arm_v: a soft click as the trap sets, three seconds after it lands (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `trap_arm`). A crossbow's catch clicking home (the medieval
# crossbow's mechanism) with a tiny ring of iron.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: trap_arm_v
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

CLICK = [["click_2", 0.028], ["click_4", 0.032], ["click_3", 0.036]]   # where each click begins

define :one do |v|
  c, t = CLICK[v]
  from C + c + ".wav", t, { amp: 1.0, attack: 0, sustain: 0.06, release: 0.08 }
  sample K + "impactMetal_light_00#{[2, 0, 4][v]}.ogg", rate: 1.7, amp: 0.15, attack: 0, sustain: 0.04, release: 0.1
end

3.times do |v|
  one v
  sleep 0.7
end
