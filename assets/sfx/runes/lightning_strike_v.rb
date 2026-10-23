# lightning_strike_v: the bolt on the altar, close, with the white flash: one shot (Clive, GD's rune rework, Robin's decision of 2026-10-23; the game calls `lightning_strike`). A sharp crack in front (the whip's crack and a hiss of noise, under 0.3 s), a deep boom (Kenney's soft heavy impact
# slowed), and the thunder rolling off behind it (BigSoundBank's thunder #8 and #10), about 2.5 s.
# Sources all CC0: BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, cut at their sound into
# `ref/cut/`), and the studio's own (the whip's crack and flesh layers in `sfx/flesh/ref/cut/`, Kenney's and rubberduck's).
# name: lightning_strike_v
# seconds: 10
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"

ROLL = %w[crack_1 crack_3 crack_2]

define :one do |v|
  use_random_seed 9200 + v
  r = 1 + rrand(-0.03, 0.03)
  sample F + "whip_2949.wav", rate: 0.8 * r, amp: 1.0, attack: 0, sustain: 0.03, release: 0.05
  with_fx :hpf, cutoff: 90 do
    synth :noise, attack: 0.001, sustain: 0.05, release: 0.3, amp: 0.8
  end
  sample K + "impactSoft_heavy_00#{v}.ogg", rate: 0.45 * r, amp: 0.6
  at [0.03] do sample C + ROLL[v] + ".wav", rate: r, amp: [0.9, 0.9, 0.7][v], attack: 0, sustain: 1.4, release: 1.0 end
end

3.times do |v|
  one v
  sleep 3.2
end
