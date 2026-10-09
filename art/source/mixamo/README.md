# Mixamo animations for the hero (2026-10-09)

Downloaded from Mixamo (mixamo.com, Adobe) on Robin's account for the second hero (`art/source/hero2.blend`). Because Mixamo's
auto-rigger failed on the hero's own mesh (many separate shells with n-gon caps), the skeleton was fitted to a **rigging proxy**
(`art/source/hero2_rigproxy.fbx`: the body joined, voxel-remeshed into one watertight surface, decimated to 12,000 triangles,
in the T-pose; markers at chin, wrists, elbows, knees, groin; skeleton **No Fingers (25)**, the hands are mittens). The real
parts are bound to that skeleton in Blender afterwards (`art/build/mixamo_bind.py`), so the painted face and the materials stay.

Download settings: FBX Binary, 30 frames a second, keyframe reduction none. `hero_idle.fbx` is **With Skin** (it carries the
proxy mesh and the skeleton); every other file is **Without Skin** (the skeleton and its motion only). `hero_walk` and `hero_run`
were exported **In Place** (no root motion). Mixamo's licence lets the animations be used in the game.

| File | Mixamo animation | Description on Mixamo | Note |
| --- | --- | --- | --- |
| hero_idle.fbx | Breathing Idle | Breathing Idle | the neutral idle; with skin |
| hero_idle_look.fbx | Looking Around | Idle Stand Looking Around | the second idle |
| hero_walk.fbx | Walking | Male Standard Walk | In Place |
| hero_run.fbx | Running | Running Forward Quickly | In Place |
| hero_attack1.fbx | Stable Sword Outward Slash | Outward Slashing With A Sword Standing Stable | one-handed, feet planted |
| hero_attack2.fbx | Stable Sword Inward Slash | Inward Slashing With A Sword Standing Stable | the return cut |
| hero_bow_draw.fbx | Standing Draw Arrow | Reloading Bow | nock and draw |
| hero_bow_shoot.fbx | Standing Aim Recoil | Standing Aim Fire Arrow | the release |
| hero_hit.fbx | Standing React Large From Front | Large Hit Reaction From The Front | |
| hero_death.fbx | Death | Death From Standing Idle | |
| hero_chop.fbx | Standing Melee Attack Horizontal | Right To Left Attack With Axe | a side chop at a trunk |
| hero_mine.fbx | Standing Melee Attack Downward | Downward Attack With Axe | an overhead strike at a rock |
| hero_pickup.fbx | Picking Up | Picking Up An Object | |
| hero_interact.fbx | Opening A Lid | Opening The Lid On A Chest Or Box | chests, doors |
| hero_drink.fbx | Drinking | Male Drinking | Mixamo has no eating motion; doubles for food |
| hero_sitdown.fbx | Sitting | Sitting Down Arms Outside Armrests | stand to seated |
| hero_sit.fbx | Sitting Idle | Sitting In Chair Hands Resting On Thighs | the seated idle |
| hero_standup.fbx | Standing Up | Sitting To Standing | the way back |

Not in Mixamo's library: a true wood-chopping or pickaxe motion (the two axe strikes stand in), and eating.
