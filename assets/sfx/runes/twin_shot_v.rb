# twin_shot_v: two or three arrows loosed at once, at the release: a doubled bow snap, about 0.3 s (the Twin shot, shot; Clive, GD's list of 2026-10-24; the game calls `twin_shot`). Three snaps of the recurve
# (your shot B's recordings), 12 and 26 ms apart, each a little quieter: the fan of three.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: twin_shot_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SNAP = [%w[rc_1 rc_3 rc_2], %w[rc_2 rc_4 rc_3], %w[rc_3 rc_1 rc_4]]

define :one do |v|
  [[0, 1.0, 1.0], [0.012, 0.8, 0.97], [0.026, 0.6, 1.03]].each_with_index do |(t, a, r), i|
    at [t] do sample B + SNAP[v][i] + ".wav", rate: r, amp: a, attack: 0, sustain: 0.18, release: 0.12 end
  end
end

3.times do |v|
  one v
  sleep 0.9
end
