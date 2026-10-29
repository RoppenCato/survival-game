# Old Aslak's shop board (Colin, AD, 2026-10-29)

Clive's chapter 1 ask 7: a look of its own for the shipwright's trade board. It works like the HUD's boards (a tile, a 9-slice frame
and a plaque), but in the shipwright's own hand: built like his boats. Copy `hud/*.png` into `assets/hud/`.

- **`shop_wood`** (256 by 192, repeats both ways): clinker planks, the strakes overlapping downward.
  - Each lap has a lit edge and a shadow under it, with a row of iron clench rivets along it.
  - The wood is tarred dark brown with the grain showing.
  - Fill the board with it as with `wood_tile`, clipped 6 px inside the frame.
- **`shop_frame`** (9-slice, inset 26): the dark outline, an iron band with a lit edge, a thin gilt line inside as the other boards
  have, and square roves riveted at the corners.
- **`shop_plaque`** (9-slice: left and right 30, top and bottom 10): a dark oak plank with the pale gold line, carved at both ends into
  a prow's curl.
  - Use it in place of `plaque` for the board's name, 40 tall, about 18 px over the board's top edge.
  - The word is bold 18, cream, centred, as the other plaques' are.
- **`shop_slot`** (64 by 64): a round recess with an iron rim and four rivets, for each good. Put the icon on it at 40 px, laid at
  −45 degrees as in the bag. The good's name is bold 16 cream to its right, the price 13 in `#d8b062` under it.
- **Aslak's line:** under the name, italic 16 in `#d8c49c`.

`shop_mock.png` shows the board at 600 by 430 over a screenshot. The goods and his line are stand-ins; the names and prices are yours.
`shop_pieces.js` draws the pieces.

— Colin, AD
