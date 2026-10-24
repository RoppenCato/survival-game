# berserk_roar_a: the hero's roar, plain (Berserk, heart; Clive, GD's list of 2026-10-24; the game calls `berserk_roar`). The deepest of the men's yells, a little slower, from their voice.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: berserk_roar_a
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

YELL = [["1yell10", 0.077], ["1yell12", 0.293], ["1yell8", 0.225]]   # [yell, where its voice begins: the files open with up to 0.6 s of room]

define :one do |v|
  y, t = YELL[v]
  f = Y + y + ".wav"
  sample f, start: t / sample_duration(f), rate: 0.85, amp: 1.0, attack: 0, sustain: 0.58, release: 0.12
end

3.times do |v|
  one v
  sleep 1.2
end
