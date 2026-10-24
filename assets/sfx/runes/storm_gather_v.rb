# storm_gather_v: the power gathering over the altar before the bolt, 2.6 s, once; it ends as the bolt comes and
# lightning_strike follows at once (Clive, GD's rite, 2026-10-23; the game calls `storm_gather`). Different from
# storm_rise (the stones grinding, low, at the start): this one is electric and climbs. A thunder roll played backwards
# (BigSoundBank's thunder #8 and #10, ending on its crack), the sung bowl's hum slowed under it, a low drone rising a fifth
# through a filter that opens, a thin tone climbing an octave, and static crackling thicker and louder to the end.
# Everything swells to the last moment and stops dead at 2.6 s.
# name: storm_gather_v
# seconds: 11
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
T = 2.6                                     # the length the game waits before the bolt
REV = [["crack_1", 0.078], ["crack_3", 0.020], ["crack_2", 0.048]]   # the crack's peak, as a part of the 3 s file

define :one do |v|
  use_random_seed 9970 + v
  f, pk = REV[v]
  sample C + f + ".wav", start: pk + T / 3.0, finish: pk, amp: 0.55, attack: 0.3, sustain: T - 0.34, release: 0.04
  sample C + "bowlsing_1.wav", rate: 0.6, amp: 0.35, attack: T - 0.3, sustain: 0.26, release: 0.04
  with_fx :lpf, cutoff: 62, cutoff_slide: T do |lp|
    control lp, cutoff: 100
    d = synth :saw, note: note(:d2) + v, attack: T - 0.2, sustain: 0.16, release: 0.04, amp: 0.3, note_slide: T
    control d, note: note(:a2) + v
  end
  t = synth :sine, note: note(:d4) + v, attack: T - 0.2, sustain: 0.16, release: 0.04, amp: 0.12, note_slide: T
  control t, note: note(:d5) + v
  with_fx :hpf, cutoff: 100 do                                  # 2.6 kHz and up: static, not hiss
    16.times do |i|
      at [1.0 + 1.55 * Math.sqrt((i + rrand(0, 0.6)) / 16.6)] do
        synth :noise, attack: 0, sustain: 0.004, release: rrand(0.01, 0.03), amp: 0.15 + 0.35 * i / 15.0
      end
    end
  end
end

3.times do |v|
  one v
  sleep 3.6
end
