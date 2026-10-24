# riposte_a: a blade's flick, plain (the Riposte, guard-blow; Clive, GD's list of 2026-10-24; the game calls `riposte`). A blade drawn fast as recorded, from just before its ring.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: riposte_a
# seconds: 3
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

DRAW = [["draw_4", 0.125], ["draw_5", 0.165], ["draw_6", 0.220]]   # 40 ms before the ring's loudest 5 ms

define :one do |v|
  d, t = DRAW[v]
  f = C + d + ".wav"
  sample f, start: t / sample_duration(f), amp: 1.0, attack: 0, sustain: 0.13, release: 0.12
end

3.times do |v|
  one v
  sleep 0.8
end
