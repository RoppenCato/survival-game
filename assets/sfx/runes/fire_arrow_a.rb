# fire_arrow_a: the bow's snap and the flame, plain (the Fire-arrow, shot; Clive, GD's list of 2026-10-24; the game calls `fire_arrow`). The recurve's snap and the gasoline's whoomph, as recorded.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: fire_arrow_a
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SNAP = %w[rc_2 rc_3 rc_4]

define :one do |v|
  sample B + SNAP[v] + ".wav", amp: 1.0, attack: 0, sustain: 0.15, release: 0.12
  sample C + "flame_1.wav", start: 0.06, amp: 0.7, attack: 0.01, sustain: 0.25, release: 0.2
end

3.times do |v|
  one v
  sleep 1.1
end
