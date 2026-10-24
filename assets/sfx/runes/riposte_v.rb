# riposte_v: an instant flick of steel out of a parry, at the blow, about 0.25 s, bright (the Riposte, guard-blow; Clive, GD's list of 2026-10-24; the game calls `riposte`). A blade drawn fast (the seax's and
# the dagger's draws, started just before their ring), a dagger's swish, a light ting of metal (Kenney's).
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: riposte_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

DRAW = [["draw_4", 0.150], ["draw_5", 0.190], ["draw_6", 0.245]]   # 15 ms before the ring's loudest 5 ms
SWISH = %w[dagger_3 dagger_2 dagger_3]

define :one do |v|
  use_random_seed 10400 + v
  d, t = DRAW[v]
  f = C + d + ".wav"
  sample f, start: t / sample_duration(f), amp: 0.9, attack: 0, sustain: 0.12, release: 0.12
  with_fx :hpf, cutoff: 70 do sample C + SWISH[v] + ".wav", rate: 1.2, amp: 0.6, attack: 0, sustain: 0.08, release: 0.08 end
  sample K + "impactMetal_light_00#{[0, 2, 4][v]}.ogg", rate: 1.3, amp: 0.6, attack: 0, sustain: 0.1, release: 0.15
end

3.times do |v|
  one v
  sleep 0.9
end
