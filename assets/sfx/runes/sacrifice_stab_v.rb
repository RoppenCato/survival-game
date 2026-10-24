# sacrifice_stab_v: the knife driven into the beast on the altar, a thump and a wet cut, about 0.5 s (Clive, GD's rite,
# 2026-10-23; the game calls `sacrifice_stab`). The blow of the hilt into the body (qubodup's punch meat and a low punch,
# from the flesh set), a quick wet splat on the same millisecond (Independent.nu's, the flesh set's splat_6 and splat_1:
# the two that start at once), a dull knock of the stone under it (Kenney's rock impact, low and quiet), then the knife
# working in, a smaller wetter splat at 0.2 s. All recorded, CC0.
# name: sacrifice_stab_v
# seconds: 5
# count: 3

use_bpm 60                                  # times in seconds
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
MEAT = %w[meat_2 meat_4 meat_3]
LOW = %w[lowpunch_3 lowpunch_2 lowpunch_7]
WET = %w[splat_6 splat_1 splat_6]
PULL = %w[splat_4 splat_7 splat_5]
PULL_LEAD = { "splat_4" => 0.07, "splat_7" => 0.08, "splat_5" => 0.07 }   # their sound peaks late in the file: start near it

define :one do |v|
  use_random_seed 9950 + v
  r = 0.92 + rrand(-0.03, 0.03)
  with_fx :lpf, cutoff: 114 do                                  # 5.9 kHz: wet, not bright
    sample F + MEAT[v] + ".wav", rate: r, amp: 1.0, attack: 0, sustain: 0.06, release: 0.12
    with_fx :hpf, cutoff: 48 do                                 # 131 Hz
      sample F + LOW[v] + ".wav", rate: r, amp: 0.4, attack: 0, sustain: 0.05, release: 0.1
    end
    with_fx :hpf, cutoff: 56 do                                 # 208 Hz
      sample F + WET[v] + ".wav", rate: (0.9 + 0.04 * v) * r, amp: 0.55, attack: 0, sustain: 0.08, release: 0.15
    end
    with_fx :lpf, cutoff: 80 do                                 # the slab: a dull knock, felt more than heard
      sample K + "impactMining_00#{v + 1}.ogg", rate: 0.7 * r, amp: 0.25
    end
    at [0.2] do
      pf = F + PULL[v] + ".wav"
      sample pf, start: PULL_LEAD[PULL[v]] / sample_duration(pf), rate: 0.85 * r, amp: 0.3, attack: 0.01, sustain: 0.12, release: 0.15
    end
  end
end

3.times do |v|
  one v
  sleep 1.3
end
