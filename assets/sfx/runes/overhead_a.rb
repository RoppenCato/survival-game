# overhead_a: the heavy blow's crack, plain (the Overhead, swing; Clive, GD's list of 2026-10-24; the game calls `overhead`). A board splitting and a low punch, as recorded, together.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: overhead_a
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

CRACK = [["woodcrack_6", 0.100], ["woodcrack_3", 0.075], ["woodcrack_5", 0.095]]   # 30 ms before the split's loudest

define :one do |v|
  c, t = CRACK[v]
  f = C + c + ".wav"
  sample f, start: t / sample_duration(f), amp: 1.0, attack: 0, sustain: 0.3, release: 0.15
  sample F + "lowpunch_#{v + 2}.wav", amp: 0.6, attack: 0, sustain: 0.06, release: 0.12
end

3.times do |v|
  one v
  sleep 1.0
end
