# slide_a: the Slide, plain (Robin's new rune, 2026-10-24; the game calls `slide` at the push-off). The grass recordings
# alone: Kenney's grass steps in a run that comes fast and spreads out as he slows, each a little quieter, no filters.
# name: slide_a
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RUN = [0.0, 0.03, 0.065, 0.105, 0.15, 0.2, 0.26, 0.33, 0.41]

define :one do |v|
  use_random_seed 12100 + v
  RUN.each_with_index do |t, i|
    at [t + rrand(0, 0.006)] do
      sample K + "footstep_grass_00#{(v + i) % 5}.ogg", rate: 1.3, amp: (1.0 - i / 10.0) ** 1.5, attack: 0, sustain: 0.04, release: 0.06
    end
  end
end

3.times do |v|
  one v
  sleep 1.1
end
