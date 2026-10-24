# fire_arrow_v: a burning arrow loosed: the bow's snap with a whoosh of flame, at the release, about 0.5 s (the Fire-arrow, shot; Clive, GD's list of 2026-10-24; the game calls `fire_arrow`). The recurve's snap, the flame's
# whoomph (BigSoundBank's gasoline catching fire, from just before its rise, a little faster), a few crackles after.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: fire_arrow_v
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
  use_random_seed 11400 + v
  sample B + SNAP[v] + ".wav", amp: 1.0, attack: 0, sustain: 0.15, release: 0.12
  with_fx :hpf, cutoff: 45 do sample C + "flame_1.wav", start: 0.06, rate: 1.25 + 0.05 * v, amp: 0.75, attack: 0.01, sustain: 0.22, release: 0.18 end
  at [0.12] do sample C + "crackle_1.wav", start: 0.2 * v, amp: 0.3, attack: 0.03, sustain: 0.15, release: 0.15 end
end

3.times do |v|
  one v
  sleep 1.1
end
