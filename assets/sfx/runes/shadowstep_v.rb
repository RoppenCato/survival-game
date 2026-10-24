# shadowstep_v: the Shadowstep, a dash in a puff of smoke with a seax, at the hero: a short breathy whoosh, darker than the dash's (Robin's rune trial of 2026-10-24, Clive, GD's list the same day; the game calls `shadowstep`). The
# sword's swish F slowed and darkened under 2.6 kHz, its rumble off, a breath let out hard through it (BigSoundBank's breathless man), a low
# puff of air.
# Recordings, all CC0: BigSoundBank's rat traps, chain, steam hiss, glass ball, stones and breaths; the medieval
# crossbow's mechanism and swings (Still North Media); Independent.nu's wood cracks; Kenney's and rubberduck's impacts;
# the flesh set's slaps, meat and splats. Every piece cut at its own sound (`sfx/runes/ref/cut/`).
# name: shadowstep_v
# seconds: 3.5
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
RD = "C:/dev/SG/Sound Director/sfx/world/ref/rubberduck/files/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
SL = { 1 => 0.045, 2 => 0.045, 3 => 0.05, 4 => 0.237, 5 => 0.05 }   # the stones' cuts open before their crack
define :stone do |n, o|
  f = C + "stone_#{n}.wav"
  sample f, o.merge(start: SL[n] / sample_duration(f))
end
define :from do |f, t, o|                   # a piece started t seconds in (at its sound)
  sample f, o.merge(start: t / sample_duration(f))
end

BREATH = %w[breath_2 breath_3 breath_1]

define :one do |v|
  use_random_seed 13800 + v
  r = 0.75 + rrand(-0.03, 0.03)
  with_fx :hpf, cutoff: 56 do
  with_fx :lpf, cutoff: 100 do
    sample SW + "swing_f.wav", rate: r * 1.08, amp: 1.0, attack: 0, sustain: 0.2, release: 0.12
    sample C + BREATH[v] + ".wav", rate: 0.9, amp: 0.45, attack: 0.02, sustain: 0.15, release: 0.12
    synth :bnoise, attack: 0.02, sustain: 0.04, release: 0.2, amp: 0.08
  end
  end
end

3.times do |v|
  one v
  sleep 1.0
end
