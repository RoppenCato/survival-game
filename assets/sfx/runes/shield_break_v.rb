# shield_break_v: a raised shield shattered under a held blunt blow (the Hammer), at the man struck: boards splitting and the rim ringing, sharp (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `shield_break`). Boards
# splitting (the wood cracks, from just before their split), the shield's iron rim ringing (Kenney's medium metal), the
# planks rattling apart, the blunt blow's thump under it.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: shield_break_v
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

CRACK = [["woodcrack_1", 0.135], ["woodcrack_2", 0.070], ["woodcrack_4", 0.170]]

define :one do |v|
  use_random_seed 13000 + v
  r = 1 + rrand(-0.03, 0.03)
  c, t = CRACK[v]
  from C + c + ".wav", t, { rate: r, amp: 1.0, attack: 0, sustain: 0.25, release: 0.15 }
  sample K + "impactMetal_medium_00#{[0, 3, 0][v]}.ogg", rate: 0.9 * r, amp: 0.55
  at [0.03] do sample K + "impactPlank_medium_00#{v + 1}.ogg", rate: 1.05, amp: 0.35, sustain: 0.15, release: 0.15 end
  with_fx :hpf, cutoff: 45 do sample F + "lowpunch_#{v + 3}.wav", rate: 0.9, amp: 0.4, attack: 0, sustain: 0.06, release: 0.12 end
end

3.times do |v|
  one v
  sleep 1.1
end
