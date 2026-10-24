# last_stand_v: a killing blow leaves him one health: a heartbeat and a gasp, about 0.6 s (the Last stand, heart; Clive, GD's list of 2026-10-24; the game calls `last_stand`). One heartbeat, dry and
# deep (BigSoundBank's), and a man's breath drawn in hard on the second beat.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: last_stand_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

HEART = [["heart_1", 1.0], ["heart_2", 1.0], ["heart_1", 0.9]]
BREATH = %w[breath_1 breath_3 breath_4]

define :one do |v|
  h, r = HEART[v]
  sample C + h + ".wav", rate: r, amp: 1.0, attack: 0, sustain: 0.4, release: 0.2
  at [0.16] do
    with_fx :hpf, cutoff: 55 do sample C + BREATH[v] + ".wav", amp: 0.45, attack: 0.02, sustain: 0.3, release: 0.12 end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
