# berserk_roar_v: once as his health falls under half and the rune wakes, about 0.7 s, lower than the cry (Berserk, heart; Clive, GD's list of 2026-10-24; the game calls `berserk_roar`). The deepest of the men's
# yells slowed a little, a beast's growl under it (rubberduck's roar, low), a little grit.
# Recordings, all CC0: HaelDB's men's yells, the medieval weapon swings and draws (Still North Media), BigSoundBank's
# heartbeats, breaths, flame and stones, Independent.nu's wood cracks, USC's arrow, Kenney's impacts and steps, the
# studio's own cuts (`sfx/runes/ref/cut/`, `sfx/flesh/ref/cut/`, `sfx/bow/ref/cut/`) and the sword's swishes E and F.
# name: berserk_roar_v
# seconds: 4
# count: 3

use_bpm 60                                  # times in seconds
C = "C:/dev/SG/Sound Director/sfx/runes/ref/cut/"
F = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/"
B = "C:/dev/SG/Sound Director/sfx/bow/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
SW = "C:/dev/SG/Sound Director/sfx/combat/ref/"
Y = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/"

YELL = [["1yell8", 0.225], ["1yell2", 0.14], ["1yell13", 0.0]]   # [yell, where its voice begins: the files open with up to 0.6 s of room]
GROWL = %w[cr_roar_02 cr_roar_01 cr_roar_02]

define :one do |v|
  use_random_seed 10200 + v
  r = 0.82 + rrand(-0.02, 0.02)
  y, t = YELL[v]
  f = Y + y + ".wav"
  with_fx :lpf, cutoff: 118 do
    with_fx :distortion, distort: 0.25, mix: 0.3 do
      sample f, start: t / sample_duration(f), rate: r, amp: 1.0, attack: 0, sustain: 0.58, release: 0.12
    end
    sample F + GROWL[v] + ".wav", rate: 0.9, amp: 0.25, attack: 0.02, sustain: 0.4, release: 0.15
  end
end

3.times do |v|
  one v
  sleep 1.2
end
