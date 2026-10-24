# axe_catch_b: the axe caught, plain: a knock of wood (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `axe_catch`). Rubberduck's wood hit, small, as recorded: the haft into the hand.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: axe_catch_b
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

define :one do |v|
  sample RD + "wood_hit_0#{[5, 7, 8][v]}.ogg", rate: 1.2, amp: 1.0, attack: 0, sustain: 0.06, release: 0.1
end

3.times do |v|
  one v
  sleep 0.8
end
