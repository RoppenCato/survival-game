# blink_step_a: a soft whip of air, plain (the Blink-step, dash; Clive, GD's list of 2026-10-24; the game calls `blink_step`). A spear's swish as recorded, its low rumble taken off.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: blink_step_a
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SWISH = %w[spear_3 spear_4 spear_2]

define :one do |v|
  with_fx :hpf, cutoff: 62 do
    sample C + SWISH[v] + ".wav", rate: 1.2, amp: 1.0, attack: 0, sustain: 0.2, release: 0.1
  end
end

3.times do |v|
  one v
  sleep 0.9
end
