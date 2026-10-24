# war_cry_a: the hero's shout, plain (the War-cry, guard-blow; Clive, GD's list of 2026-10-24; the game calls `war_cry`). A man's yell as recorded, cut at 0.8 s.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: war_cry_a
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

YELL = [["3yell15", 0.07], ["3yell2", 0.24], ["3yell10", 0.2]]   # [yell, where its voice begins: the files open with up to 0.6 s of room]

define :one do |v|
  y, t = YELL[v]
  f = Y + y + ".wav"
  sample f, start: t / sample_duration(f), amp: 1.0, attack: 0, sustain: 0.68, release: 0.12
end

3.times do |v|
  one v
  sleep 1.2
end
