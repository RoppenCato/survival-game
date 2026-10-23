# cudgel_thud_v: the cudgel knocking a beast out: blunt and heavy (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `cudgel_thud`). A dry wooden knock (rubberduck's wood hit), the meat of a fist into a body (qubodup's punch), a low punch and a soft heavy
# impact under them (Kenney's), slower than a club's hit: the blow that ends it.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: cudgel_thud_v
# seconds: 5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

KNOCK = %w[wood_hit_07 wood_slam_01 wood_hit_08]
LEAD = { "wood_slam_01" => 0.020, "wood_hit_08" => 0.010 }

define :one do |v|
  use_random_seed 9800 + v
  r = 0.9 + rrand(-0.03, 0.03)
  kf = RD + KNOCK[v] + ".ogg"
  sample kf, start: (LEAD[KNOCK[v]] || 0) / sample_duration(kf), rate: r, amp: 0.7, attack: 0, sustain: 0.06, release: 0.12
  with_fx :hpf, cutoff: 45 do
    sample F + "meat_#{v + 1}.wav", rate: r, amp: 0.5, attack: 0, sustain: 0.06, release: 0.14
    sample F + "lowpunch_#{v + 2}.wav", rate: r, amp: 0.4, attack: 0, sustain: 0.06, release: 0.12
  end
  sample K + "impactSoft_heavy_00#{v + 1}.ogg", rate: 0.8 * r, amp: 0.45, attack: 0, sustain: 0.06, release: 0.15
end

3.times do |v|
  one v
  sleep 1.0
end
