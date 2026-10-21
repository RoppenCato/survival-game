# Boats and the Shipyard: where it stands, what is hard, what to do (2026-10-13)

> **Decided and built the same day.** Robin: "Do it" to the recommendation in section 4 (C, with B's choices of look).
> Built: four hull designs (faering, boat, karve, longship) chosen in the yard and laid at once, the fitting out as parts
> (seats, mast, sail, steering oar, a dragon stem, shields on the rail), the hull paid at the launch, the yard sized to the
> hull with the camera pulled back for the longship, handling and the rowers' share per hull. See `CLAUDE.md`, "The hulls".
> Not yet: the rowing clip, the sail's colours, the ship's name, the knarr. The questions in section 5 are answered by what
> was built where it had to choose (a hull of your own: no; the longship huge: yes; the shape and the handling: per design;
> the crew: every rower is drawn seated and every oar pulls; a name and a figurehead: the dragon stem now, the name later).

Robin asked (2026-10-13): re-evaluate the boat and the shipyard system; how do we make boats big enough for several Vikings
to row; how do we make it even more customizable and still functional; is it better to make a few really good designs and let
the player choose parts and colours. This is the study, with a recommendation and the questions it leaves. **Nothing here is
decided or built.**

## 1. What is built today

- **The Shipyard** (`Yard.scene` in `src/yard.js`, the same page in the game and the Sea Editor): a free-form yard of 9 by 6
  cells at zoom 1.1 with the parts down the left, a plan a tab (**Raft**, **Boat**, **Karve**; a bench's tier says which show),
  the build cursor laying parts in cells, right click taking a part back, a preview of the vessel afloat at the bottom right,
  and Finish when every check of the plan passes.
- **The raft:** at least three logs, every log touching another, at most eight, a rope lashing on every log, and the oar
  drawn by itself. Direct steering, 54 units a second.
- **The boat:** a keel of three to nine cells in one straight row, strakes beside it (at most two rows a side, each against
  the keel or a strake nearer it), a thwart at least. **The hull's shape follows the strakes** (`boatProfile`): a bare keel
  is a canoe, each strake row swells its side, a strake at one end makes a wide bow. Copper nails. Tiller steering, 100.
- **The karve:** a keel of five to nine, the boat's strake rules, two seats at least, a mast on the keel amidships, a sail on
  the mast, a steering oar at the stern. Iron nails and cloth. Tiller steering, 115; a wind behind gives up to half again;
  **each rower adds 7 % to speed and acceleration** (`Yard.WIND.rowK`), and **a seat takes two rowers** (`fit` gives
  `seats` and `rowers`). Hirdmen following within 150 units step aboard, sit two to a seat facing aft and row.
- **The drawing** (`Yard.drawVessel`, `drawVesselFront`): a clinker hull from the keel's length and the strakes' width with
  planking, a deck, curled stems, the seats where they were laid with an oar each side that pulls, the hero seated aft with a
  paddle (the boat) or standing at the steering oar (the karve), the striped sail full or furled, a wake.
- **Scale:** one unit is 4.6 cm, the hero 39 units. A nine-cell keel at the yard's cell size is about 7 heroes long, which
  already fits a real 15 m karve. The world's distances were set so that the raft takes a minute between the first two
  islands and the boat half that.

## 2. The challenges

**Room for rowers.** A real karve of 15 m carried 12 to 16 rowers on 6 to 8 thwarts; a longship of 25 m carried 30. In the
yard a seat is one cell on the keel and the keel is at most nine cells, so a karve holds at most seven seats, and in play two
or three, since the mast and the steering oar take cells and a seat on every cell looks like a comb. The grid is the limit:
**the hull's length is the keel's cell count, and the cells are coarse**. Making the grid finer (a cell a quarter of a
strake's length) would let a seat sit between strakes and give a nine-cell keel eighteen places; making the yard longer
(twelve or sixteen cells) gives a longship. Both are cheap in the data (`PLANS`, `YARD.Y.W`) and expensive in the drawing:
`boatProfile` samples the strakes per keel column, the seats and oars are placed per column, and the hull is drawn at the
game's scale, so a sixteen-cell keel is wider than the screen in the yard's zoom. **The people aboard** are the other
limit: every rower is a person drawn with his own clip (there is no rowing clip yet: they sit), and a karve with twelve
rowers is twelve figures to draw and keep seated through the vessel's turns.

**Customisable, and still a boat.** The free-form yard lets the player lay strakes anywhere beside the keel, so the hull's
shape is his: a wide bow, a belly, two unlike sides. That is the charm of it and also the trouble: the checks (`PLANS[*].checks`)
have to say no to everything that is not a boat (a strake with no keel beside it, a seat off the keel, a mast at the bow),
and every new part adds rules that are hard to show and easy to break. The yard's guidance line names the first unmet check,
which works for five rules and will not for twenty. What a player cannot do today: choose the stem's shape, the sail's
colours, a figurehead, the number of oars, the planking's colour, a deck house (a knarr's hold); and nothing in the shape
changes how the vessel sails except the length (the collision ellipse) and the seats (rowers).

**Function.** Only three numbers of a vessel come from its parts: its size on the water (`fit`), where you sit, and how many
rowers it takes. Speed, turning and glide are per kind (`Yard.HANDLING.raft`, `.boat`, `.karve`), the same for every boat of
that kind however it was laid. So a long, narrow karve and a short, wide one sail alike. If the shape is to matter it needs
to feed the handling (length to speed and turning, width to stability and cargo, sail area to the wind's gift, rowers to
acceleration), which is a small table and a day's tuning, but then every strange shape the yard allows must also sail
sensibly, or the player who laid a single strake at the bow gets a boat that will not turn.

**Cargo and people.** The karve has a sea chest and a cargo stow (the heavy silver); a knarr for trade and for taking a
raid's silver and thralls home wants a hold, which is a shape the yard does not know (a deck house amidships, beams across).

**Building it piece by piece in play.** Laying forty parts one at a time with the cursor is fine for a raft and tedious for a
longship; a bigger plan wants either laying runs of parts (drag a strake along the keel as the game drags walls) or a plan
that comes laid and is changed.

## 3. Three ways it could go

**A. Keep the free-form yard and grow it.** A finer grid (two cells to a strake's length), a longer yard for the longship,
seats between strakes, runs of parts laid by dragging, and the shape fed into the handling. Keeps the creativity Robin asked
for on 2026-10-06. Costs: the drawing's columns at a finer grid, the checks for every new part, the handling's table, and the
rowing crew. Risk: the rules grow until laying a hull feels like passing an exam, and odd shapes sail oddly.

**B. A few good designs, chosen by part and colour.** Four or five hulls designed by hand (a faering, the boat, the karve,
a longship, a knarr), each a plan that comes laid in the yard with everything a real one had, and the player's choices on
top: the stem (a plain curl, a dragon, a snake), the sail's colours and stripes, the planking's wood (pine, oak, tarred
black), a figurehead, shields along the rail, the number of thwarts within the hull's range, a deck house on the knarr. Each
choice is a part on the parts strip laid into a slot the plan has for it, so the yard's cursor and checks stay as they are
but the checks are "a stem at the bow" rather than "a boat at all". What is lost: a hull shape of your own. What is gained:
every vessel looks like a real ship, every one sails as its kind should, and the customising is the kind the sagas talk about
(the ship's name, its stem, its sail). This is also how the raid's ladder reads: a karve's six for farms and churches, a
longship's crew for a town.

**C. Both: the designs as the hull, the yard for the rest.** The hull (keel, strakes, stems) comes from a chosen design;
on it the player lays the thwarts, the mast, the steering oar, the shields and the sail in the yard as now, and the design
sets how many thwarts fit. The hull's shape is fixed and real, the fitting out is his. The checks are the karve's today
(two seats at least, a mast amidships, a sail on it, a steering oar aft) plus the design's limits.

## 4. Recommendation

**C, with B's choices of look.** The hull is the part that must be right for the vessel to read as a ship, to hold the
rowers, to sail as its kind and to be drawn (one `boatProfile` per design, drawn once and well, instead of a profile derived
from whatever was laid); the fitting out is where a player's choices show on the water (how many oars, the stem, the sail,
the shields along the rail) and where the Shipyard's cursor earns its keep. It keeps the yard, the parts strip, the preview,
the costs and the tiers, and most of `src/yard.js`. It drops the strake-laying, which is the part the rules fight hardest.

What it would take, in order: (1) the designs as data (`Yard.HULLS`: the keel's length in cells, the profile per column,
where the thwarts may go and how many, the mast's cell, the stern's cell, the stems' shapes), four of them: faering (2
thwarts, no mast), boat (3), karve (5 to 7 thwarts, 10 to 14 rowers), longship (10 to 15 thwarts, 20 to 30 rowers, a second
tier of the bench), later the knarr; (2) the yard's plan tabs become the hull's choice, laid at once; (3) the parts that are
choices (stem, sail colours, planking, shields, figurehead) as parts with a slot each; (4) the rowing clip for the people
(a Mixamo sitting), the crew seated by `fit` as now, the oars pulling with the clip; (5) a longer yard for the longship (16
cells) at a smaller zoom, and the hull drawn at the game's scale beside it; (6) the shape feeding the handling (per design,
not per laid part: length, beam, sail area, rowers), with the Sea Editor's sliders tuning each design.

## 5. Questions for Robin

1. Is the hull shape of your own (the strakes you lay) something to keep, or is a real hull chosen from a few designs with
   the fitting out yours enough? (This is A against C.)
2. How big should the biggest vessel be on the screen: a longship of 25 m is 13 heroes long, longer than the screen is
   wide at the game's zoom. Is that right (it should feel huge), or should the longship be the karve's size with more rowers?
3. Should the shape change how a vessel sails (a long hull faster and slower to turn), or is a vessel's kind enough?
4. The crew: should every rower be drawn (twelve figures rowing), or the near side's rowers only, or oars that pull by
   themselves with a count?
5. A ship's name and a figurehead: do they belong in the first version of this, or later with the sagas and the legendary
   Vikings?
