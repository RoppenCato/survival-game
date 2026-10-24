# slide_v: the Slide, a dash-slot move (Robin's new rune, 2026-10-24; Clive, GD asked the same night; the game calls `slide`
# at the push-off): a long low slide along the ground under a swung blade, fast and slowing to a stop over about 0.45 s.
# A scrape and rush of a body over turf, grass and grit: the push-off (a step on grass), a run of grass brushes that comes
# fast and spreads out as he slows (Kenney's grass steps, short and bright), grit crunching under him (BigSoundBank's snow
# crunch, high), a rush of body and air falling in pitch (noise through a band that slides down, the sword's swish E soft
# under it); everything dies away to the stop. As loud as the dash.
# Recordings, all CC0: Kenney's grass steps, BigSoundBank's snow steps (`sfx/weather/ref/cut/`), the sword's swish E.
# name: slide_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
WC = "C:/dev/SG/Sound Director/sfx/weather/ref/cut/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
RUN = [0.0, 0.028, 0.06, 0.097, 0.14, 0.19, 0.25, 0.32]       # the brushes spread out as he slows

define :one do |v|
  use_random_seed 12000 + v
  r = 1 + rrand(-0.04, 0.04)
  sample K + "footstep_grass_00#{v}.ogg", rate: 0.95 * r, amp: 0.7
  with_fx :hpf, cutoff: 50 do
    with_fx :lpf, cutoff: 112 do
      RUN.each_with_index do |t, i|
        at [t + rrand(0, 0.006)] do
          sample K + "footstep_grass_00#{(v + i) % 5}.ogg", rate: rrand(1.35, 1.6), amp: (1.0 - i / 9.0) ** 1.6 * 0.8, attack: 0, sustain: 0.03, release: 0.05
        end
      end
      [0.02, 0.11, 0.21].each_with_index do |t, i|
        at [t] do sample WC + "snowB_#{(v + i) % 5 + 1}.wav", rate: 1.6, amp: 0.35 - 0.09 * i, attack: 0, sustain: 0.04, release: 0.06 end
      end
    end
    with_fx :bpf, centre: 88, res: 0.35, centre_slide: 0.4 do |f|
      control f, centre: 64
      synth :bnoise, attack: 0.01, sustain: 0.06, release: 0.36, amp: 0.45
    end
  end
  with_fx :lpf, cutoff: 96 do sample SW + "swing_e.wav", rate: 0.8 * r, amp: 0.16, attack: 0, sustain: 0.2, release: 0.15 end
end

3.times do |v|
  one v
  sleep 1.1
end
