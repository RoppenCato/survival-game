# pin_shot_v: an arrow pins a man where he stands: a thud into earth with a quiver, at the hit, about 0.4 s (the Pinning shot, shot; Clive, GD's list of 2026-10-24; the game calls `pin_shot`). An arrow striking (USC's
# shooting a man), a soft heavy thud of earth under it (Kenney's), and the shaft quivering: a plank's knock shaken fast.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: pin_shot_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

HIT = [["arrowhit_2", 0.0], ["arrowhit_3", 0.0], ["arrowhit_1", 0.11]]

define :one do |v|
  use_random_seed 11300 + v
  h, t = HIT[v]
  f = C + h + ".wav"
  sample f, start: t / sample_duration(f), amp: 1.0, attack: 0, sustain: 0.2, release: 0.12
  sample K + "impactSoft_heavy_00#{v + 2}.ogg", rate: 1.1, amp: 0.45, attack: 0, sustain: 0.1, release: 0.1
  at [0.03] do
    with_fx :tremolo, phase: 0.03, depth: 0.8, wave: 3 do
      sample K + "impactPlank_medium_00#{v + 1}.ogg", rate: 1.8, amp: 0.3, attack: 0, sustain: 0.18, release: 0.12
    end
  end
end

3.times do |v|
  one v
  sleep 1.0
end
