# overhead_v: a weapon brought down from above: a heavy fall and crack, at the blow, about 0.5 s (the Overhead, swing; Clive, GD's list of 2026-10-24; the game calls `overhead`). A short heavy swish into
# the blow (the axe's swing), then at 50 ms the crack (a board splitting) with a low punch and a knock of wood under it.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: overhead_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

AXE = %w[axe_3 axe_1 axe_5]
CRACK = [["woodcrack_6", 0.100], ["woodcrack_3", 0.075], ["woodcrack_5", 0.095]]   # 30 ms before the split's loudest

define :one do |v|
  use_random_seed 11000 + v
  r = 0.9 + rrand(-0.03, 0.03)
  with_fx :hpf, cutoff: 55 do sample C + AXE[v] + ".wav", start: 0.08, rate: 0.85, amp: 0.5, attack: 0, sustain: 0.05, release: 0.04 end
  at [0.05] do
    c, t = CRACK[v]
    f = C + c + ".wav"
    sample f, start: t / sample_duration(f), rate: r, amp: 1.0, attack: 0, sustain: 0.25, release: 0.15
    sample F + "lowpunch_#{v + 2}.wav", rate: r, amp: 0.5, attack: 0, sustain: 0.06, release: 0.12
    sample K + "impactWood_heavy_00#{v}.ogg", rate: 0.8, amp: 0.4, attack: 0, sustain: 0.15, release: 0.15
  end
end

3.times do |v|
  one v
  sleep 1.1
end
