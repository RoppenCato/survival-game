# sweep_v: a low wide spear sweep that staggers every man in its arc, at the blow, about 0.45 s (the Sweep, swing; Clive, GD's list of 2026-10-24; the game calls `sweep`). A spear's swing slowed and
# low, the sword's swish E under it, and a brush of grass as the shaft passes low.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: sweep_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SPEAR = %w[spear_2 spear_1 spear_4]

define :one do |v|
  use_random_seed 11100 + v
  r = 0.85 + rrand(-0.02, 0.02)
  with_fx :hpf, cutoff: 52 do sample C + SPEAR[v] + ".wav", rate: r, amp: 1.0, attack: 0, sustain: 0.32, release: 0.12 end
  sample SW + "swing_e.wav", rate: 0.75, amp: 0.5, attack: 0, sustain: 0.3, release: 0.12
  at [0.12] do
    with_fx :lpf, cutoff: 100 do sample K + "footstep_grass_00#{v + 1}.ogg", rate: 1.4, amp: 0.25 end
  end
end

3.times do |v|
  one v
  sleep 1.1
end
