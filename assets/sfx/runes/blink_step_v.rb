# blink_step_v: he steps through the man before him: a soft whip of air, about 0.3 s (the Blink-step, dash; Clive, GD's list of 2026-10-24; the game calls `blink_step`). The sword's swish (E, F) played
# faster and softened under 3.5 kHz, a little of it drawn in backwards first, as if the air closes behind him.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: blink_step_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

SWS = %w[swing_e swing_f swing_e]

define :one do |v|
  use_random_seed 10600 + v
  f = SW + SWS[v] + ".wav"
  with_fx :lpf, cutoff: 105 do
    sample f, rate: -1.6, start: 0.0, finish: 0.35, amp: 0.35, attack: 0.02, sustain: 0.04, release: 0.03
    at [0.07] do sample f, rate: 1.4 + 0.05 * v, amp: 0.8, attack: 0, sustain: 0.12, release: 0.1 end
  end
end

3.times do |v|
  one v
  sleep 0.9
end
