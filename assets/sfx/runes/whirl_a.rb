# whirl_a: a long swing round, plain (the Whirl, swing; Clive, GD's list of 2026-10-24; the game calls `whirl`). A spear's swing as recorded, slowed to cover the turn, its rumble taken off.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: whirl_a
# seconds: 4.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SPEAR = %w[spear_1 spear_3 spear_2]

define :one do |v|
  with_fx :hpf, cutoff: 55 do
    sample C + SPEAR[v] + ".wav", rate: 0.72, amp: 1.0, attack: 0, sustain: 0.45, release: 0.15
  end
end

3.times do |v|
  one v
  sleep 1.3
end
