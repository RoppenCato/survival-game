# guard_break_v: an axe breaks a man's shield guard: wood splitting with a knock, at the blow, about 0.4 s (the Axe-breaker, hand; Clive, GD's list of 2026-10-24; the game calls `guard_break`). A board splitting
# (Independent.nu's wood cracks, from their crack), a heavy knock of wood under it and a plank's rattle (Kenney's).
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: guard_break_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

CRACK = [["woodcrack_1", 0.135], ["woodcrack_2", 0.070], ["woodcrack_4", 0.170]]   # 30 ms before the split's loudest

define :one do |v|
  use_random_seed 10500 + v
  r = 1 + rrand(-0.03, 0.03)
  c, t = CRACK[v]
  f = C + c + ".wav"
  sample f, start: t / sample_duration(f), rate: r, amp: 1.0, attack: 0, sustain: 0.25, release: 0.13
  sample K + "impactWood_heavy_00#{v + 2}.ogg", rate: 0.9 * r, amp: 0.5, attack: 0, sustain: 0.15, release: 0.15
  at [0.04] do sample K + "impactPlank_medium_00#{v}.ogg", rate: 1.1, amp: 0.3, attack: 0, sustain: 0.15, release: 0.15 end
end

3.times do |v|
  one v
  sleep 1.0
end
