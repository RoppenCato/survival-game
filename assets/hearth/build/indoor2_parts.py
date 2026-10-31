
# ---------------------------------------------------------------- round 2 (Colin, AD, 2026-10-31; Robin: "some variation of A and C where it can be with or without a cooking pot"): one hearth set in the floor in three
# lengths, and what stands over it as its own picture, drawn after the flames, so the game can add or take away a pot: a pot on a trivet, the house's timber with an empty hook, or the timber with the kettle.
def hearth2(G, tx):
    sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]; hx = tx * TILE / 2 - 0.01; hy = TILE / 2 - 0.01
    curb(G, hx, hy, seed=3); ix, iy = hx - 0.13, hy - 0.13
    plate(G, 'clay', mat(G, 'clay', '#7e624c'), ix, iy, -0.05, 5); kerb_stones(G, ix - 0.08, iy - 0.08, sm, 7 + tx, size=0.095)
    burn = {1: 0.42, 2: 0.56, 4: 1.25}[tx]; n = {1: 1, 2: 1, 4: 3}[tx]; xs = [(-burn + 2 * burn * (i + 0.5) / n) for i in range(n)]
    disc(G, 'scorch', mat(G, 'scorch', '#4a443c'), (0, 0), burn + 0.14, iy - 0.13, -0.046, jag=0.2, seed=8); disc(G, 'ash', mat(G, 'ash', '#6e6862'), (0, 0), burn, iy - 0.2, -0.042, jag=0.18, seed=9); spec = []; ep = []
    for i, x in enumerate(xs): blaze(G, x, 0.02, -0.04, 0.3 if tx == 1 else 0.33, 0.24, 20 + i * 3); spec += tongues_at(x, 0.02, 0.02, 0.17 if tx == 1 else 0.22, 0.08, 4, 0.5 if tx == 1 else 0.54, 0.095, 30 + i); ep += ember_list(x, 0, -0.04, 0.33, 0.25, 9, 40 + i)
    if tx > 1:
        for s in (-1, 1): disc(G, 'rake%d' % s, mat(G, 'scorch', '#4a443c'), (s * (burn + (ix - burn) * 0.6), 0), (ix - burn) * 0.42, iy - 0.2, -0.044, jag=0.25, seed=50 + s)
    return dict(view=(VIEW_W[tx], VIEW_H), aim=VIEW_AIM, spec=spec, bed=(0, 0, -0.04, burn, 0.24), ember_pts=ep)
def timber(G, tx):
    """what the chain hangs from, the same whether a kettle is on it: the tie-beam and two posts; the one-room's post and arm. Returns the height the chain starts"""
    hx = tx * TILE / 2 - 0.01; hy = TILE / 2 - 0.01
    if tx > 1:
        Bz = 2.42; P = hx - 0.075; post(G, 'postW', -P, 0.0, Bz + 0.02, seed=21); post(G, 'postE', P, 0.0, Bz + 0.02, seed=22); sill(G, 'tiebeam', -P - 0.22, P + 0.22, 0.0, Bz, Bz + 0.15, wd=0.14, seed=23)
        for s in (-1, 1): rod(G, 'knee%d' % s, mat(G, 'curb', OAK), [(s * P, 0, Bz - 0.5), (s * (P - 0.42), 0, Bz + 0.01)], 0.045, seg=4)
        return Bz
    P = -hx + 0.075; Az = 2.05; post(G, 'crane', P, hy - 0.075, Az + 0.14, seed=31); rod(G, 'arm', mat(G, 'curbtop', OAKTOP), [(P, hy - 0.075, Az), (0.0, 0.0, Az)], 0.05, seg=4)
    rod(G, 'brace', mat(G, 'curb', OAK), [(P, hy - 0.075, Az - 0.55), (P + 0.42, (hy - 0.075) * 0.55, Az - 0.01)], 0.038, seg=4); return Az
def hook_only(G, tx):
    """C without a pot: the chain stops at an iron hook, up out of the flames"""
    Az = timber(G, tx); iron = mat(G, 'iron', '#4c5157'); e = 1.12; chain(G, (0, 0, Az), (0, 0, e), r=0.018)
    rod(G, 'hook', iron, [(0, 0, e), (0, 0, e - 0.11), (0.055, 0, e - 0.17), (0.11, 0, e - 0.11)], 0.016, seg=5)
    return dict(view=(VIEW_W[tx], VIEW_H), aim=VIEW_AIM, only_base=True)
def hung(G, tx):
    """C with the pot: the same timber and chain, the kettle on it"""
    Az = timber(G, tx); ap = cauldron(G, 0.0, 0.0, 0.64, r=0.26 if tx > 1 else 0.21); chain(G, (0, 0, Az), ap, r=0.018)
    return dict(view=(VIEW_W[tx], VIEW_H), aim=VIEW_AIM, only_base=True)
def trivet(G, tx):
    """A with the pot: no timber, a pot on a low iron trivet: over the fire in the one-room's short hearth, on the raked coals at the east end of a longer one"""
    x = 0.0 if tx == 1 else {2: 0.98, 4: 2.2}[tx]; stand_pot(G, x, -0.06, -0.045, r=0.21); tube_ring(G, 'potlip', mat(G, 'potlip', '#7d848b'), (x, -0.06), 0.18, 0.012, 0.36)
    return dict(view=(VIEW_W[tx], VIEW_H), aim=VIEW_AIM, only_base=True)
VIEW_W = {1: 2.3, 2: 3.8, 4: 6.8}; VIEW_H = 3.8; VIEW_AIM = 1.05
