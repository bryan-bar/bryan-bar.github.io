/* bryanbar.com — "under construction" animation.
 *
 * p5.js 2.x, INSTANCE mode: everything hangs off `p`, nothing is added to the
 * global scope apart from two documented test seams (`__DIAG`, `__setVT`). Note
 * p5 2.x removed preload() and reworked async setup — this sketch uses only
 * draw primitives, so none of that applies here. Do not copy structure from
 * p5 1.x examples.
 *
 * The canvas is sized to its PARENT element (#sketch-holder), never to
 * windowWidth, so the CSS aspect-ratio is what controls it on every screen.
 *
 * ---------------------------------------------------------------------------
 * THE LOOP. A CLOSED cycle over TWO fixed rosters — N steel LETTER PLATES and
 * NP concrete pipes. Nothing is ever created, destroyed, buried or absorbed
 * after start-up.
 *
 * THE PLATES SPELL THE SITE'S NAME. Each carries one letter of WORD, knocked
 * clean through the plate so the page shows behind it, and a plate's index IS
 * its place in the word. The yard therefore reads `bryanbar` left to right and
 * the finished tower reads it TOP TO BOTTOM, because the crane builds from the
 * right-hand end of the yard: see WORD, and readWords() for the read-out a
 * check can assert on. The word is broken exactly once per loop — between the
 * topple and the end of recovery — and that is the joke.
 *
 *   A. STOCKED    girders in their yard slots; pipes in a full triangular
 *                 pyramid - PK on the ground and one fewer in each course
 *                 above, nested in the valleys - LEFT of the tower.
 *   B. BUILD      the crane lifts plates one at a time, RIGHTMOST FIRST, and
 *                 stacks them, so the word ends up written down the tower.
 *   C. PARK       the crane goes visibly STILL. This is what says "he got out".
 *   D. EMERGE     the dozer backs out from behind the cabin. The crane having
 *                 stopped, then the dozer moving, IS the evidence that someone
 *                 climbed down; the operator himself is never drawn.
 *   E. IMPACT 1   the blade backs into the PIPE pyramid. The dozer never
 *                 touches the tower - that is the whole point of the chain.
 *   F. ROLL       the pipes run right, decelerating, the lead one out in front.
 *   G. IMPACT 2   the lead pipe STRIKES the tower foot and rebounds off it.
 *                 Contact is an INVARIANT, not a coincidence: the roll ends at
 *                 the tower's own left face (L.pipeLim) at exactly T_FALL, on
 *                 every canvas, because both are read off the same layout.
 *   H. SWAY       the stack teeters — growing amplitude, the beat of false hope.
 *   I. TOPPLE     it goes over. Tipping about contact edges, never free spin.
 *   J. BEAT       everything holds still. This pause is the joke.
 *   K. RETURN     the vehicle slinks back behind the cabin.
 *   L. BEAT       another short pause — he is climbing back up.
 *   M. RECOVER PIPES   the crane clears the fallen row FIRST, sweeping it left
 *                 to right and restacking what it picks up course by course.
 *   N. RECOVER GIRDERS then each girder goes back to its own home slot,
 *                 topmost piece first.
 *   O. -> A       rebuild, forever.
 *
 * THE OPERATOR IS NEVER DRAWN. He is implied entirely by causality: the crane
 * stopping, the pipes being knocked loose, the vehicle moving on its own. The
 * two BEATs are comic timing and are load-bearing, not dead time.
 *
 * CONSERVATION BY CONSTRUCTION. A girder's identity is its index 0..N-1 and a
 * pipe's is its index 0..NP-1; those indices are the only handles in the file.
 * A pipe's SLOT in the pyramid is a separate 0..NP-1 and is not its identity —
 * see below — but every map between the two is a permutation, so the roster is
 * conserved either way.
 * There is no array that either is pushed to or spliced from, so there is no
 * code path that could add or drop one. `poseAt()` and `pipePoseAt()` are TOTAL
 * functions: for every (tau, id) each takes exactly one branch and every branch
 * returns a pose. Each piece is therefore in exactly one collection at every
 * instant, and the draw loop paints every id of both rosters once, every frame,
 * forever. The vehicle is a PROP: it is in neither roster, never counted, never
 * recovered, and never drawn in any girder blue (nor in --ink-soft, which
 * the conservation instrument's blue tolerance also catches). The girders
 * span a RAMP rather than one blue now, so the range that instrument has to
 * accept is PUBLISHED on __DIAG.ramp instead of being assumed from a single
 * token — see "the ramps" below.
 *
 * THE SLOTS ARE FIXED; WHO STANDS IN THEM IS NOT. `home(i)` and `pipeHome(s)`
 * depend only on the layout — never on the era, the build order or the
 * recovery order. A GIRDER goes back to its own: BUILD carries FROM home(id)
 * and RECOVER carries TO it, so "girder i ends up where girder i left" holds
 * by construction, PER IDENTITY, and the destination IS home(id) rather than a
 * record that could disagree with it.
 *
 * A PIPE DOES NOT, AND THAT IS THE POINT. The crane clears the fallen row the
 * way a person would — the leftmost pipe with nothing lying on it, then the
 * next — and sets each one down in the NEXT EMPTY SLOT, filling the ground
 * course before anything nests on it. Collection order is a property of where
 * the pipes came to REST, not of which pipe it is, so the pipe standing in a
 * given slot at the end of an era is generally not the one that started there.
 * The conserved statement is therefore SET-WISE: the same NP pipes exist
 * forever and the pyramid is rebuilt complete, every slot filled exactly once,
 * but the identity -> slot map turns over era to era. `pl.pmap` is that map,
 * in closed form (see PSTEP), so the era seam is continuous in both
 * directions instead of every pipe jumping across it.
 *
 * WHY THE SCENE IS A PURE FUNCTION OF TIME. The whole era — build order, stack
 * jitter, the entire collapse (integrated once, see below), where every piece
 * lands, where every pipe rolls to, the recovery queue, and the pile's shape
 * after each removal — is SOLVED ONCE per era by planEra() and cached.
 * Rendering then just reads that plan at phase tau. Two things fall out:
 *
 *   1. It is reproducible. Nothing depends on frame history or wall-clock
 *      drift, so a headless screenshot at a fixed virtual time is exact, and
 *      noLoop() for prefers-reduced-motion renders precisely the frame the
 *      animation would have shown at that instant.
 *   2. It cannot drift or leak. The plan cache holds two eras, each of fixed
 *      size. Nothing accumulates, in memory or on screen.
 *
 * THE COLLAPSE IS INTEGRATED, NOT TWEENED. See "the fall" below. Because the
 * integration runs inside planEra() — off the render loop, at a fixed 1/60 s
 * step, for a fixed number of steps — the frame-rate-coupling and
 * substep-spiral traps are structurally impossible here rather than merely
 * avoided: draw() never integrates anything.
 *
 * THE PILE IS A REAL STRUCTURE, not a decoration. Pieces are seated onto a
 * height field: each takes the MEAN surface under its own footprint (so a piece
 * lying half on another settles between the two). Then it is seated a SECOND
 * time, held off its own bed in proportion to the load lying on it (seatPile),
 * so a girder that is carrying others is wedged and a girder that is carrying
 * nothing has bedded in. That is what makes a lift settle the pieces UNDER the
 * hook and not only the ones that were leaning against the piece removed.
 * `settleStep()` re-seats the survivors after each removal, clamped so a piece
 * can only ever move DOWN. That clamp is what makes the reaction read as a
 * slump rather than as pieces popping about.
 *
 * NO TELEPORTING. Every hand-off is an identity, not a copy: the piece the hook
 * takes at s = 0 is drawn where the pile drew it at the end of the previous
 * job; the piece it sets down at s = 0.70 is at its home slot, which is where
 * the yard draws it from then on. The collapse hands off the same way — the
 * simulation's own settled pose is reconciled with the pile's canonical seat by
 * a short blend that runs only after the piece is asleep and has stopped
 * moving, so nothing ever jumps.
 *
 * DETERMINISM. All variation comes from hash(era, index), never Math.random().
 */
(function () {
  'use strict';

  const holder = document.getElementById('sketch-holder');
  if (!holder || typeof window.p5 === 'undefined') return;   // site.js shows a fallback

  const sketch = function (p) {
    let W = 1, H = 1, u = 1;          // u = one layout unit, 1/100 of the short side
    let reduced = false;
    let ready = false;                 // setup() has run: the canvas exists
    let vt = null;                     // virtual clock, see __setVT at the foot
    let c = {};                        // colors, pulled from the page's CSS variables

    /* ------------------------------------------------------------ timeline */

    /* THE WORD, AND THE ROSTER IT FIXES. Every piece of the girder roster is a
     * STENCILLED STEEL PLATE carrying one letter, and its INDEX IS ITS PLACE IN
     * THE WORD: plate k is letter k, for the page's life. N is therefore
     * DERIVED from the word and never typed - change the word and the yard, the
     * tower, the ramp, the timeline and the read-out all change with it.
     *
     * THE YARD READS LEFT TO RIGHT; THE TOWER READS TOP TO BOTTOM. home(i) is
     * monotonic in i, so the yard spells the word by construction. The build
     * takes the RIGHTMOST plate first and works leftward (see planEra), so the
     * last plate laid - the top course - is plate 0, and reading the finished
     * tower downward gives 0, 1, ... N-1: the same word again. That is not two
     * rules that happen to agree. It is one rule read in two directions, and it
     * is what makes the recovery honest: the topmost piece of the fallen stack
     * is the one with nothing on it, so the crane takes `b` first and lays it
     * in bay 0, and the pick order the physics dictates IS the spelling order.
     *
     * The word is broken only between the topple and the end of recovery. */
    const WORD   = 'bryanbar';
    const N      = WORD.length;        // THE PLATE ROSTER. 8. Fixed for the page's life.
    /* TWO TOWERS, BECAUSE THE WORD IS TWO WORDS. The roster splits where the
     * name does: the LEFT tower is `bryan`, five courses, `n` at its base; the
     * RIGHT tower is `bar`, three courses, `r` at its base. Read the left tower
     * top to bottom and then the right tower top to bottom and it still says
     * bryanbar - so the word is not a property of one stack any more, it is a
     * property of the pair, and both have to be complete for it to be true.
     *
     * THE BUILD RULE DID NOT CHANGE, which is the point of splitting HERE. The
     * crane still takes the yard's RIGHTMOST plate first and still lays every
     * plate as the lowest course not yet filled, tower by tower from the right:
     * r, a, b fills `bar` from its base, then n, a, y, r, b fills `bryan` from
     * its base. order[n] = N-1-n is untouched, the build still costs exactly
     * N * CYCLE, and the yard is still emptied left-to-right-reversed. All that
     * is new is WHICH tower a placement index lands in.
     *
     * SPLIT is the left tower's height. Everything else - course indices, the
     * two rigid bodies' inertia, the words a check reads back - is derived from
     * it, so `bryan|bar` is stated once and nothing downstream restates it. */
    const SPLIT  = 5;                  // courses in the LEFT tower ("bryan")
    const RSPLIT = N - SPLIT;          // ...and in the RIGHT tower ("bar")
    /* THE PIPE PYRAMID IS A FULL TRIANGLE, and PK - not NP - is the handle on
     * it: PK pipes on the ground, PK - 1 nested in their valleys, PK - 2 in the
     * valleys of THOSE, and so on to a single pipe on top. NP is therefore the
     * triangular number and is DERIVED, never typed: 4 + 3 + 2 + 1 = 10.
     *
     * Nothing below hard-codes a shape - pipeHome, the left-to-right order
     * PLR, the era permutation PSTEP it induces, the chalk marks, the blade's
     * stopping point and the recovery sweep are all written in PK, so changing
     * PK alone changes the pyramid and nothing else. */
    const PK     = 4;                  // courses: 4 on the ground, then 3, 2, 1
    const NP     = PK * (PK + 1) / 2;  // = 10. THE PIPE ROSTER.
    const CYCLE  = 2.00;               // seconds for the crane to move one girder
    const PCYC   = 1.15;               // seconds for the crane to move one pipe
    const HOLD   = 1.10;               // the STOCKED beat: the yard, full and still

    // The narrative beats, in seconds. The two BEATs are the joke; do not trim.
    const PARK   = 0.60;               // C  crane stops
    const EMERG  = 0.85;               // E  vehicle backs out from behind the cabin
    const REVER  = 1.45;               // F  reversing across the site
    const PGAP   = 0.70;               // G->H the LEAD pipe's run, blade to tower foot
    const FALLW  = 3.45;               // I+J sway, topple, flight, slide, settle.
                                       // UNCHANGED at 8 square plates, which
                                       // was worth checking rather than
                                       // assuming: the tower stands 2.06x
                                       // taller than the 7-beam one, but a
                                       // plate is shorter and its courses shear
                                       // off sooner, so the window did not need
                                       // to grow. Measured over 64 eras the LAST
                                       // piece is asleep at 2.78 s, against the
                                       // 3.17 s by which the reconciliation
                                       // blend has to start - 0.39 s of margin,
                                       // wider than the 0.29 s the 7-beam stack
                                       // had. Whether any piece was force-slept
                                       // is not asserted here: it is COUNTED,
                                       // in pl.forced, and published on
                                       // __DIAG. 0 in 64 eras.
    const BEAT1  = 0.70;               // J  the pause after the crash
    const RETRN  = 1.55;               // K  the vehicle slinks back
    const BEAT2  = 0.55;               // L  he is climbing the ladder

    const T_BUILD = HOLD;                       //  1.10  build starts
    const T_PARK  = T_BUILD + N * CYCLE;        // 17.10  crane still
    const T_EMERG = T_PARK + PARK;              // 17.70  vehicle emerges
    const T_REV   = T_EMERG + EMERG;            // 18.55  it starts reversing
    const T_PIMP  = T_REV + REVER;              // 20.00  BLADE HITS THE PIPES
    const T_FALL  = T_PIMP + PGAP;              // 20.70  LEAD PIPE HITS THE TOWER
    const T_BEAT1 = T_FALL + FALLW;             // 24.15  everything at rest
    const T_RET   = T_BEAT1 + BEAT1;            // 24.85  vehicle heads home
    const T_BEAT2 = T_RET + RETRN;              // 26.40  it is hidden again
    const T_PREC  = T_BEAT2 + BEAT2;            // 26.95  PIPES are cleared first
    const T_GREC  = T_PREC + NP * PCYC;         // 38.45  then the plates
    const ERA     = T_GREC + N * CYCLE;         // 54.45  back to STOCKED
    // Every number in this column is DERIVED, never typed twice: the same
    // constants are published on __DIAG.T, and the headless check reads the
    // comments out of this file and asserts them against __DIAG.T at run
    // time. A stale comment here is a FAILING check, not a reader's problem.

    // Start part-way through a build: an empty site on first paint reads as
    // "broken" rather than "under construction".
    const WARM = T_BUILD + 1.55 * CYCLE;

    /* Frozen moment for prefers-reduced-motion. Absolute, NOT offset by WARM.
     *
     * IT MOVED, AND THE WORD IS WHY. The old still was the apex of the third
     * teeter - the tower leaned hard over and committed. With a wordmark in the
     * scene that frame spells NOTHING: a visitor who has asked for no motion
     * would see a permanently collapsing, permanently unreadable name and read
     * it as a broken page, not as a joke. The freeze is now THE INSTANT OF THE
     * STRIKE, era 1: the lead pipe against the tower's foot with its rebound
     * only just begun - 0.78 px of daylight, measured - the rest of the
     * roster strewn between blade and tower, the dozer nosed into the pipes it
     * knocked, the crane parked and empty - and the tower COMPLETE, spelling
     * the word top to bottom while the yard's eight bays stand empty beneath
     * their chalk marks.
     *
     * It keeps everything the old choice was picked for and adds the name:
     * the whole causal chain in one frame, cause and effect together, and
     * nothing airborne (a mid-flight freeze reads as floating rather than
     * falling). It is the last frame in which the word is still true, which is
     * exactly the frame the joke needs.
     *
     * RECONSIDERED WHEN THE SECOND TOWER ARRIVED, AND IT STAYS. The obvious
     * new candidate is the middle of the domino - `bryan` leaning onto `bar`,
     * `bar` just tipping - because that one frame proves the chain outright.
     * It was rejected for the reason that moved this still in the first place,
     * and the reason got STRONGER with the split, not weaker: there are two
     * words to lose now instead of one, and a visitor who has asked for no
     * motion sees this frame and no other. A mid-topple freeze spells nothing
     * twice over.
     *
     * And it turns out the chain does not need the topple to be legible. At
     * the strike the scene is FOUR THINGS IN A ROW, each all but touching the
     * next: blade, pipes, `bryan`, `bar`. Read left to right that is the whole
     * mechanism, laid out as a diagram rather than acted out - and the only
     * link a still can ever show is a contact, which this frame has three of.
     * The moving version supplies the consequences; the still supplies the
     * arrangement and both words. */
    const STILL_T = ERA + T_FALL + 0.02;

    /* ------------------------------------------------------------- helpers */

    // Clamped normalised progress of x through [a, b]. Every piece of motion in
    // this sketch is built from these, which is what makes the chains below
    // total functions: outside their segment they read 0 or 1, never undefined.
    function seg(x, a, b) { return x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a); }
    // THE ENDPOINTS ARE EXACT, not merely close. a + (b - a) is b only up to
    // rounding, so without this branch a carry that has finished lands its load
    // ~1e-14 px off the slot it is defined to land in - and "every piece ends
    // up back where it left" then holds to a tolerance instead of holding. The
    // hand-offs in this file are identities; this is what makes them identities
    // in floating point too. k = 0 already returns a exactly.
    function lp(a, b, k) { return k === 1 ? b : a + (b - a) * k; }
    function eo(k) { return 1 - (1 - k) * (1 - k); }                            // ease out
    function eio(k) { return k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k); }  // ease in-out

    // Integer hash -> [0, 1). Deterministic stand-in for randomness: the scene
    // must be identical on every load so it can be screenshot-tested. Integer
    // ops only — a Math.sin hash is not bit-identical across engines.
    function hash(n) {
      let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
      x ^= x >>> 13;
      x = Math.imul(x, 0xc2b2ae35);
      x ^= x >>> 16;
      return (x >>> 0) / 4294967296;
    }
    function rnd(era, i, k) { return hash(Math.imul(era, 374761393) + Math.imul(i, 40503) + k * 97); }

    // Half-extents of a girder of depth `h` rotated by `a`: how far it reaches
    // below its own centre (halfH) and to either side of it (halfX). A tilted
    // girder reaches further down AND wider than a flat one, which is why both
    // seating and the "is anything on top of me" test use these, never bw/2.
    function halfH(a, h) { return 0.5 * (h * Math.abs(Math.cos(a)) + L.bw * Math.abs(Math.sin(a))); }
    function halfX(a, h) { return 0.5 * (L.bw * Math.abs(Math.cos(a)) + h * Math.abs(Math.sin(a))); }

    // Horizontal overlap of two seated pieces' footprints, in pixels.
    function overlapX(a, b) {
      return Math.min(a.x + a.hx, b.x + b.hx) - Math.max(a.x - a.hx, b.x - b.hx);
    }

    /* -------------------------------------------------------------- layout
     *
     * THE WORLD IS CAPPED. Every horizontal position is a fraction of the WORLD
     * width, not of the canvas, and the world is at most WORLD_A times as wide
     * as it is tall, centred, with the spare canvas letterboxed. The grid, the
     * ground line, the hazard band and the crane's JIB still run the full
     * width - see L.jibR - so the frame reads as a site that continues past
     * the edges rather than as a composition with a margin around it.
     *
     * WHY. The page's hero is 60rem, so the canvas is 4:3 on a phone and up to
     * 16:9 on a desktop. With the composition pinned to W, the horizontal
     * distances stretched with the aspect while everything sized in u (which is
     * H/100) did not - so the pipes' run to the tower grew from 7.8 radii to
     * 11.2 while the roll stayed a couple of radii, and the tower fell before
     * they arrived. WORLD_A = 4/3 is the NARROWEST aspect the page can produce,
     * so the world is now the 4:3 composition at every viewport: u = WW/133.33
     * exactly, every distance is the same multiple of u, and a measurement
     * taken at one width holds at all of them.
     */

    const WORLD_A = 4 / 3;             // world aspect cap = the page's own 4:3 end
    const STACK_L = 0.755;             // LEFT tower centre, fraction of the world
    const TSEP    = 2.62;              // tower centres apart, in plate widths
    // How much of the crane's headroom the finished tower stands in. The rest
    // of it is the clearance the hook needs over the top course. See L.bh.
    // Raised from 0.40 with the letter plates: a plate is SQUARE, so eight of
    // them are 2.2x the steel a seven-beam stack was, and the tower has to be
    // allowed to be that tall. The residue is still a hard clearance and is
    // still stated as a fraction, so the guarantee below survives the change.
    const STACK_SHARE = 0.84;
    // Packing gap between courses, as a fraction of a plate's depth. Wide
    // enough to count courses and to keep each letter's outline off its
    // neighbour's; it is a plate fraction, so it scales with the piece.
    const COURSE_GAP  = 0.20;

    /* THE PIPE RUN, IN RADII. The chain only reads if the pipes actually reach
     * the tower, so the pipe radius is SOLVED from the ground the run has to
     * cover rather than clamped to a multiple of u. PDIV is that budget:
     *
     *   run + 0.30*bw  =  PDIV * r
     *   PDIV = 3 + PREB + PDISP + PGAPR*(NP - 1) + PSLK
     *
     * 3 radii of pyramid clearance (one at the yard end, two because the lead
     * pipe's home is a radius inside the pyramid's edge and it stops a radius
     * short of the tower's face), the lead pipe's rebound, the minimum travel
     * the REARMOST pipe must make, one gap per pair in the finished row, and
     * whatever is left over as hashed slack. The inequality is not asserted
     * anywhere: planEra RE-DERIVES the row from these same numbers, so changing
     * one term changes the divisor and the row together. */
    const PGAPR = 2.12;                // centres of two resting pipes, radii: > 2 = apart
    const PDISP = 2.80;                // MINIMUM travel, radii. No pipe falls in place.
    const PREB  = 1.10;                // how far the lead pipe rebounds off the tower
    const PSLK  = 1.00;                // spare radii, spread through the row by hash
    const PDIV  = 3 + PREB + PDISP + PGAPR * (NP - 1) + PSLK;

    // Recomputed every frame from W/H so a resize needs no cached state.
    const L = {};

    function layout() {
      // The world, and the letterbox. u is derived HERE, from the world rather
      // than from the canvas, so every proportion below is fixed.
      L.WW      = Math.min(W, WORLD_A * H);
      L.X0      = (W - L.WW) * 0.5;
      u         = Math.min(L.WW, H) / 100;

      L.ground  = H * 0.86;
      L.jibY    = H * 0.15;
      L.mastX   = L.X0 + L.WW * 0.13;
      /* THE JIB IS DRAWN TO THE CANVAS, NOT TO THE WORLD -- and it is the only
       * thing in the file that is. Everything the choreography touches (the
       * mast, every pick and drop point, the hook's travel, both rosters) is a
       * world quantity and stays one. The jib is pure scenery and it is the
       * one piece long enough to cross the letterbox, so it does: it grows
       * into the spare canvas until it is within a tenth of the margin of each
       * edge. That is what stops a 16:9 screen reading as a 4:3 picture with
       * dead air either side -- the grid, the ground line and the hazard band
       * already run the full width, and now the crane does too.
       *
       * At X0 = 0 -- the 4:3 end, where there is no margin -- both lines are
       * EXACTLY the world spans they were, so nothing about the narrow canvas
       * changes. The endpoints are published on __DIAG (jibL/jibR/cw), so how
       * far the composition actually reaches is a number a check can read
       * rather than something only a screenshot knows.
       *
       * The counter-jib is then capped at a third of the fore-jib. That cap is
       * inert at every aspect the page's own CSS asks for; it is here for the
       * one the CSS can produce by accident, since `max-height: 60vh` can hand
       * this holder a 4:1 box, where an edge-to-edge jib on a short mast would
       * otherwise grow a back-stay comparable to its own reach. */
      L.jibR    = L.X0 + L.WW * 0.95 + 0.90 * L.X0;   // reaches the pipes' far rest slot
      L.jibL    = Math.max(L.mastX - 0.34 * (L.jibR - L.mastX),
                           L.X0 + L.WW * 0.05 - 0.90 * L.X0);
      /* THE COMPOSITION CAME BACK LEFT, from 0.815 to 0.755, and that shift is
       * PART OF THE DEBRIS FIX rather than a side effect of it. Two towers plus
       * honest run-out do not fit where one tower stood, and the measurement
       * that says so was taken with the bound already removed: a single
       * eight-high stack then threw THREE plates into the world's own right
       * edge (__DIAG.wall = 3), so the ground to the right of the tower was
       * simply not there.
       *
       * WHAT PAYS FOR IT IS THE PIPE RUN. The run is yard edge to tower foot
       * and the pipe radius is SOLVED from it (see PDIV), so moving the tower
       * 0.060 of the world to the left takes 24% off the pipe radius, and that
       * is the whole price. The left-hand edge cannot give any of it back: at
       * 4:3 the cabin's ladder already stands half a layout unit from the world
       * edge, so the mast, the cabin and the yard are all pinned where they
       * are. The 24% was checked at 4x on the 520 px canvas rather than argued
       * about - the pyramid still reads as ten pipes with bores.
       *
       * STACK_L is the LEFT tower, `bryan`, and it is the one the pipes hit.
       * TSEP is the gap to `bar`, centre to centre, in plate widths: far enough
       * that the two read as two words AND that bryan's third sway apex still
       * misses bar - at least 0.28 of a plate width of daylight, the MINIMUM
       * over eight eras rather than the range the first four happened to show,
       * and it is __DIAG.swx against __DIAG.faceB that says so - close enough
       * that a toppling bryan genuinely arrives. The contact is MEASURED,
       * never scheduled: see simFall's domino. */
      L.stackX  = L.X0 + L.WW * STACK_L;   // LEFT tower: `bryan`, five courses

      // The yard is ONE row of N bays, so a girder returning to slot i is never
      // under or over another girder. That matters: recovery order is dictated
      // by the heap, so the yard has to accept the roster back in ANY order.
      L.yardL   = L.X0 + L.WW * 0.185;   // clears the mast's cones - do not move
      L.yardR   = L.X0 + L.WW * 0.545;   // and the bay width sets the plate: see L.bw
      L.yardStep = (L.yardR - L.yardL) / N;
      L.yardC   = (L.yardL + L.yardR) / 2;

      /* PLATE WIDTH IS CAPPED BY THE BAY IT HAS TO FIT IN, so the yard never
       * overlaps itself, the crane's cones, or the heap — including on a narrow
       * (4:3 phone) canvas, where the bays are much tighter than on 16:9. The
       * 1.18 is what leaves clear air between two letters standing in adjacent
       * bays: the plate is 1/1.18 of its bay, so 0.153 of a bay - about a sixth
       * of a plate, 3.4 px at the 520 px viewport and 4.2 px at 1100 - is the
       * gap between one letter and the next. The word reads as eight plates in
       * eight bays, not as a wordmark, and no two ever touch.
       *
       * DEPTH IS SOLVED FROM THE STACK, NOT FROM THE PLATE, and that
       * inversion is the only reason an eight-high tower actually LOOKS eight
       * high. It is the one thing here that is structural rather than tuned.
       *
       * WHAT CHANGED WITH THE LETTERS. A 3:1 beam cannot carry a legible `a`;
       * a knocked-out letter needs a roughly SQUARE plate. So the cap that used
       * to hold depth to half the length now holds it to the FULL length, and
       * the stack rule is what actually binds it at every viewport the page can
       * produce: 1.00 * bw is 0.0508 H against the stack rule's 0.0518 H, so
       * the plate comes out square and the tower comes out 0.478 H tall, inside
       * the 0.58 H of headroom with 0.10 H - four times a plate's own half
       * depth - left over the top course for the hook.
       *
       * THE TRAP IT GETS OUT OF. A bay is the yard span over N, so N bays in a
       * fixed span make each girder 1/N as long, and a depth pinned at a
       * FRACTION OF LENGTH shrinks with it. A stack of N courses is N depths
       * and N-1 half-depth gaps — bh * (1.5N - 0.5) — so with bh proportional
       * to 1/N the stack's height tends to a CONSTANT: 1.40 yard-spans at
       * N = 5, 1.43 at N = 7, 1.44 at N = 9. Courses buy no height at all.
       * Picking a bigger fraction of length only moves that constant; the
       * coupling survives it, and the next change to N walks straight back in.
       *
       * SO THE QUANTITY FIXED IS THE STACK'S HEIGHT, and the depth follows
       * from it. The height asked for is STACK_SHARE of the crane's own
       * headroom — the ground up to the height a load rides at — which makes
       * two claims true BY CONSTRUCTION, at every N and every viewport,
       * instead of true of one measurement: N courses stand taller than N - 2,
       * and the finished stack clears travelY with room for the hook, that
       * room being the other 1 - STACK_SHARE of the headroom.
       *
       * THE 1.00 * bw CAP IS A GUARD, and it is now the SQUARENESS guarantee
       * as well: on a canvas whose headroom is generous enough for the stack
       * rule to ask for more depth than the plate is wide, the plate stays
       * square and the tower simply stands shorter than its share. A letter is
       * never stretched. Nothing in this file scales a plate any other way.
       *
       * The yard also grew, from 0.315 of the world to 0.360 (rightward only —
       * the left edge is pinned by the mast's cones), which is what keeps an
       * EIGHTH of it a usable plate width. What pays for the wider yard is
       * the pipe run, and the tower moving right is what pays that back: see
       * L.pipeR.
       *
       * Measured at 960x457: bay 27.4 px, plate 23.2 x 23.2 px, an 8-high stack
       * 218.4 px in 265.1 px of headroom, and 46.6 px left over the top course
       * against the 11.6 px half-depth of the load crossing above it. Scaled to
       * the 960x517 the 7-beam tower was measured on, that is a bay of 31.0, a
       * 26.3 px plate and a 247 px stack against its 119.9 px - 2.06x. At
       * 488x366, the 520 px viewport, the plate is 18.6 px square and the stack
       * 174.9 px in 212.3 px of headroom. */
      L.travelY = L.jibY + 13 * u;     // plate centre height while crossing the site
      L.bw      = Math.min(13 * u, L.yardStep / 1.18);
      L.bh      = Math.min(1.00 * L.bw,
                           STACK_SHARE * (L.ground - L.travelY)
                             / (N + (N - 1) * COURSE_GAP));
      L.gap     = L.bh * COURSE_GAP;   // packing gap, wide enough to count courses
      L.dun     = 0.9 * u;             // timber bearers under each yard bay
      L.hutX    = L.mastX - 8.4 * u;   // site cabin, tucked in beside the mast

      // Heap bounds, in girder lengths rather than canvas fractions: the heap
      // has to hold N pieces two courses deep, which is a fact about the
      // girders and not about the viewport. These are a HARD clamp on where a
      // fallen piece may come to rest, so debris can reach neither the yard on
      // the left nor the pipe ground on the right, however the physics falls.
      // Asymmetric because the topple direction is fixed (see planEra).
      L.stack2X = L.stackX + TSEP * L.bw;  // RIGHT tower: `bar`, three courses
      L.heapL   = L.stackX - 0.80 * L.bw;
      /* THE RIGHT-HAND BOUND IS THE VIEW, AND IT IS A BACKSTOP RATHER THAN A
       * WALL. It used to be stackX + 3.20*bw: a constant multiple of a girder
       * length, sitting 1.65 plate widths inside the world's own right edge,
       * and the physics reached it on nearly every fall. Worse, arriving there
       * ZEROED the piece's horizontal velocity, so a plate that should have
       * leaned on and tumbled to a stop instead stopped dead and dropped
       * vertically. That pair - a near bound, and a bound that annihilates
       * motion - is the "hard edge" the scene showed.
       *
       * So the bound is now the world's own right edge, less half a plate, and
       * NOTHING IN THE FALL ZEROES vx AT IT (see edgeStop). It is a guard that
       * keeps debris on the canvas, not a shelf the heap piles against. The
       * count of pieces that touch it at all is published as __DIAG.wall, so
       * "the wall is gone" is a number a check reads rather than a claim this
       * comment makes.
       *
       * WORLD-PINNED, NOT CANVAS-PINNED. Every distance in the fall is a
       * multiple of u and u is derived from the world, so a world-pinned bound
       * makes the debris spread identical at every aspect. At 4:3 - the phone
       * end, and the width the complaint was made at - the world edge IS the
       * view edge, so the two readings coincide exactly where it matters.
       *
       * heapL is untouched: it guards the pipe ground and the yard, which are
       * real objects to the left, and the topple direction is fixed rightward
       * so nothing is pressed against it. */
      L.heapR   = L.X0 + L.WW - 0.50 * L.bw;
      L.supMax  = 1.55 * L.bh;         // most surface a piece will lie ON: ~2 courses

      // Height-field window: wide enough that no seated piece can fall off it.
      L.fx0     = L.heapL - 1.2 * L.bw;
      L.fdx     = ((L.heapR + 1.2 * L.bw) - L.fx0) / (FCOLS - 1);

      // THE PIPE GROUND. The run is yard-edge -> tower foot: the pipes sit
      // BETWEEN the dozer's approach and the tower, so the blade knocks the
      // pipes and the PIPES knock the tower. The dozer never touches the tower.
      //
      // The radius is SOLVED from that run (see PDIV) and is NOT clamped to a
      // multiple of u. The clamp is what broke the chain: on a wide canvas it
      // pinned the pipes small while the run kept growing, so the distance to
      // cover was a fraction of the canvas while the roll was a couple of
      // radii, and the two were simply unrelated. Solved, run/pipeR is the
      // constant PDIV on every canvas, so the beat is identical at every width.
      const run = L.heapL - L.yardR;                        // clear ground to roll along
      L.pipeR   = (run + 0.30 * L.bw) / PDIV;
      L.pipeX   = L.yardR + (PK + 1) * L.pipeR;             // pyramid centre
      // THE CONTACT POINT. The tower's own left FACE, one radius out - which is
      // where a pipe touching it has its centre. Not heapL (the debris clamp,
      // 0.3 * bw further left, which is what the pipes used to stop at) and not
      // the canvas edge. The lead pipe's roll ends exactly here, so the strike
      // is a property of the layout at every viewport.
      L.pipeLim = L.stackX - 0.5 * L.bw - L.pipeR;
    }

    // Home slots. Functions of the LAYOUT ONLY — never of era, build order or
    // recovery order. Both rosters, one rule.
    function yardX(i) { return L.yardL + (i + 0.5) * L.yardStep; }
    function yardY() { return L.ground - L.dun - L.bh * 0.5; }
    function home(i) { return { x: yardX(i), y: yardY(), a: 0 }; }

    /* THE PIPE PYRAMID, COURSE BY COURSE FROM THE GROUND UP. Course c holds
     * PK - c pipes; the valley rise is r*sqrt(3) - the height of an equilateral
     * triangle of side 2r - so course c stands c*sqrt(3) radii above the
     * ground course and every nested pipe really does touch both of the pipes
     * below it. Four courses: 4 + 3 + 2 + 1, base 8r wide, apex centre at
     * (1 + 3*sqrt(3)) r = 6.196 r.
     *
     * SLOTS RUN COURSE BY COURSE, LOWEST FIRST, and left to right inside a
     * course. That is not bookkeeping, it is the ordering rule the recovery
     * depends on: every slot in a course has a smaller index than every slot
     * in the course above it, so filling the slots IN INDEX ORDER completes
     * each course before anything nests on it, and a pipe is never lowered
     * into a valley that does not yet exist. With two courses that held by
     * accident of the index; with four it is stated here and re-derived by
     * pipeCell.
     *
     * A SLOT IS NOT A PIPE. The k-th pipe the crane picks up goes into slot k
     * - pl.pslot - so "bottom-up" is a property of the SLOT NUMBERING and
     * holds whichever pipe happens to be in the hook. Everything from here to
     * pipeLR takes a SLOT index; pl.pmap is what turns a pipe id into one. */
    const SQ3 = 1.7320508075688772;

    // Which course a SLOT belongs to, and where along it. Total function: every
    // s in 0..NP-1 lands in exactly one course, because the courses partition
    // the pyramid by construction (PK + (PK-1) + ... + 1 = NP). The argument is
    // a slot, not a pipe id: the two coincided before the recovery order was
    // decoupled from identity, and they no longer do.
    function pipeCell(j) {
      let c = 0, base = 0;
      while (c < PK - 1 && j >= base + (PK - c)) { base += PK - c; c++; }
      return { c: c, m: j - base };
    }
    // A pipe's x offset from the pyramid's centreline, in RADII. Integer, so it
    // is exact and the left-to-right order below can be settled without any
    // layout at all.
    function pipeOff(q) { return 2 * q.m - (PK - q.c - 1); }

    // WHERE A SLOT IS. Layout only, and a = 0 for every slot in every course,
    // which is what lets a pipe be set down in ANY slot without its rotation
    // mark landing at an angle the slot next to it does not also have.
    function pipeHome(s) {
      const r = L.pipeR, q = pipeCell(s);
      return { x: L.pipeX + pipeOff(q) * r,
               y: L.ground - (1 + q.c * SQ3) * r, a: 0 };
    }

    /* THE SLOTS, LEFT TO RIGHT ALONG THE PYRAMID. Sorted by x offset, ties
     * (a nested pipe sits directly above one two courses below it) broken by
     * course, lowest first. Consecutive home slots are therefore at most ONE
     * radius apart. Every gap in the rest row is at least 2 r, which is what
     * makes each pipe travel at least a radius further than the one behind it
     * - and therefore makes the minimum travel over the whole roster the
     * REARMOST pipe's, a single number rather than a survey.
     *
     * Computed once from PK alone: no hash, no layout, no allocation per frame. */
    const PLR = (function () {
      const a = [];
      for (let j = 0; j < NP; j++) { const q = pipeCell(j); a.push([pipeOff(q), q.c, j]); }
      a.sort(function (x, y) { return (x[0] - y[0]) || (x[1] - y[1]); });
      const o = new Array(NP);
      for (let m = 0; m < NP; m++) o[m] = a[m][2];
      return o;
    })();
    function pipeLR(m) { return PLR[m]; }

    /* THE PICK RULE, AS A FUNCTION OF A ROW OF POSES. This is the one rule
     * the recovery runs on, factored out so it can be run on rows OTHER than
     * the one an era produces: the era permutation below is DERIVED by running
     * it, and __DIAG.sweep hands the same function to a checker, which is the
     * only way this guard gets exercised at all - on the row this file
     * actually builds it is inert, and planEra says why in full.
     *
     * b IS ON a when b's centre is more than CHI radii higher than a's and the
     * two centres are within CDIA diameters - the same contact the drop
     * integration solves (a pipe at horizontal offset dx rides
     * sqrt(4r^2 - dx^2) above the one under it), read as a relation instead of
     * as a height. The pick is the LEFTMOST pipe still down that nothing still
     * down is resting on.
     *
     * TOTAL. It returns a permutation of 0..NP-1 for ANY row, however
     * malformed. Lifting a pipe can only ever free others and never trap one,
     * and "is on" is strictly ordered by height, so a ring of mutually-loaded
     * pipes cannot exist and the `left` fallback is unreachable; it is here so
     * that a NaN or a nonsense row leaves the roster COMPLETE rather than
     * short, which is the one outcome worse than a bad order. `cyc` counts it
     * and is published, so the unreachable branch is still observable. */
    const CDIA = 1.02;                 // centres within this many diameters touch
    const CHI  = 0.02;                 // ...and this many radii higher is "on top of"
    function clearSweep(rx, ry, rad) {
      const q = new Array(NP), idx = new Array(NP), taken = new Array(NP);
      const ord = new Array(NP);
      for (let j = 0; j < NP; j++) { taken[j] = false; ord[j] = j; }
      // The row, sorted on where the pipes actually lie. Insertion sort: NP is
      // 10, this runs once an era, and it is stable, so two pipes at the same
      // x keep the order they were handed in.
      for (let a = 1; a < NP; a++) {
        const v = ord[a];
        let b = a - 1;
        while (b >= 0 && rx[ord[b]] > rx[v]) { ord[b + 1] = ord[b]; b--; }
        ord[b + 1] = v;
      }
      const dia = 2 * rad * CDIA, hi = CHI * rad;
      let blocked = 0, cyc = 0;
      for (let k = 0; k < NP; k++) {
        let pick = -1, left = -1;
        for (let m = 0; m < NP; m++) {
          const j = ord[m];
          if (taken[j]) continue;
          if (left < 0) left = j;        // the leftmost remaining, clear or not
          let clear = true;
          for (let i = 0; i < NP; i++) {
            if (i === j || taken[i]) continue;
            if (ry[i] > ry[j] - hi) continue;                   // not above it
            const dx = rx[i] - rx[j], dy = ry[i] - ry[j];
            if (dx * dx + dy * dy <= dia * dia) { clear = false; break; }
          }
          if (!clear) { blocked++; continue; }
          pick = j;
          break;
        }
        if (pick < 0) { pick = left; cyc++; }
        taken[pick] = true;
        q[k]        = pick;
        idx[pick]   = k;
      }
      return { q: q, idx: idx, blocked: blocked, cyc: cyc };
    }

    /* WHO STANDS WHERE, ERA BY ERA. A pipe is set down in the slot its
     * COLLECTION ORDER gives it, and collection order is whatever clearSweep
     * makes of the fallen row - which, for the row planEra lays out, is left
     * to right, and that is the order the pipes' STARTING slots run left to
     * right, because the row is laid out from the pyramid outward and never
     * reorders. So the pipe that starts an era in slot s ends it in slot
     * PSTEP[s]. ONE ERA OF THE LOOP IS THAT PERMUTATION.
     *
     * PSTEP IS READ OFF THE RULE, NOT TYPED BESIDE IT. clearSweep is run here
     * on a CANONICAL row - the roster laid out flat and evenly spaced, which
     * is the shape planEra's row always has, with the pipe from slot pipeLR(m)
     * lying at position m - and the answer is what PSTEP is. Change the pick
     * rule and this follows it; there is no second statement of the order that
     * could disagree with the first.
     *
     * The arrangement at the head of era E is PSTEP composed with itself E
     * times. POWTAB is those powers, computed once, so pipeMap is a TABLE
     * LOOKUP: a headless jump to any era stays O(1), the plan cache stays two
     * deep, and nothing walks through the eras in between. Era 0 is the
     * identity, so the opening pyramid is exactly the layout's.
     *
     * The table's length is the permutation's own order - 9 at PK = 4: slot 0
     * is fixed and the other nine form a single cycle - and it is DERIVED by
     * composing until the identity comes back, never typed, so PK alone still
     * decides it. The cap is Landau's bound territory, not a tuning knob; it
     * exists so a malformed PLR cannot spin here forever. */
    const PSTEP = (function () {
      const xs = new Array(NP), ys = new Array(NP);
      for (let m = 0; m < NP; m++) { xs[m] = 3 * m; ys[m] = 0; }
      const sw = clearSweep(xs, ys, 1);      // position m is picked sw.idx[m]-th
      const f = new Array(NP);
      for (let m = 0; m < NP; m++) f[pipeLR(m)] = sw.idx[m];
      return f;
    })();
    const POWTAB = (function () {
      const isId = function (a) {
        for (let i = 0; i < NP; i++) if (a[i] !== i) return false;
        return true;
      };
      const id = new Array(NP);
      for (let i = 0; i < NP; i++) id[i] = i;
      const tab = [id];
      let f = PSTEP.slice();
      while (!isId(f) && tab.length < 5040) {
        tab.push(f);
        const g = new Array(NP);
        for (let i = 0; i < NP; i++) g[i] = PSTEP[f[i]];
        f = g;
      }
      return tab;
    })();
    // Pipe j stands in slot pipeMap(era)[j] at the head of that era. A COPY:
    // the caller keeps it on a cached plan, and two cached plans must not hold
    // the same array.
    function pipeMap(era) {
      const n = POWTAB.length;
      return POWTAB[((era % n) + n) % n].slice();
    }

    // Stack slots. Level 0 is the bottom course.
    /* PLACEMENT INDEX -> TOWER, COURSE, AND HEIGHT. n is the order the crane
     * lays plates in, 0 first. The first N - SPLIT placements build the RIGHT
     * tower from its base, the rest build the LEFT tower from its base, so a
     * placement index is (tower, course) and nothing else in the file has to
     * know which tower it is looking at. slotY still takes the PLACEMENT index
     * - every existing call site passes one - and resolves the course itself,
     * which is why course 0 of both towers correctly sits on the ground. */
    function towerOf(n)  { return n < RSPLIT ? 1 : 0; }           // 1 = right, `bar`
    function courseOf(n) { return n < RSPLIT ? n : n - RSPLIT; }
    function towerH(tw)  { return tw === 0 ? SPLIT : RSPLIT; }
    function towerX(tw)  { return tw === 0 ? L.stackX : L.stack2X; }
    // The placement index that fills course c of tower tw - the inverse of the
    // pair above, and the only way a reader of the towers addresses a course.
    function slotOf(tw, c) { return tw === 0 ? RSPLIT + c : c; }
    function slotY(n) { return L.ground - L.bh * 0.5 - courseOf(n) * (L.bh + L.gap); }

    /* THE WORD, READ OFF THE POSES THAT WERE DRAWN — never off the plan.
     *
     * This is the difference between publishing a FACT and publishing an
     * INTENTION. WORD[pl.order[n]] would spell `bryanbar` down the tower even
     * if the choreography had put the wrong plate in the course, and
     * WORD[i] would spell it along the yard even if plate i had come home to
     * somebody else's bay. So neither is used. For each of the eight BAYS this
     * asks which plate is standing at that bay's home pose, and for each of the
     * eight COURSES which plate is standing in that course's slot, and writes
     * the letter of whatever it finds — or '.' where it finds nothing. A word
     * that is broken prints as a broken word, and a home-return regression
     * shows up here as a swapped pair of letters.
     *
     * The yard match is EXACT (WEPS is a rounding tolerance, not a fit): a
     * plate at rest in the yard is drawn at home(k) by identity, through lp()'s
     * exact endpoints, so anything else is a real displacement. The tower match
     * is a fit, to a quarter of a plate's depth and half its width, because the
     * upright stack pose is reconstructed through a rotation by zero and is
     * only equal to the slot to within rounding. A quarter of a plate cannot
     * confuse two courses: they are 1.20 plate-depths apart.
     *
     * Reads TOP TO BOTTOM, i.e. course N-1 first, which is the direction the
     * tower is meant to be read in. */
    const WEPS = 1e-6;
    function readWords(pl, gx, gy, ga, out) {
      let g = '';
      for (let k = 0; k < N; k++) {
        const hm = home(k);
        let ch = '.';
        for (let id = 0; id < N; id++) {
          if (Math.abs(gx[id] - hm.x) < WEPS && Math.abs(gy[id] - hm.y) < WEPS
              && Math.abs(ga[id] - hm.a) < WEPS) { ch = WORD.charAt(id); break; }
        }
        g += ch;
      }
      /* BOTH TOWERS, LEFT THEN RIGHT, EACH TOP TO BOTTOM - which is the order
       * the pair is meant to be read in, and the concatenation is still the
       * whole word. The x fit is half a plate width against towers TSEP plate
       * widths apart, so a course of `bar` can never be mistaken for the course
       * of `bryan` at the same height; the y fit is a quarter of a plate depth
       * against courses 1.20 depths apart. Both words are published
       * SEPARATELY as well, so a check can say which tower broke. */
      let wl = '', wr = '';
      for (let tw = 0; tw < 2; tw++) {
        for (let c = towerH(tw) - 1; c >= 0; c--) {
          const n = slotOf(tw, c), sx = pl.slotX[n], sy = slotY(n);
          let ch = '.';
          for (let id = 0; id < N; id++) {
            if (Math.abs(gx[id] - sx) < 0.50 * L.bw
                && Math.abs(gy[id] - sy) < 0.25 * L.bh) { ch = WORD.charAt(id); break; }
          }
          if (tw === 0) wl += ch; else wr += ch;
        }
      }
      const w = wl + wr;
      out.lword = wl;
      out.rword = wr;
      out.gword = g;
      out.tword = w;
    }

    /* ------------------------------------------------- the pile, as a solid
     *
     * A height field over the ground, FCOLS columns wide. Seating a piece reads
     * the surface under it and stamps its own crown back, so whatever is seated
     * next lands on it. The same field code serves the falling simulation, the
     * initial heap and every post-removal re-settle, which is why the pile
     * behaves consistently. */

    /* COLUMN COUNT IS TIED TO THE DEBRIS SPAN, NOT PICKED. The field has to
     * cover heapL-1.2bw .. heapR+1.2bw, and that span grew from 6.4 plate
     * widths to ~11 when the debris bound moved out to the view edge. A column
     * is what a probe averages over, so leaving the count at 72 would have
     * coarsened every seat by the same factor the ground widened by. 108 holds
     * a column at ~0.10 bw - the resolution the 72 columns bought over the old
     * narrow heap - and __DIAG.fdx publishes the number in plate widths so a
     * check reads it rather than trusting this comment. */
    const FCOLS = 108;

    function meanField(f, xa, xb) {
      let a = Math.round((xa - L.fx0) / L.fdx);
      let b = Math.round((xb - L.fx0) / L.fdx);
      if (b < a) { const t = a; a = b; b = t; }
      if (a < 0) a = 0;
      if (b > FCOLS - 1) b = FCOLS - 1;
      // The whole probe fell off one end of the field: use the nearest column.
      if (b < a) return f[Math.max(0, Math.min(FCOLS - 1, a))];
      let s = 0;
      for (let k = a; k <= b; k++) s += f[k];
      return s / (b - a + 1);
    }

    // Surface height under a contact corner. Probed over a small span rather
    // than one column: a single column is 4 px wide and a stamp steps by up to
    // half a girder depth, so a point probe presents 60-degree cliffs and
    // settles pieces standing against them.
    function fieldAt(f, x) { return meanField(f, x - 0.11 * L.bw, x + 0.11 * L.bw); }

    /* THE ONLY PLACE A BOUND MAY TOUCH A PIECE THAT IS STILL MOVING, and the
     * whole of the fix to the hard edge is the two lines below: the position is
     * clamped, and the horizontal velocity is BLED rather than annihilated.
     *
     * Zeroing vx is what made a plate stop leaning and drop vertically the
     * instant it met the bound - the piece kept falling but stopped travelling,
     * which is exactly the "hard edge" a viewer sees. Multiplying instead means
     * a piece that does arrive keeps tumbling, keeps sliding, and is brought to
     * rest by Coulomb friction (the legitimate path) within a few steps rather
     * than by a wall within one. EDGEK is a coefficient of restitution's
     * cousin: sub-critical, so no piece can gain motion here.
     *
     * `wall` is set on any piece this touches. It is a COUNT carried out to
     * __DIAG, so "the bound is where a piece never normally reaches" is a
     * number a check reads instead of a sentence a comment writes. */
    const EDGEK = 0.60;
    /* THE DEFECT ITSELF, AS A COUNTER - because `wall` alone does not name it.
     * The complaint was not "a piece stops at a line", it was that they "fall
     * straight down instead of leaning all the way to the right": a plate that
     * was leaning and then, at some invisible x, stops TRAVELLING and only
     * descends. That is what a bound which zeroes vx produces, and it shows in
     * the trace long before it shows in a resting position - a run of airborne
     * steps whose horizontal delta is a rounding error against their vertical
     * one.
     *
     * So every piece counts its own longest such run and the roster's worst is
     * published as __DIAG.vdrop. This check HAS a failing case and it is not
     * hypothetical: run the same measurement over the build this one replaces
     * and the runs are tens of steps long, because there vx really was set to
     * zero mid-flight. A fall that leans the whole way cannot produce more than
     * a couple of steps, since vx is never zero while the piece is in the air.
     *
     * DROPR is a RATIO, so the discriminating half of the test is scale-free;
     * only the floor under "descending at all" needs a length, and it is a
     * fraction of a plate width like every other length in the file. */
    const DROPR = 0.10;                // |dx| under this fraction of dy: straight down
    const DROPF = 0.007;               // of a plate width: the floor on dy per step
    function edgeX(b, x, lo, hi) {
      if (x > hi) { b.vx *= EDGEK; b.wall = 1; return hi; }
      if (x < lo) { b.vx *= EDGEK; b.wall = 1; return lo; }
      return x;
    }

    /* Hard bound on where a fallen piece may LIE - the resting twin of edgeX,
     * which bounds one that is still moving. It stays as the guard that keeps a
     * seated piece on the canvas whatever the seating arithmetic does.
     *
     * IT IS ALSO CLAIMED TO BE INERT now that the bound sits at the view edge,
     * and that claim is MEASURED rather than written: sleepPiece records the
     * distance this moves each piece, planEra adds them up, and __DIAG.oob /
     * __DIAG.oobm publish how many seats it touched and the furthest it shifted
     * one. Between wall (moving) and oob (resting) there is no path by which
     * the debris bound can shape a pose without a counter moving off zero. */
    function clampHeap(x) {
      if (x < L.heapL) return L.heapL;
      if (x > L.heapR) return L.heapR;
      return x;
    }

    // The HIGHEST surface under a span, as against meanField's average. A girder
    // is rigid: it cannot sink into what is under it, so where it comes to rest
    // is somewhere between "bearing on everything" (the mean) and "bridging the
    // high points" (the max). See SUPB.
    function maxField(f, xa, xb) {
      let a = Math.round((xa - L.fx0) / L.fdx);
      let b = Math.round((xb - L.fx0) / L.fdx);
      if (b < a) { const t = a; a = b; b = t; }
      if (a < 0) a = 0;
      if (b > FCOLS - 1) b = FCOLS - 1;
      let m = -Infinity;
      for (let k = a; k <= b; k++) if (f[k] > m) m = f[k];
      return m === -Infinity ? 0 : m;
    }

    function stampField(f, xa, xb, top) {
      let a = Math.round((xa - L.fx0) / L.fdx);
      let b = Math.round((xb - L.fx0) / L.fdx);
      if (a < 0) a = 0;
      if (b > FCOLS - 1) b = FCOLS - 1;
      for (let k = a; k <= b; k++) if (f[k] < top) f[k] = top;
    }

    /* Seat a set of pieces onto bare ground, in the given order, and return a
     * pile STATE: pose[id] for every live piece, alive[id] flags, and a paint
     * order (lowest first, so pieces genuinely on top are painted on top).
     *
     * `prev` is the state this one is settling FROM, or null for the first
     * heap. Every piece is clamped to `prev`'s height: a re-settle may only
     * lower a piece, never raise it. Without that clamp the small sideways
     * slump below could occasionally move a footprint onto a taller column and
     * pop a piece upward, which reads as broken physics. */
    function seatAll(era, items, prev, fix) {
      const f = new Array(FCOLS);
      for (let k = 0; k < FCOLS; k++) f[k] = 0;

      const st = { pose: new Array(N), alive: new Array(N), order: [] };
      for (let i = 0; i < N; i++) { st.pose[i] = null; st.alive[i] = false; }

      for (let q = 0; q < items.length; q++) {
        const it = items[q], id = it.id;
        let x, a, hh, hx, bedK = 1;

        if (fix) {
          /* PASS 2 (see seatPile). x and angle are whatever pass 1 settled on
           * and are copied here unchanged: the ONLY thing this pass re-solves
           * is height. A change in load can therefore let a piece down but can
           * never slide it sideways or spin it, which is what would happen if
           * the whole contact search were re-run against a moved surface.
           *
           * The collapse uses the same door: the simulation's own settled x and
           * angle are handed in here, so the canonical rest pose the crane
           * later picks up from is the pose the physics actually produced,
           * re-solved only for height against this field. */
          const q1 = fix.pose[id];
          x = q1.x; a = q1.a; hh = q1.hh; hx = q1.hx;
          bedK = 1 - JAM * fix.jam[id];
        } else {

          /* WHERE IT COMES TO REST. A girder that lands two-thirds on top of
           * another does not balance there, it slides off — and without that
           * rule a heap laid down piece-by-piece marches upward into a
           * staircase, which is a re-stacked tower wearing a different hat.
           * So: try the spot it was thrown to, then alternate outward from it,
           * and take the first spot where the surface it would be lying on is
           * no higher than supMax (about two courses). If nowhere qualifies,
           * take the lowest spot tried. Fixed candidate count, no recursion. */
          const bias = rnd(era, id, 40) < 0.5 ? -1 : 1;
          let sup0 = Infinity;
          x = clampHeap(it.x);
          for (let k = 0; k < 7; k++) {
            const xc = clampHeap(it.x + (k === 0 ? 0 : bias * (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.40 * L.bw));
            const s = meanField(f, xc - 0.5 * L.bw, xc + 0.5 * L.bw);
            if (s < sup0) { sup0 = s; x = xc; }
            if (s <= L.supMax) { x = xc; break; }
          }

          // Resting angle from the slope of what is underneath. Screen y grows
          // downward, so a surface HIGHER on the right (hR > hL) tilts the piece
          // anticlockwise, i.e. a NEGATIVE p5 angle.
          const probe = 0.5 * L.bw;
          const hL = meanField(f, x - probe, x);
          const hR = meanField(f, x, x + probe);
          a = -Math.atan2(hR - hL, probe) * 0.62 + (rnd(era, id, 3) - 0.5) * 0.30;
          if (a > 0.70) a = 0.70;
          if (a < -0.70) a = -0.70;

          hh = halfH(a, L.bh); hx = halfX(a, L.bh);
        }

        /* SUPPORT: MOSTLY THE HIGH POINTS, PARTLY THE MEAN. A rigid girder
         * bridges what is under it rather than moulding to it, so it does not
         * settle to the average of the surface it lies across; but nor does it
         * perch on the single highest crumb, which is what a pure max would
         * give. SUPB is the blend, and it is the SAME number the falling
         * simulation beds a landed piece with, so the pose the physics settles
         * into and the pose the pile seats it at agree and the reconciliation
         * has almost nothing to walk out.
         *
         * What stops a fallen pile re-stacking itself into a second tower is
         * NOT this line - it is the supMax candidate search above, which
         * refuses a spot whose surface is already two courses up and takes the
         * lowest one tried instead. */
        const sm  = meanField(f, x - hx, x + hx);
        const sup = sm + SUPB * (maxField(f, x - 0.8 * hx, x + 0.8 * hx) - sm);
        // Beds in a little — LESS the more is lying on it. bedK is 1 for a
        // piece carrying nothing and falls toward 0 as its load grows, and it
        // only ever REDUCES the bed, so a girder is never lifted clear of the
        // surface it rests on however loaded it is.
        let cH = sup + hh - bedK * (0.14 + 0.10 * rnd(era, id, 2)) * L.bh;
        // Floor first, monotone clamp second, and in that order deliberately.
        // The floor stops a piece being SEATED through the ground. The clamp is
        // the one that has to be exact — a re-settle may only ever LOWER a
        // piece — so it wins, and where they disagree the piece is simply held
        // at a height it already occupied.
        if (cH < hh * 0.55) cH = hh * 0.55;
        if (prev && prev.pose[id] && cH > prev.pose[id].cH) cH = prev.pose[id].cH;

        st.pose[id] = { x: x, y: L.ground - cH, a: a, cH: cH, hh: hh, hx: hx };
        st.alive[id] = true;
        // Stamp the crown this piece now presents to whatever lands on it. A
        // tilted piece really does stand taller than a flat one — hence hh, not
        // a constant — but the stamp is capped, because a girder resting across
        // the high corner of another slides down it rather than perching on the
        // tip. Set low deliberately: a taller cap fans the debris into a ramp.
        stampField(f, x - hx * 0.94, x + hx * 0.94, cH + Math.min(hh, 0.52 * L.bh));
      }

      // Paint order: lowest crown first. Insertion sort — N is small.
      for (let i = 0; i < N; i++) {
        if (!st.alive[i]) continue;
        let k = st.order.length;
        st.order.push(i);
        while (k > 0 && st.pose[st.order[k - 1]].cH > st.pose[i].cH) {
          st.order[k] = st.order[k - 1];
          st.order[k - 1] = i;
          k--;
        }
      }
      return st;
    }

    /* THE PILE REACTS TO BEING UNLOADED. A girder with others lying across it
     * is wedged: it is holding them up through the contact points it happened
     * to land on and has not bedded into the heap the way a piece carrying
     * nothing has. Take the weight off and it settles.
     *
     * So the heap is solved TWICE per state. Pass 1 lays the pieces bedded,
     * purely to learn who is lying on whom. Pass 2 lays the same pieces at the
     * same x and the same angle, each held off its bed in proportion to the
     * load it carries, and THAT is the pose drawn. Both passes are the same
     * function, so there is one seating rule, not two. JAM = 0 recovers the
     * single-pass geometry exactly. */
    const JAM = 0.72;

    // Load, counted off pass 1's own geometry: pieces overlapping this one's
    // footprint that are clearly above it. 0.45^load is the standard
    // diminishing-return curve — 0 for a bare piece, 0.55 with one on it, 0.80
    // with two — so the first piece landing on a girder does most of the work.
    function loadJam(st) {
      const jam = new Array(N);
      for (let i = 0; i < N; i++) {
        let load = 0;
        if (st.alive[i]) {
          const a = st.pose[i];
          for (let j = 0; j < N; j++) {
            if (j === i || !st.alive[j]) continue;
            const b = st.pose[j];
            if (overlapX(a, b) > 0.12 * L.bw && b.cH > a.cH + 0.30 * L.bh) load++;
          }
        }
        jam[i] = 1 - Math.pow(0.45, load);
      }
      return jam;
    }

    function seatPile(era, items, prev) {
      const p1 = seatAll(era, items, prev, null);
      return seatAll(era, items, prev, { pose: p1.pose, jam: loadJam(p1) });
    }

    /* THE TOP-FIRST RULE, in one line of arithmetic: take the live piece whose
     * CENTRE is highest. Strictly, with no tie-break and no threshold, so
     * "topmost" is a single number a reviewer can read off any frame rather
     * than a policy that has to be trusted. */
    function pickTop(st) {
      let best = -1, bestH = -Infinity;
      for (let i = 0; i < N; i++) {
        if (!st.alive[i]) continue;
        if (st.pose[i].cH > bestH) { bestH = st.pose[i].cH; best = i; }
      }
      return best;                       // >= 0: pickTop is only called with pieces left
    }

    /* Take `removedId` out and re-seat what is left. Pieces that were bearing
     * on it slide a little INTO the gap it leaves before being re-seated, so
     * the heap visibly closes up rather than just sagging in place. The slide
     * is bounded per step and the whole heap is re-derived from scratch each
     * era, so it cannot accumulate. Survivors are re-seated LOWEST FIRST. */
    function settleStep(era, prev, removedId, step) {
      const rp = prev.pose[removedId];
      const items = [];
      for (let id = 0; id < N; id++) {
        if (!prev.alive[id] || id === removedId) continue;
        const q = prev.pose[id];
        let x = q.x;
        if (overlapX(q, rp) > 0.10 * L.bw && q.cH > rp.cH - 0.85 * L.bh) {
          const dir = rp.x > q.x ? 1 : -1;
          x += dir * (0.10 + 0.08 * rnd(era, id, 30 + step)) * L.bw;
        }
        // Insertion sort by current crown height, lowest first.
        let k = items.length;
        items.push({ id: id, x: x, cH: q.cH });
        while (k > 0 && items[k - 1].cH > q.cH) {
          const t = items[k]; items[k] = items[k - 1]; items[k - 1] = t;
          k--;
        }
      }
      return seatPile(era, items, prev);
    }

    /* ============================================================ THE FALL
     *
     * Integrated, once per era, at a FIXED step, ABOUT THE PIVOT.
     *
     * The model, from physics/RECOMMENDATION.md:
     *
     *     psi   = angle of the (pivot -> centre of mass) ray from straight UP,
     *             signed positive in the direction of fall. NOT the body angle.
     *     r     = |pivot -> CM|
     *     I_cm  = (1/12)*m*(w^2 + t^2)              uniform box
     *     k     = 1 + I_cm/(m*r^2) = I_pivot/(m*r^2)
     *
     *     psi'' = (g/r) * sin(psi) / k
     *
     * Mass cancels; only shape and lever arm matter. The body angle tracks psi
     * one-for-one, so psi is integrated and theta is derived. The CM's world
     * position is DERIVED from the pivot — x = px + r*sin(psi) — never carried
     * independently and offset at draw time, which is the failure that produces
     * a spin about the centre.
     *
     * The `/k` is the whole difference between steel and cardboard: for the
     * stack it is ~1.35, for a girder on its corner it is exactly 4/3, and
     * dropping it runs the fall several times too fast. It is also what makes
     * ONE g work for pieces of different size.
     *
     * FOUR PHASES, ONE ODE, AND A HARD RULE:
     *   SWAY    authored envelope, stack-level (a flat girder cannot rock about
     *           its own corners — Housner kappa is NEGATIVE for these
     *           proportions, so a per-girder teeter is not merely stylised, it
     *           is impossible). Ends at the third apex, where the envelope's
     *           angular velocity is exactly zero, handing the tipping ODE a
     *           clean psi0 and omega0 = 0. The sway is what walks the CM to the
     *           balance point so the topple has somewhere to creep from.
     *   TOPPLE  the pivot ODE on the whole stack. Courses shear off top-first
     *           at their own psi thresholds — the cascade is produced by the
     *           ODE rather than scheduled beside it. THIS is where the creep
     *           signature lives and nothing below touches it.
     *   FLIGHT  ballistic CM, angular velocity all but constant. Release carries
     *           v = omega x r; losing that is a visible stall.
     *   GROUND  land, then SLIDE. Most of the angular velocity dies on the
     *           first contact (Housner again: for a girder slapping down on its
     *           long face alpha is ~72 deg and kappa is NEGATIVE — heavy steel
     *           landing flat does not rock, it stops dead), what survives is
     *           converted into a horizontal slide, and the piece then translates
     *           under Coulomb friction while it flattens onto its bed. Sliding
     *           is the post-landing motion; the rotation left in it is small and
     *           OVER-DAMPED, so it is monotone rather than oscillatory.
     *
     * THE HARD RULE: NOTHING RISES AFTER IT LEAVES THE STACK. Every resolution
     * below moves a piece DOWN or SIDEWAYS. Eight plates arrive within a fifth
     * of a second of each other, so the surface under one of them does climb —
     * a neighbour comes to rest half beneath it — and when it does the piece is
     * NOT lifted out; it is left where it is, and a slide that would have to
     * climb a step is BLOCKED instead. A per-step ratchet on y backs that up as
     * an invariant rather than a convention.
     *
     * The previous pass resolved the same penetration by letting the piece
     * climb out at a bounded rate, which traded a 32.6 px teleport for a 20 px
     * float and, because the climb carried the pivot with it, kept re-winding
     * the settling ODE: one bug, two symptoms — the drift upward AND the pieces
     * that travelled a full turn to net 22 degrees. Measured on this file, the
     * longest continuous upward run of a piece after it lands is 0.000 px and
     * after it leaves the stack 0.000 px — measured on THIS geometry, over four
     * eras, bounded by each piece's own release and sleep instants off
     * __DIAG.rel/.slp rather than by a guessed window. (Measured from before
     * the sway instead it reads 3.5 px, which is the whole tower leaning on its
     * pivot while still glued together, and is not this rule's business.)
     *
     * G is scaled with the layout unit so the collapse takes the same WALL TIME
     * on every canvas size. At u = 5.6 px (a ~1000 px wide 16:9 canvas) this is
     * 2000 px/s^2, the constant the research recommends. */

    const DT     = 1 / 60;             // FIXED. Never deltaTime.
    const GK     = 355;                // gravity = GK * u  (2000 px/s^2 at u = 5.63)
    const SWF    = 1.35;               // sway frequency, Hz
    const SWH    = 1 / (2 * SWF);      // sway half-period, 0.370 s
    const SWAY_T = 2.5 * SWH;          // 3 half-swings, ending at the third apex
    const SWG    = 2.0;                // amplitude growth per half-swing
    const PSI0   = 0.075;              // handoff: CM this far past the balance point
    /* THE STRIKE THAT TIPS `bar`, AS TWO TERMS THAT ARE BOTH LOAD-BEARING.
     *
     * The seed is `esc + HITK * v / sr`, and the first term is DERIVED rather
     * than chosen: esc = sqrt(2k(1 - cos psiS)) is the energy integral of bar's
     * own topple ODE, so it is EXACTLY the angular rate that carries bar to its
     * balance point with nothing left over. On its own it stalls there. It is
     * the strike's own term that takes it past - which means the strike is
     * NECESSARY for bar to fall, not merely a cue for when, and the causality
     * is a property of the arithmetic rather than of the choreography.
     *
     * The first draft wrote max() of the two, and that was wrong in the way
     * this file keeps a list of: measured over four eras the strike term was
     * 1.07-1.15 against a floor of 1.69, so the strike NEVER bound and the
     * branch that was supposed to carry the causality could not fire. Both
     * numbers are published (__DIAG.esc, __DIAG.hv, __DIAG.srB) so that
     * "which term did the work" stays a subtraction a check performs.
     *
     * HITK is the fraction of the striker's contact-point speed that becomes
     * bar's rotation. It is sub-critical, so a chain can never amplify. */
    const HITK   = 0.35;               // of the striker's contact speed, converted
    /* WHY omega0 IS ZERO HERE, when the research text asks for 0.15-0.4 rad/s.
     * The sway hands over at its third APEX, so the authored angular rate is
     * exactly 0 and the angle is exactly A3 -- both matched by construction,
     * which is the requirement the 0.15-0.4 figure exists to serve. Handing
     * over at psi = 0 instead, carrying omega0, was tried and rejected on
     * energy: for the pivot ODE psi'' = C sin(psi), the state (psi = PSI0,
     * omega = 0) is a TURNING POINT, so om^2 = 2C(cos PSI0 - cos psi) is
     * negative at psi = 0 -- no psi = 0 crossing can reach it. Any handoff at
     * the balance point with omega0 > 0 therefore ADDS energy to the fall, and
     * the creep table is where that shows: this handoff measures well outside
     * the research's own 3.6/15.7/42.7 (below), and the extra energy
     * pushes it further out. Creep is the single most discriminating check in
     * the spec, so it wins over the letter of one sentence. Measured on the
     * 8-high PLATE stack, era 1, per course: 25% of the tip time buys 6.9-13.3%
     * of the turn, 50% buys 19.6-28.2% and 75% buys 46.8-55.3% - against
     * 25/50/75 for a constant rate. It moved out from the 7-beam stack's
     * 4-6/17-21/44-51 because the tower is 1.8x taller and each course is
     * released at the same lean from a longer arm, which is the ONLY reason it
     * moved: the handoff is unchanged. Do not "fix" this.
     */
    // Where each course shears off the leaning stack, as psi. A stack of loose
    // girders is not glued: the top course slides off at ~26 deg of lean and
    // the bottom at ~44. Holding them together to 70+ deg is what pitched
    // pieces a quarter-turn past flat, so they landed on their narrow ENDS and
    // rocked there (Housner kappa = 0.85 for a 3:1 block on end — real, and
    // exactly what you do not want a steel girder doing).
    const PSI_TOP = 0.223;             // top course, ~26 deg of stack lean
    const PSI_BOT = 0.520;             // bottom course, ~44 deg. Lowered from
                                       // 0.593 when the stack went from 5 to 7
                                       // courses, and held there through the 8
                                       // letter plates: the lean at which the
                                       // LAST course lets go is what sets how
                                       // far the whole roster turns, and a
                                       // taller tower carries more of it into
                                       // the landing. THCAP is what bounds the
                                       // result, so the plate tower needed no
                                       // second cut.
    /* THE LANDING, AND THE SLIDE. A course shearing off a leaning stack does
     * not carry the stack's whole rotation with it — it slides off — so SHED
     * is what it keeps. The CM velocity is NOT shed: drop that and the piece
     * stalls for a frame before it drops, which is visible.
     *
     * On contact OMKILL is what survives of the spin, and SLIDEK is how much
     * of the contact point's own speed becomes a slide of the whole piece.
     * MUK is the friction that then stops it.
     *
     * SETK/SETD are the spring and damping that lay the piece down onto the
     * slope beneath it, and the relation between them is the whole of
     * "rotation after landing is small and never oscillatory" - it is a
     * property of two numbers, not of tuning. SETD gives a damping rate
     * c = (1 - SETD)/DT = 27.0 /s; the motion is non-oscillatory exactly while
     * SETK <= c*c/4 = 182, and 178 sits just inside that, which is also the
     * FASTEST a monotone approach can be. OMCAP then rate-limits the first
     * part of it, so a piece that lands at 50 degrees lies down in about
     * 0.4 s without ever turning faster than 183 deg/s and without ever
     * turning back. */
    const SHED   = 0.55;               // of the stack's omega, kept at release
    const SPINC  = 1.05;               // rad a piece may turn in the AIR, measured
                                       // from the angle it left the stack at. A
                                       // topple is not a spin.
    /* THE ABSOLUTE BOUND ON |theta|, and it is the one that matters. SPINC is
     * relative to the release angle, so on its own it bounds the total turn at
     * PSI_BOT + SPINC = 1.570 rad — pi/2 to three decimals, i.e. exactly on the
     * edge where round(theta / pi) in sleepPiece flips from 0 to +-1 and the
     * recorded angle takes a 180-degree STEP. That step is where the measured
     * 10,768 deg/s spike came from. Bounding theta inside the band outright
     * makes the normalisation a PROVABLE no-op rather than one that happens to
     * hold on today's numbers: seven degrees of slack against a bound the
     * settle, which chases an angle inside +-0.40 rad, never approaches. */
    const THCAP  = Math.PI / 2 - 0.12; // hard bound on |theta| for a loose piece
    const OMKILL = 0.10;               // of omega, surviving the first contact
    const SLIDEK = 0.42;               // of the contact point's speed -> slide
    const MUK    = 0.62;               // sliding friction, as a fraction of g
    const SETK   = 178;                // spring laying a landed piece onto its bed
    const SETD   = 0.55;               // per-step damping on it. Over-damped: see above
    /* rad/s, hard ceiling on ANY angular rate in the scene - and "any" now
     * genuinely means any. It used to bound only a LOOSE piece, which was
     * sufficient while one slow eight-high stack was the only other thing
     * turning: measured, the fastest rotation in the whole base scene was a
     * loose piece sitting exactly on this cap. A struck three-course tower is
     * not slow - `bar` is handed an angular rate at the impact and then keeps
     * accelerating - and it pushed the scene's peak to 187.6 deg/s, past the
     * 185 the rotation budget allows, through the ONE rotating thing the cap
     * did not cover. So the cap covers the stacks too, and the invariant is
     * now one sentence over everything that turns rather than a rule with a
     * body-shaped hole in it. */
    const OMCAP  = 3.2;                // rad/s, hard ceiling on any angular rate
    const STEPUP = 0.25;               // of a girder's DEPTH: an obstruction taller
                                       // than this BLOCKS a slide. A piece never
                                       // climbs one.
    /* HOW FAR INTO THE HEAP A LANDED PIECE BEDS. The pile's own seating takes
     * the MEAN surface under a footprint, so a girder lying half over another
     * settles between the two - which is right for a heap laid down piece by
     * piece, and wrong for eight plates arriving at once, because every one of
     * them sinks toward the average and the pile comes out flatter than the
     * steel in it. A plate is rigid; it bridges. SUPB is how far from the mean
     * toward the MAX a landed piece rests. The number was fixed on the 12.0 px
     * beam section, where the heap's tallest point measured 20.7 px at
     * SUPB = 0 against 23.3 px at 0.60; on the 23.2 px plate section the same
     * 0.60 puts the highest centre 49 px above the ground, which is a heap two
     * plates deep, exactly as before. */
    const SUPB   = 0.60;               // mean -> max blend for a landed piece
    const BLEND  = 0.28;               // s to reconcile a slept piece with its seat
    const FSTEPS = Math.round(FALLW / DT);
    const BSTEPS = Math.round(BLEND / DT);

    /* The authored sway. Amplitude is held CONSTANT within each half-swing and
     * stepped between them, which is what makes the third apex a true apex:
     * a continuously growing envelope has a nonzero derivative there and would
     * hand the ODE an omega0 several times too large, which destroys the creep.
     * Amplitude is continuous at the steps because sin() is zero there. */
    function swayLean(A3, t) {
      if (t <= 0) return 0;
      if (t >= SWAY_T) return A3;
      const k = Math.min(2, Math.floor(t / SWH));
      return A3 * Math.pow(SWG, k - 2) * Math.sin((Math.PI / SWH) * t);
    }

    // Pose of course n while it is still part of the stack, at lean angle
    // `lean`. The stack pivots on the base corner it is leaning OVER, so the
    // far corner lifts — which is what a real stack does and what makes the
    // teeter read. At lean = 0 the two pivots agree exactly, so it is smooth.
    function stackPivotX(tw, lean) { return towerX(tw) + (lean < 0 ? -0.42 : 0.42) * L.bw; }
    function stackPose(pl, n, lean, out) {
      const pxe = stackPivotX(towerOf(n), lean);
      const dx = pl.slotX[n] - pxe, dy = slotY(n) - L.ground;
      const co = Math.cos(lean), si = Math.sin(lean);
      out.x = pxe + dx * co - dy * si;
      out.y = L.ground + dx * si + dy * co;
      out.a = pl.slotA[n] + lean;
    }

    // Lowest corner of a w x h box centred at (x, y) rotated by th.
    const _cn = { x: 0, y: 0 };
    function lowCorner(x, y, th, w, h) {
      const co = Math.cos(th), si = Math.sin(th);
      let bx = x, by = -Infinity;
      for (let sx = -1; sx <= 1; sx += 2) {
        for (let sy = -1; sy <= 1; sy += 2) {
          const cx = sx * w * 0.5, cy = sy * h * 0.5;
          const wy = y + cx * si + cy * co;
          if (wy > by) { by = wy; bx = x + cx * co - cy * si; }
        }
      }
      _cn.x = bx; _cn.y = by;
      return _cn;
    }

    /* THE ANGLE A LANDED PIECE IS LYING DOWN ONTO: the slope of the surface
     * under it, damped to 0.62 and clamped to the same band seatAll uses,
     * plus the same hashed lie. It is deliberately the SAME rule as the pile's
     * own seating - so the pose the physics settles into and the pose the pile
     * seats it at agree to begin with, and the reconciliation at the end of the
     * fall has almost nothing left to walk out.
     *
     * Screen y grows downward, so a surface HIGHER on the right (hR > hL) lies
     * the piece anticlockwise, i.e. at a NEGATIVE p5 angle. */
    function bedAngle(era, id, f, x) {
      const probe = 0.5 * L.bw;
      const hL = meanField(f, x - probe, x);
      const hR = meanField(f, x, x + probe);
      let a = -Math.atan2(hR - hL, probe) * 0.62 + (rnd(era, id, 3) - 0.5) * 0.30;
      if (a > 0.40) a = 0.40;
      if (a < -0.40) a = -0.40;
      return a;
    }

    /* Run the whole collapse and return, per girder, a table of poses sampled
     * at the fixed step, plus the landed x/angle each piece finished at.
     *
     * The table is what makes the scene stay a pure function of time: draw()
     * looks a pose up and interpolates, and integrates nothing. FSTEPS is a
     * constant, so the storage is fixed (3 doubles x FSTEPS steps x N pieces,
     * 207 x 8 today) and cannot grow with run time. */
    function simFall(era, pl) {
      const g   = GK * u;
      const bw  = L.bw, bh = L.bh;

      /* EACH TOWER AS ONE BODY PIVOTING ON ITS DOWNWIND BASE CORNER, solved
       * from the ACTUAL planned course positions rather than a nominal centre.
       * There are two of them now, and everything the single stack carried -
       * centre of mass, pivot radius, the balance angles either way, the
       * inertia correction, the authored sway amplitude - is per tower, so a
       * five-course stack and a three-course stack topple at their own rates
       * instead of sharing one. That difference is the whole reason the domino
       * has time to read: k = g/(sr*sk) is 1.6x larger for `bryan` than the old
       * eight-high stack, and larger again for `bar`, so each goes over faster
       * than the stack they replaced and the chain fits the beat it had. */
      const TWR = [];
      for (let tw = 0; tw < 2; tw++) {
        const h = towerH(tw);
        let cx = 0, cy = 0, m = 0;
        for (let n = 0; n < N; n++) {
          if (towerOf(n) !== tw) continue;
          cx += pl.slotX[n]; cy += slotY(n); m++;
        }
        cx /= m; cy /= m;
        const px = stackPivotX(tw, 1), py = L.ground;
        const sr = Math.hypot(cx - px, py - cy);
        // negative: the CM is inboard of the pivot, so the tower is stable
        const psiS = Math.atan2(cx - px, py - cy);
        // The same angle about the UPWIND base corner: how far this tower may
        // lean the WRONG way before it goes over backwards, onto the vehicle.
        const psiU = Math.atan2(cx - stackPivotX(tw, -1), py - cy);
        const Hs = bh + (h - 1) * (bh + L.gap);
        const sk = 1 + ((bw * bw + Hs * Hs) / 12) / (sr * sr);
        /* The sway's last apex is the tipping point plus exactly PSI0, so the
         * handoff angle is AUTHORED and does not inherit the slot jitter.
         * Topple duration is logarithmic in psi0, so letting a hash drive it
         * gives eras that hang for a second and eras that snap over, with no
         * visible cause. The away-swing, A3/SWG, stays well inside the UPWIND
         * balance angle: that is the one failure a sway can produce that the
         * collapse cannot recover from, and a geometry change that made it
         * possible would otherwise reach the screen silently. */
        TWR.push({ h: h, px: px, py: py, sr: sr, psiS: psiS, psiU: psiU, sk: sk,
                   k: g / (sr * sk), psi: psiS, som: 0, lean: 0,
                   live: false, hit: -1, seed: 0,
                   A3: Math.min(0.62, Math.abs(psiS) + PSI0,
                                0.80 * SWG * Math.abs(psiU)) });
      }
      /* `bryan` is the tower the pipes hit, so it is the one that sways, and
       * its topple starts from the authored handoff. `bar` starts at ITS OWN
       * balance angle - lean exactly zero, standing square - and stays there
       * until something arrives. */
      TWR[0].psi = PSI0;
      pl.A3 = TWR[0].A3;
      pl.A3b = TWR[1].A3;

      /* THE FIELD IS REBUILT FROM THE PIECES, EVERY STEP, rather than stamped
       * once and for all when a piece falls asleep. That is the structural half
       * of the no-lift rule.
       *
       * Stamping only at sleep meant the ground under a piece that was still
       * settling could climb 15-30 px between one step and the next, through no
       * motion of its own — and the old code's answer to that was to let the
       * piece CLIMB OUT at a bounded rate, which is the float. Rebuilt every
       * step, the surface a piece rests on is always where its neighbours
       * actually are, so a girder that lands beside one already down beds onto
       * it as it arrives instead of being lifted onto it afterwards. The pile
       * is therefore built BY the simulation, which is also what makes the
       * canonical seat below a small downward correction rather than a lift.
       *
       * A PIECE MAY ONLY REST ON ONE THAT IS BELOW IT. The field a given piece
       * reads holds the ground plus every OTHER piece that is down AND lower
       * than it - ordered by (y, then id), which is a strict total order, so
       * the "rests on" relation is acyclic and two girders can never hold each
       * other up.
       *
       * WITHOUT THE RULE THE HEAP IS TALLER, AND WRONGLY SO, which is why the
       * measurement is quoted here rather than left to look like a win: a
       * piece whose footprint overlaps one ABOVE it reads that one's crown as
       * its own support, finds its target already over its head, and — since
       * nothing may rise — simply stops descending. It is wedged by something
       * above it. Measured over four eras the tallest point of the heap goes
       * from 23.3 px with the rule to 26.1 px without it, and the 26.1 is
       * manufactured height of exactly the kind the float used to make.
       *
       * 72 columns x 7 pieces, once per fixed step, off the render loop and
       * inside planEra: 0.3 M writes for a whole era. */
      const fs = new Array(FCOLS);
      function fieldFor(dst, bdy, self) {
        for (let k = 0; k < FCOLS; k++) dst[k] = 0;
        for (let q = 0; q < N; q++) {
          const o = bdy[q];
          if (!o || o.st < 2 || o === self) continue;
          if (!(o.y > self.y || (o.y === self.y && o.id < self.id))) continue;
          const ohh = halfH(o.th, bh), ohx = halfX(o.th, bh);
          stampField(dst, o.x - ohx * 0.94, o.x + ohx * 0.94,
                     (L.ground - o.y) + Math.min(ohh, 0.52 * bh));
        }
      }

      const tr = new Array(N);
      const bd = new Array(N);
      for (let n = 0; n < N; n++) {
        const id = pl.order[n];
        tr[id] = new Float64Array(3 * FSTEPS);
        bd[id] = { id: id, n: n, st: 0, x: 0, y: 0, th: 0, vx: 0, vy: 0, om: 0,
                   tha: 0, ylo: -Infinity, rel: -1, slp: -1, forced: 0,
                   lx: 0, ly: 0, lth: 0, still: 0,
                   wall: 0, oob: 0, drop: 0, dmax: 0, lnd: -1,
                   mx: -Infinity, me: -Infinity };
        // Top course sheds first: its threshold is the lowest. Measured in
        // its OWN tower's courses, so a three-high stack sheds top-down the
        // same way a five-high one does.
        const hh = towerH(towerOf(n));
        bd[id].thr = lp(PSI_BOT, PSI_TOP, hh > 1 ? courseOf(n) / (hh - 1) : 1)
                   + (rnd(era, n, 50) - 0.5) * 0.07;
      }

      const lastSleep = FSTEPS - 1 - BSTEPS;     // force sleep in time for the blend
      const pose = { x: 0, y: 0, a: 0 };
      let swx = -Infinity;              // how far right the TEETER alone reached
      // One tower, one step of its topple. Both stacks integrate the SAME ODE
      // through the same three lines, so `bar` cannot drift into a different
      // fall from `bryan` - only into a faster one, from its own geometry.
      function topple(S) {
        S.som += S.k * Math.sin(S.psi) * DT;
        if (S.som > OMCAP) S.som = OMCAP;
        S.psi += S.som * DT;
        S.lean = S.psi - S.psiS;
      }

      for (let s = 0; s < FSTEPS; s++) {
        const t = s * DT;

        /* --- the two stacks --------------------------------------------- */
        /* `bryan` teeters and goes over: the pipes have already hit it. `bar`
         * is inert until struck, and the strike is looked for at the FOOT of
         * this loop, out of the poses the step actually produced. */
        const SA = TWR[0], SB = TWR[1];
        SA.live = t >= SWAY_T;
        if (!SA.live) {
          SA.lean = swayLean(SA.A3, t);
        } else {
          topple(SA);
        }
        if (SB.live) topple(SB);

        for (let n = 0; n < N; n++) {
          const id = pl.order[n];
          const b = bd[id];
          const S = TWR[towerOf(n)];
          // The surface under THIS piece: the ground, plus everything that is
          // down and lower than it. Nothing stands on its own crown, and
          // nothing stands on something above it.
          if (b.st !== 0) fieldFor(fs, bd, b);

          if (b.st === 0) {
            stackPose(pl, n, S.lean, pose);
            b.x = pose.x; b.y = pose.y; b.th = pose.a;
            if (S.live && S.psi >= b.thr) {
              // RELEASE. A body rotating about a pivot already has a CM
              // velocity; carry it, or the piece stalls for a frame and then
              // drops straight down.
              const dxr = b.x - stackPivotX(towerOf(n), S.lean), dyr = b.y - S.py;
              b.vx = S.som * (-dyr);
              /* ...but NOT upward. Every course sits inboard of the pivot, so
               * omega x r has a small upward component for all of them, and a
               * girder arcing up off a collapsing tower is exactly what the
               * scene is not allowed to show. It is a third of a pixel of
               * flight; the ratchet would swallow it anyway. This is what
               * "constrain the USE of the hashed value, not the determinism"
               * looks like at the one place where the physics itself points
               * the wrong way. */
              b.vy = Math.max(0, S.som * (dxr));
              /* A COURSE SLIDING OFF A LEANING STACK DOES NOT CARRY THE
               * STACK'S WHOLE ROTATION WITH IT. Keeping all of it is what
               * pitched pieces a quarter turn past flat, so they landed on
               * their narrow ENDS - and the whole rocking cascade the settle
               * used to run is downstream of that one line. */
              b.om = SHED * S.som;
              b.tha = b.th;
              b.ylo = b.y;
              b.st = 1;
              b.rel = s;
            }
          } else if (b.st === 1) {
            /* --- FLIGHT. Angular velocity is all but constant: gravity exerts
             * no torque about the centre of mass. SPINC is a guard, not a
             * force - it is what keeps the whole fall inside a half turn. */
            b.vy += g * DT;
            b.x  += b.vx * DT;
            b.y  += b.vy * DT;
            b.th += b.om * DT;
            if (Math.abs(b.th - b.tha) >= SPINC) b.om = 0; else b.om *= 0.995;
            b.x = edgeX(b, b.x, L.heapL - 0.4 * bw, L.heapR + 0.4 * bw);
            const cn = lowCorner(b.x, b.y, b.th, bw, bh);
            const gy = L.ground - fieldAt(fs, cn.x);
            if (cn.y >= gy) {
              /* CONTACT. Backing the piece out to the surface is the ONLY
               * upward correction in the whole fall, and it is bounded by the
               * distance this very step carried the corner down - it is that
               * step, partly un-done, not a lift. The ratchet at the foot of
               * the loop holds it to that.
               *
               * THE IMPACT ITSELF. Housner: the energy a body retains through
               * a corner impact is kappa = 1 - 1.5 sin^2(alpha), and for a
               * girder slapping onto its long face alpha is ~72 deg, so kappa
               * is NEGATIVE. Heavy steel landing flat does not rock. So the
               * spin very nearly dies here; what carries on is the contact
               * point's own horizontal speed, become a SLIDE. That is the
               * motion the scene wants after a landing - pieces sliding over
               * one another - and it is why there is no second pivot ODE
               * below. Re-pivoting on the landing corner and integrating on
               * is what made pieces climb their own corner and rock forever. */
              b.y -= (cn.y - gy);
              // The instant flight ENDS. Published beside rel and slp so the
              // airborne window is a pair of numbers an outside check can
              // bracket exactly - which is what makes vdrop re-derivable by
              // someone who does not trust this file's own counter. Without it
              // the only window on offer is rel..slp, and that includes the
              // settle, whose motion is legitimately near-vertical.
              if (b.lnd < 0) b.lnd = s;
              const vcx = b.vx - b.om * (cn.y - b.y);
              b.vx = SLIDEK * vcx;
              b.vy = 0;
              b.om *= OMKILL;
              b.st = 2;
            }
          } else if (b.st === 2) {
            /* --- GROUNDED: SLIDE, FLATTEN, BED DOWN. Three motions, and every
             * one of them is DOWN or SIDEWAYS. There is no branch here that
             * can raise a piece. */

            // SLIDE. Coulomb friction: a constant deceleration that takes the
            // speed to exactly zero rather than asymptotically toward it, so a
            // piece genuinely stops instead of creeping for ever.
            const dec = MUK * g * DT;
            if (b.vx > dec) b.vx -= dec;
            else if (b.vx < -dec) b.vx += dec;
            else b.vx = 0;
            if (b.vx !== 0) {
              let nx = edgeX(b, b.x + b.vx * DT, L.heapL, L.heapR);
              /* BLOCKED, NEVER CLIMBING. If the ground a girder is sliding
               * toward stands higher than its own underside by more than
               * STEPUP of a depth, it has run into something: it stops. It
               * does NOT ride up over it, because riding up is a rise, and the
               * one thing this fall may not do is rise. */
              const hxs = halfX(b.th, bh);
              const dir = b.vx > 0 ? 1 : -1;
              const ah  = fieldAt(fs, nx + dir * (hxs + 0.12 * bw));
              if (L.ground - ah < b.y + halfH(b.th, bh) - STEPUP * bh) b.vx = 0;
              else b.x = nx;
            }

            /* FLATTEN. A spring toward the angle the bed under it wants, with
             * per-step damping chosen so the system is OVER-DAMPED (see SETK /
             * SETD): it lies down without ever swinging back. This is what
             * replaces the settling pivot ODE, and it is why the rotation
             * after a landing is monotone. */
            const ab = bedAngle(era, b.id, fs, b.x);
            b.om += SETK * (ab - b.th) * DT;
            b.om *= SETD;
            if (b.om > OMCAP) b.om = OMCAP;
            if (b.om < -OMCAP) b.om = -OMCAP;
            b.th += b.om * DT;

            /* BED DOWN. The piece falls onto the surface under its own
             * footprint - MEAN support, so a girder lying half over another
             * drops until it is bearing on both - and stops there. If the
             * surface has climbed ABOVE it since the last step (which it does:
             * the field is stamped in whole columns the instant a neighbour
             * falls asleep) the piece is simply left where it is. It is not
             * lifted out. */
            const hh2 = halfH(b.th, bh), hx2 = halfX(b.th, bh);
            const sm  = meanField(fs, b.x - hx2, b.x + hx2);
            const sup = sm + SUPB * (maxField(fs, b.x - 0.8 * hx2, b.x + 0.8 * hx2) - sm);
            const yT  = L.ground - (sup + hh2 - (0.14 + 0.10 * rnd(era, b.id, 2)) * bh);
            if (yT > b.y) {
              b.vy += g * DT;
              b.y  += b.vy * DT;
              if (b.y > yT) { b.y = yT; b.vy = 0; }
            } else {
              b.vy = 0;
            }

            /* ASLEEP, ON EITHER OF TWO SUFFICIENT TESTS - and it takes two
             * because each one alone can be held open by something that is not
             * a fact about this piece at all.
             *
             * QUIET is the drivers being spent: not sliding, down on its bed,
             * and within a twentieth of a radian of the angle its bed wants,
             * turning slower than 0.15 rad/s (8.6 deg/s, a quarter of a degree
             * in a frame at 30 fps). The thresholds are deliberately generous:
             * a tighter test kept pieces awake long enough for a NEIGHBOUR to
             * come to rest beside them and move the bed under them, and the
             * chase that started was worth another 0.4 s each time.
             *
             * STILL is the piece having STOPPED MOVING, which is what sleep
             * actually means and is NOT the same claim as "it reached its
             * target". The bed angle a piece is chasing is a function of where
             * the piece and its neighbours are, so a piece can converge on a
             * target that keeps moving without ever arriving - and then QUIET
             * never fires and the piece is snapped flat by the deadline
             * instead. Measured: with QUIET alone, one era in 32 force-slept a
             * piece, and a change of two parts in a thousand in the section
             * depth was enough to move WHICH era. That is a coin toss, not a
             * property. Rotation is weighed by bw so that a hair of spin counts
             * for as much as the pixel it moves the piece's end through.
             *
             * Between them the deadline below is a guard that never fires: see
             * pl.forced, which is a COUNT a check reads, not a claim made here. */
            const mv = Math.abs(b.x - b.lx) + Math.abs(b.y - b.ly)
                     + Math.abs(b.th - b.lth) * bw;
            b.still = mv < 0.012 * bh ? b.still + 1 : 0;
            const quiet = b.vx === 0 && Math.abs(b.om) < 0.15 &&
                          Math.abs(ab - b.th) < 0.05 && b.y >= yT - 0.05;
            if ((quiet || b.still >= 5) && s > b.rel + 4) {
              sleepPiece(era, b, fs, s);
            }
          }

          /* THE TWO RATCHETS, and they are the invariants the whole section is
           * written around. Both are stated ONCE, here, over every state a
           * loose piece can be in, so no branch above can be the one that
           * forgot: this is where they are discharged and there is nowhere
           * else to look.
           *
           * IN Y: once a piece has left the stack its centre may never move UP
           * again, whatever any branch above computed. Nothing above should
           * ever violate it - the contact correction is bounded by its own
           * step and every other resolution is downward - so this is a proof
           * obligation discharged in code rather than a fix.
           *
           * IN THETA: |theta| stays inside THCAP < pi/2, which is what makes
           * the half-turn normalisation at sleep a no-op by construction
           * rather than by measurement. omega is zeroed at the clamp rather
           * than reversed, so theta is CONTINUOUS across it: the bound stops
           * the rotation, it does not bounce it. */
          if (b.st !== 0) {
            if (b.y < b.ylo) b.y = b.ylo; else b.ylo = b.y;
            if (b.th > THCAP) { b.th = THCAP; if (b.om > 0) b.om = 0; }
            else if (b.th < -THCAP) { b.th = -THCAP; if (b.om < 0) b.om = 0; }
          }

          /* THE DEADLINE, and it must stay a guard: a piece force-slept here
           * has not finished settling, so its pose is snapped rather than
           * arrived at. `forced` is carried out to __DIAG so that "no piece was
           * ever force-slept" is a number a check reads rather than a sentence
           * this comment writes. */
          if (b.st !== 3 && s >= lastSleep) { b.forced = 1; sleepPiece(era, b, fs, s); }

          /* THE RIGHTMOST REACH, RECORDED WHERE THE TRACE IS WRITTEN so it is
           * the drawn pose that is measured and not a parallel arithmetic: mx
           * is the furthest the CENTRE got, me the furthest the plate's own
           * right-hand extent got. Both are published; the distance from the
           * view edge is then a subtraction a check does for itself. */
          if (b.x > b.mx) b.mx = b.x;
          const _me = b.x + halfX(b.th, bh);
          if (_me > b.me) b.me = _me;
          /* ...and the straight-down run, measured on the SAME poses, one step
           * before lx/ly are overwritten. Only a piece that is genuinely in the
           * air counts: a landing step, a slide and a sleep are all excluded,
           * because a piece sliding to a stop on the ground is Coulomb friction
           * doing its job and has nothing to do with a wall. See DROPR. */
          if (b.st === 1) {
            const ddy = b.y - b.ly;
            if (ddy > DROPF * bw && Math.abs(b.x - b.lx) < DROPR * ddy) {
              if (++b.drop > b.dmax) b.dmax = b.drop;
            } else b.drop = 0;
          } else b.drop = 0;
          b.lx = b.x; b.ly = b.y; b.lth = b.th;
          tr[id][3 * s]     = b.x;
          tr[id][3 * s + 1] = b.y;
          tr[id][3 * s + 2] = b.th;
        }

        /* --- THE DOMINO, AND IT IS A MEASUREMENT RATHER THAN A CUE ---------
         *
         * Nothing schedules `bar`. This asks, out of the poses THIS STEP just
         * produced, whether any part of `bryan` - a course still riding the
         * leaning stack, or one already shed and flying - has reached bar's own
         * left face at a height where bar actually is. Until that is true bar
         * stands square, lean exactly zero. So the chain dozer -> pipes ->
         * bryan -> bar is causal in the same sense the pipe strike is: the
         * contact instant is a number the simulation FINDS, published as
         * pl.tHit, and a check that wants to know whether bar fell before it
         * was reached compares two published times rather than trusting a beat.
         *
         * THE HEIGHT TEST IS WHAT MAKES IT HONEST. A plate that sails clean
         * over bar's top course has not hit it, and must not tip it - so a
         * striker whose LOWEST point is still above bar's crown is ignored.
         *
         * A striker still attached to `bryan` has no vx of its own: it is
         * riding a rotation, and its speed is omega times its radius from that
         * tower's pivot. A shed one carries its own. Both are the speed of the
         * part that actually arrives, which is what the impulse is drawn from.
         *
         * SEPARATION IS SET BY THIS TEST, not by taste. TSEP is far enough that
         * bryan's THIRD SWAY APEX still misses bar - measured, see __DIAG.swx -
         * so the teeter cannot tip the second tower and the strike can only
         * come from a tower that has committed. */
        if (!SB.live) {
          const faceB = towerX(1) - 0.5 * bw;
          const topB  = L.ground - (bh + (SB.h - 1) * (bh + L.gap));
          let hv = -1;
          for (let q = 0; q < N; q++) {
            const o = bd[q];
            if (towerOf(o.n) !== 0 || o.st === 3) continue;
            const ohx = halfX(o.th, bh), ohh = halfH(o.th, bh);
            if (o.x + ohx < faceB) continue;      // has not reached bar's face
            if (o.y + ohh < topB) continue;       // sailed clean over the top
            const v = o.st === 0
              ? Math.abs(SA.som) * Math.hypot(o.x - SA.px, o.y - SA.py)
              : Math.abs(o.vx) + Math.abs(o.om) * ohh;
            if (v > hv) hv = v;
          }
          if (hv >= 0) {
            const esc = Math.sqrt(2 * SB.k * (1 - Math.cos(SB.psiS)));
            SB.esc  = esc;
            SB.hv   = hv;
            SB.som  = esc + HITK * hv / SB.sr;
            SB.seed = SB.som;
            SB.live = true;
            SB.hit  = s;
          }
        }
        /* THE SWAY'S OWN REACH, recorded while it happens: the furthest right
         * any part of `bryan` got before its topple began. It is published so
         * that "the teeter does not touch bar" is a comparison against bar's
         * face rather than an assertion. */
        if (!SA.live) {
          for (let q = 0; q < N; q++) {
            const o = bd[q];
            if (towerOf(o.n) !== 0) continue;
            const e = o.x + halfX(o.th, bh);
            if (e > swx) swx = e;
          }
        }
      }

      return { tr: tr, bd: bd, TWR: TWR, swx: swx };
    }

    /* Asleep. The rest angle is clamped to the same band the pile seating uses
     * and the piece is bedded onto the field, where it stamps its crown so
     * whatever lands next lands on it.
     *
     * TWO THINGS HERE ARE LOAD-BEARING AND BOTH WERE DEFECTS.
     *
     * 1. THE BRANCH. This used to be justified by symmetry - a lattice girder
     *    looks the same either way up, so a and a + k*pi drew identically and
     *    the representative angle was a free choice. THAT ARGUMENT IS GONE: a
     *    plate with a letter on it is symmetric under nothing, and a half turn
     *    is now a visible upside-down letter as well as a discontinuity. The
     *    fix is the same either way and is stated below as a bound rather than
     *    as a symmetry. Choosing k = 0 unconditionally, as this used to, moved
     *    the angle by pi at the instant a piece fell
     *    asleep: invisible on a lattice, and — measured — 10,768 deg/s at one
     *    fixed step to anything that reads the angle, which is a whole pi in
     *    1/60 s. That is how a spin survived review
     *    that only ever measured position. The branch is now chosen to MATCH
     *    the angle the piece is already in, so the clamp is a small correction
     *    inside that branch and the drawn angle is continuous. And the theta
     *    ratchet in simFall holds |theta| < THCAP < pi/2 for every loose
     *    piece, so `off` is identically 0 here: the line below is a guard
     *    whose inertness follows from a bound, not from a measurement that
     *    could quietly stop being true.
     *
     * 2. THE SEAT MAY ONLY LOWER. The bedded height is taken as the LOWER of
     *    where the piece already is and where the field says it should sit
     *    (larger y is lower). A piece whose neighbours have come to rest under
     *    it stays put; it is never floated up onto the new surface.
     *
     * `f` here is the field WITHOUT this piece in it (simFall's `fs`). Nothing
     * is stamped back: the field is rebuilt from the pieces every step, so a
     * sleeping piece is in it from the next step by being asleep. */
    function sleepPiece(era, b, f, s) {
      const off = Math.PI * Math.round(b.th / Math.PI);
      let a = b.th - off;
      if (a > 0.40) a = 0.40;
      if (a < -0.40) a = -0.40;
      // The pose the piece is actually IN as it stops. This is what the
      // reconciliation blends FROM, so bedding it down onto the field below is
      // a settle rather than a jump - and it is in the same branch as the rest
      // angle, so the blend is a few hundredths of a radian, not a half turn.
      b.qx = b.x; b.qy = b.y; b.qa = b.th;
      b.th = a + off;
      const cx = clampHeap(b.x);
      b.oob = Math.abs(cx - b.x);      // 0 unless the lie-bound moved this seat
      b.x = cx;
      const hh = halfH(a, L.bh), hx = halfX(a, L.bh);
      const sm  = meanField(f, b.x - hx, b.x + hx);
      const sup = sm + SUPB * (maxField(f, b.x - 0.8 * hx, b.x + 0.8 * hx) - sm);
      const ys  = L.ground - (sup + hh - (0.14 + 0.10 * rnd(era, b.id, 2)) * L.bh);
      if (ys > b.y) b.y = ys;                    // lower it, or leave it. Never lift.
      b.om = 0; b.vx = 0; b.vy = 0;
      b.st = 3;
      b.slp = s;
    }

    /* --------------------------------------------------------- the era plan
     *
     * One era, solved once: build order, stack jitter, the whole collapse, the
     * heap it leaves, where the pipes roll to, then the recovery queue and the
     * pile's shape after each pop. Cached by era AND canvas size (a resize
     * invalidates the geometry, not the choreography). Two slots: a frame near
     * an era boundary never needs more, and the cache cannot grow. */

    const planKey = ['', ''];
    const planVal = [null, null];
    let planNext = 0;

    function planEra(era) {
      const pl = {};

      /* BUILD ORDER: RIGHT TO LEFT ALONG THE YARD, and it is no longer hashed.
       * The crane takes the yard's RIGHTMOST plate first, so order[n] = N-1-n:
       * the last letter of the word goes down as the bottom course and the
       * FIRST letter is laid last, on top. Reading the finished tower downward
       * therefore gives the word, and reading the yard rightward gives it too -
       * one rule, two directions (see WORD).
       *
       * The variation this used to carry has not been dropped, it has moved:
       * the course jitter below, the per-course release thresholds, the whole
       * integrated collapse and the pipes' roll are all still hashed per era,
       * and the recovery order follows from where the pieces actually land. The
       * one thing that is now era-invariant is the thing the word requires to
       * be era-invariant, and nothing else. */
      const order = new Array(N);
      for (let n = 0; n < N; n++) order[n] = N - 1 - n;
      const level = new Array(N);                 // level[id] = course it is placed on
      for (let n = 0; n < N; n++) level[order[n]] = n;
      pl.order = order;
      pl.level = level;

      /* Courses are laid slightly off-centre, more so higher up. That is what
       * makes a tower look worth toppling instead of a perfect brick. The
       * "higher up" is measured in ITS OWN tower's courses, so three-high `bar`
       * is jittered across its own height rather than being handed the bottom
       * three-eighths of one long stack's ramp and coming out almost square. */
      const slotX = new Array(N), slotA = new Array(N);
      for (let n = 0; n < N; n++) {
        const tw = towerOf(n), h = towerH(tw);
        const f = h > 1 ? courseOf(n) / (h - 1) : 0;
        slotX[n] = towerX(tw) + (rnd(era, n, 21) - 0.5) * 0.20 * L.bw * f;
        slotA[n] = (rnd(era, n, 22) - 0.5) * 0.07 * f;
      }
      pl.slotX = slotX;
      pl.slotA = slotA;

      /* THE COLLAPSE. The topple direction is no longer hashed: the vehicle
       * comes in from the left, so the stack must go to the RIGHT, away from
       * it. A hashed direction would land the tower on the truck half the time,
       * which is a different (and much less sympathetic) joke. The variation
       * that direction used to carry now lives in the build order, the slot
       * jitter, the per-course release thresholds and the pipe roll. */
      /* THE TWO BASES, NAMED ONCE. nL is the placement index that fills the
       * LEFT tower's ground course, so botL is the plate the pipes actually
       * strike - and every reading that used to key off "the bottom course"
       * keys off THIS, not off order[0], which is now bar's base one and a half
       * tower-widths away. Getting that wrong would have left the pipe-contact
       * measurement quietly reading the wrong tower. */
      pl.nL   = RSPLIT;
      pl.botL = order[pl.nL];
      pl.botR = order[0];

      const sim = simFall(era, pl);
      pl.tr = sim.tr;
      /* THE CHAIN, AS FOUR INSTANTS a check can read, all in seconds after the
       * lead pipe hits `bryan`: bryan starts to lean at 0 by construction (the
       * strike is what starts the sway), bryan REACHES bar at tHit, and bar
       * starts to lean one step later. swx is how far right the teeter alone
       * got, against faceB - the proof that the sway cannot be what tipped it. */
      pl.tHit   = sim.TWR[1].hit < 0 ? -1 : sim.TWR[1].hit * DT;
      pl.tLeanB = sim.TWR[1].hit < 0 ? -1 : (sim.TWR[1].hit + 1) * DT;
      pl.seed   = sim.TWR[1].seed;
      pl.esc    = sim.TWR[1].esc || 0;
      pl.hv     = sim.TWR[1].hv || 0;
      pl.srB    = sim.TWR[1].sr;
      pl.swx    = sim.swx;
      pl.faceB  = L.stack2X - 0.5 * L.bw;
      // Release and sleep instants, in seconds after the impact. Constant for
      // the era and exposed through __DIAG so a headless check can bracket the
      // tipping phase exactly rather than guessing where it starts and ends.
      pl.simRel = new Float64Array(2 * N);
      pl.simLnd = new Float64Array(N);
      pl.forced = 0;
      /* THE DEBRIS BOUND, AS NUMBERS. wall counts the pieces the bound touched
       * at all during the whole collapse - the discriminating fact about the
       * hard edge, because a bound nothing reaches and a bound that is not
       * there look identical from every other angle. mx/me are how far right
       * each piece actually got. */
      pl.wall = 0;
      /* ...and the two counters that say the bound did not shape the REST of
       * the collapse either: oob/oobm are the seats the lie-bound moved and the
       * furthest it moved one (in plate widths); vdrop is the longest run of
       * airborne steps any piece spent travelling straight down. All three are
       * zero-or-near-zero facts about a build with no wall, and all three have
       * a failing case in the build this replaces. */
      pl.oob = 0; pl.oobm = 0; pl.vdrop = 0;
      pl.mx = new Float64Array(N);
      pl.me = new Float64Array(N);
      for (let id = 0; id < N; id++) {
        pl.simRel[2 * id]     = sim.bd[id].rel * DT;
        pl.simRel[2 * id + 1] = sim.bd[id].slp * DT;
        pl.simLnd[id] = sim.bd[id].lnd * DT;
        pl.forced += sim.bd[id].forced;
        pl.wall  += sim.bd[id].wall;
        if (sim.bd[id].oob > 1e-9) {
          pl.oob++;
          const d = sim.bd[id].oob / L.bw;
          if (d > pl.oobm) pl.oobm = d;
        }
        if (sim.bd[id].dmax > pl.vdrop) pl.vdrop = sim.bd[id].dmax;
        pl.mx[id] = sim.bd[id].mx;
        pl.me[id] = sim.bd[id].me;
      }

      // The simulation's landed poses become the pile's PASS 1: seatAll's fix
      // path re-solves height only, so the canonical rest pose the crane picks
      // up from is at exactly the x and angle the physics produced.
      const simSt = { pose: new Array(N), alive: new Array(N) };
      const items = [];
      for (let id = 0; id < N; id++) {
        const b = sim.bd[id];
        simSt.pose[id] = { x: b.x, y: b.y, a: b.th, cH: L.ground - b.y,
                           hh: halfH(b.th, L.bh), hx: halfX(b.th, L.bh) };
        simSt.alive[id] = true;
        // Insertion sort by the step each piece went to sleep: pieces are
        // seated in the order they actually came to rest.
        let k = items.length;
        items.push({ id: id, x: b.x, s: b.slp });
        while (k > 0 && items[k - 1].s > b.slp) {
          const t = items[k]; items[k] = items[k - 1]; items[k - 1] = t;
          k--;
        }
      }
      /* THE SIM'S OWN REST POSE IS ALSO THE CEILING. Passing simSt as `prev`
       * arms seatAll's monotone clamp against the physics itself, so the
       * canonical seat - and therefore the reconciliation blend below - can
       * only ever take a piece DOWN from where it came to rest. That is the
       * last of the upward paths closed: the blend used to walk a piece up to
       * a jammed seat over 0.28 s, which is a float you cannot see happening
       * and cannot miss in a plot. */
      const states = new Array(N + 1);
      states[0] = seatAll(era, items, simSt, { pose: simSt.pose, jam: loadJam(simSt) });

      /* RECONCILE. Once a piece is asleep it has stopped moving, so the few
       * pixels between where the simulation left it and where the pile seats it
       * can be walked out over BLEND seconds without anything visibly easing:
       * both endpoints are static poses. This is the canonical-rest-pose rule —
       * the crane's pickup addresses states[0], so states[0] has to be exact. */
      for (let id = 0; id < N; id++) {
        const tr = sim.tr[id], b = sim.bd[id], s0 = b.slp, rp = states[0].pose[id];
        const ax = b.qx, ay = b.qy, aa = b.qa;
        for (let s = s0; s < FSTEPS; s++) {
          const w = eio(Math.min(1, (s - s0) / BSTEPS));
          tr[3 * s]     = lp(ax, rp.x, w);
          tr[3 * s + 1] = lp(ay, rp.y, w);
          tr[3 * s + 2] = lp(aa, rp.a, w);
        }
      }

      // THE GIRDER RECOVERY QUEUE. Pop the topmost liftable piece, let the rest
      // settle, repeat. states[m] is the pile as it stands BEFORE the m-th
      // pick, so states[m].pose[queue[m]] is exactly where the hook takes it
      // from and states[m + 1] is what the survivors settle to.
      const queue = new Array(N);
      const qIdx = new Array(N);
      /* WAS ANYTHING LYING ON THE PIECE THE CRANE JUST TOOK? Counted, not
       * asserted: qOn[m] is how many pieces still in the pile were bearing on
       * pick m at the moment it was lifted, by the SAME relation the pile's own
       * load model uses (loadJam). pickTop takes the highest centre, so this is
       * 0 by construction - which is exactly why it is published rather than
       * claimed. A 0 that nothing computes looks the same as a missing rule. */
      const qOn = new Array(N);
      for (let m = 0; m < N; m++) {
        const id = pickTop(states[m]);
        queue[m] = id;
        qIdx[id] = m;
        let on = 0;
        const a = states[m].pose[id];
        for (let j = 0; j < N; j++) {
          if (j === id || !states[m].alive[j]) continue;
          const b = states[m].pose[j];
          if (overlapX(a, b) > 0.12 * L.bw && b.cH > a.cH + 0.30 * L.bh) on++;
        }
        qOn[m] = on;
        states[m + 1] = settleStep(era, states[m], id, m);
      }
      pl.states = states;
      pl.queue = queue;
      pl.qIdx = qIdx;
      pl.qOn = qOn;

      /* THIS ERA'S PIPE ARRANGEMENT, and its inverse. pmap[j] is the SLOT pipe
       * j is standing in as the era opens; pinv[s] is the pipe in slot s.
       * Everything below that used to read pipeHome(j) reads
       * pipeHome(pmap[j]): a pipe's starting height, its roll's origin and its
       * rotation are all properties of the slot it is standing in, not of its
       * index. In era 0 pmap is the identity and every one of them is
       * numerically what it was before this map existed. */
      const pmap = pipeMap(era);
      const pinv = new Array(NP);
      for (let j = 0; j < NP; j++) pinv[pmap[j]] = j;
      pl.pmap = pmap;
      pl.pinv = pinv;

      /* THE PIPES. The row is laid out BACKWARD FROM THE TOWER, and that is the
       * whole of the chain: the LEAD pipe's roll ends at L.pipeLim, the tower's
       * own face, so it STRIKES the stack on every canvas by construction. The
       * old row was laid forward from the pyramid by a hashed number of radii
       * and only ever pushed LEFT if it overran, so nothing extended it right
       * to reach the tower and it stopped 65-144 px short at every width.
       *
       * The rest of the roster trails the lead pipe at PGAPR radii a pair, with
       * the spare radii spread through the gaps by hash, and the REARMOST pipe
       * is pinned PDISP radii right of its own home. Since home slots are one
       * radius apart left to right (pipeLR) and every gap is wider than that,
       * each pipe travels further than the one behind it: the minimum travel
       * over the whole roster IS the rearmost's, PDISP radii, and no pipe can
       * be lifted later from the slot it started in. */
      const r = L.pipeR;
      const lead  = pinv[pipeLR(NP - 1)];   // whichever pipe is in the rightmost slot
      const prest = new Array(NP);   // where each pipe finally comes to rest
      const pcx   = new Array(NP);   // where its ROLL ends. The lead's is the tower.
      const pdel  = new Array(NP);   // how long after the blade it is knocked loose
      const pta   = new Array(NP);   // how long its roll lasts
      const ptb   = new Array(NP);   // how long its rebound lasts (0: it hit nothing)
      const pf    = new Array(NP);   // its speed at the END of the roll, as a
                                     // fraction of its speed at the start

      const back  = pipeHome(pipeLR(0)).x + PDISP * r;   // rearmost SLOT + min travel
      const front = L.pipeLim - PREB * r;                // the lead's, after the bounce
      const span  = front - back;
      // RE-DERIVED, not asserted. The base gap is PGAPR radii unless the room
      // genuinely is not there, in which case the row packs tighter rather than
      // overrunning the tower or merging two pipes. PDIV is what keeps this
      // min() a no-op: it budgets PGAPR for every one of the NP-1 gaps.
      /* THE GAP HAS A FLOOR, AND WHICH CLAIM GIVES WAY IS FIXED: contact
       * first, then no-overlap, then minimum travel. Two pipe centres closer
       * than 2 r are not a tight row, they are INTERPENETRATING -- a broken
       * picture -- so the gap floors at 2 r, and what gives instead is the
       * REAR of the row, which slides left of `back` and costs the rearmost
       * pipe some of its travel. The lead's rest is measured back from
       * `front` either way, so the strike is never the thing traded away.
       *
       * That floor is also what turns "the minimum travel over the roster is
       * the rearmost pipe's" from a measurement into an argument: consecutive
       * home slots are AT MOST one radius apart (pipeLR sorts a triangle whose
       * x offsets are whole radii, and two pipes two courses apart share an
       * offset exactly), so with every rest gap at least 2 r, each pipe travels
       * at least a radius further than the one behind it, and the minimum is
       * the rearmost's PDISP by construction rather than by luck of the hash.
       *
       * PDIV keeps the whole branch a no-op today: it budgets PGAPR (> 2) for
       * every one of the NP - 1 gaps, so gbase is PGAPR * r, slack is
       * positive, and x starts at exactly `back`. */
      const gbase = Math.max(2 * r, Math.min(PGAPR * r, span / (NP - 1)));
      const wgt   = new Array(NP - 1);
      let wsum = 0;
      for (let m = 0; m < NP - 1; m++) { wgt[m] = 0.40 + rnd(era, m, 63); wsum += wgt[m]; }
      const slack = Math.max(0, span - gbase * (NP - 1));
      let x = Math.min(back, front - gbase * (NP - 1) - slack);   // = back, with the room
      for (let m = 0; m < NP; m++) {
        const sl = pipeLR(m);          // the m-th slot from the left...
        const j  = pinv[sl];           // ...and the pipe standing in it
        if (m > 0) x += gbase + slack * wgt[m - 1] / wsum;
        prest[j] = x;
        /* FRONT FIRST, AND THAT IS WHAT OPENS THE ROW. The pipe at the front
         * of the pile has open ground ahead of it; the ones behind are blocked
         * by the ones in front and only move once there is room, so the delay
         * grows toward the blade. Together with the common roll time below
         * (which makes a pipe's speed proportional to how far it has to go)
         * this is what pulls the row apart FAST ENOUGH: a nested pipe's centre
         * has to be a full 2 r from the ground pipe ahead of it by the time it
         * has finished dropping out of its valley, or it is set down INSIDE
         * that pipe. Measured over three eras, no two pipe centres come closer
         * than 2.000 r at any instant of the roll: they touch in the pyramid,
         * and from the shove onward they only separate.
         *
         * The lead pipe's own delay is absorbed into its roll time below, so
         * the strike still lands exactly on T_FALL however the hash falls. */
        // The hashed part is HALF the spacing between consecutive delays, so
        // it can vary the shove without ever reordering it - and the order is
        // what keeps every nested pipe's valley opening rather than closing.
        //
        // KEYED ON THE SLOT, NOT THE PIPE. Every hashed pipe quantity in this
        // block is a property of a POSITION in the row - which is what the
        // physics below and the strike above are written in terms of - so the
        // whole fall is identical era for era to what it was before pipes
        // stopped going back to their own slots. Only the recovery changed.
        pdel[j] = PSPRD * (NP - 1 - m) / (NP - 1)
                  + (PSPRD / (NP - 1)) * 0.5 * rnd(era, sl, 62);
        if (j === lead) {
          pcx[j] = L.pipeLim;                            // ...the tower's face
          pta[j] = PGAP - pdel[j];                       // CONTACT AT EXACTLY T_FALL
          ptb[j] = PREBT;
          pf[j]  = PARRF;                                // still moving when it hits
        } else {
          pcx[j] = x;
          // ONE roll time for the whole pile: they were all shoved by the same
          // blade, so the pipe with further to go simply starts off faster
          // (v0 = 2D/PROLL). That is also what keeps the row opening.
          pta[j] = PROLL;
          ptb[j] = 0;
          pf[j]  = 0;                                    // rolls quietly to a stop
        }
      }
      // The one number the whole chain rests on comes from the LAYOUT, not from
      // the accumulated row: floating-point drift down NP - 1 gaps must not be
      // the difference between a strike and a near miss.
      prest[lead] = front;

      pl.prest = prest;
      pl.pcx = pcx;
      pl.pdel = pdel;
      pl.pta = pta;
      pl.ptb = ptb;
      pl.pf = pf;
      pl.plead = lead;

      /* THE PIPES FALL, THEY ARE NOT LOWERED ON A TIMER. Integrated once per
       * era at the same fixed step as the girders, exactly the same way and
       * for exactly the same reason: a closed form cannot be both correct and
       * bounded here.
       *
       * The geometry gives a FLOOR, not a position. A pipe cannot be lower
       * than resting on whatever pipe in a lower course is still under it —
       * at a horizontal offset dx it rides sqrt(4r^2 - dx^2) above that one's
       * centre, which at dx = r is the r*sqrt(3) of the pyramid itself, so
       * the stacked pyramid is the s = 0 case of this loop. Against EVERY
       * lower course, not just the two nominal supports: the apex of a
       * four-course pyramid comes down through the column two courses below
       * it, and constraining only its own supports measured two centres
       * 0.92 r apart — pipes visibly through pipes.
       *
       * But the floor alone is not the motion. d/d(dx) of that square root is
       * unbounded as dx approaches 2r, so a pipe rolling off the last of its
       * support drops the final radius in one frame: measured, 2.0 px in a
       * millisecond, a pipe teleporting into the gap. Gravity is what actually
       * limits it, so gravity is what is integrated, with the floor as a
       * contact: 0.27 px per ms, and a pipe that visibly falls the moment the
       * valley under it opens.
       *
       * NP*(NP-1)/2 comparisons and NP steps, 132 times per era, off the
       * render loop. The table is 10 x 132 doubles and cannot grow. */
      const ptab = new Float64Array(NP * PSTEPS);
      const pyv = new Array(NP), pvy = new Array(NP), pxs = new Array(NP);
      for (let j = 0; j < NP; j++) { pyv[j] = pipeHome(pmap[j]).y; pvy[j] = 0; }
      /* The contact radius the DROP is solved with is a whisker over the real
       * one. draw() reads this table by lerping between fixed-step samples, and
       * a chord of a circle lies inside it. PDT is most of the answer; PFAT is
       * the last 2% of margin — it costs the nested pipes a fiftieth of a
       * radius of extra clearance while they drop, and nothing at all in the
       * stocked pyramid, which pipeHome still defines exactly and which the
       * no-rise clamp below holds them at until the valley opens. */
      const PFAT = 1.020;
      const gp = GK * u, rr4 = 4 * (r * PFAT) * (r * PFAT);
      for (let s = 0; s < PSTEPS; s++) {
        const tp = T_PIMP + s * PDT;
        for (let j = 0; j < NP; j++) pxs[j] = pipeLooseX(pl, j, tp);
        // SWEEP THE SLOTS, LOWEST COURSE FIRST. That is slot order, and it is
        // what id order used to stand in for: a pipe is solved only after
        // everything it could still be resting on has moved this step.
        for (let si = 0; si < NP; si++) {
          const j = pinv[si], cj = pipeCell(si).c;
          let ym = L.ground - r;                  // the ground, unless...
          for (let sk = 0; sk < si; sk++) {       // ...slots are course-ordered, so
            if (pipeCell(sk).c >= cj) continue;   // every sk < si is at or below si
            const k = pinv[sk];
            const dx = pxs[j] - pxs[k], d2 = rr4 - dx * dx;
            if (d2 <= 0) continue;                // rolled clear of that one
            const yy = pyv[k] - Math.sqrt(d2);
            if (yy < ym) ym = yy;
          }
          pvy[j] += gp * PDT;
          let y = pyv[j] + pvy[j] * PDT;
          if (y > ym) { y = ym; pvy[j] = 0; }     // landed on it
          if (y < pyv[j]) y = pyv[j];             // and never rises out of it
          pyv[j] = y;
          ptab[j * PSTEPS + s] = y;
        }
      }
      pl.ptab = ptab;

      /* RECOVERY: THE LEFTMOST CLEAR PIPE, INTO THE NEXT EMPTY SLOT.
       *
       * WHAT THE CRANE PICKS. The fallen row is swept by where the pipes
       * actually LIE - clearSweep is handed their resting poses - and never by
       * which pipe it is. The queue used to be the identity, and identity has
       * no relationship to the row: the crane worked around the pipe lying
       * second from the left until that pipe's own turn came up fifth, laying
       * the three it fetched meanwhile over the top of it.
       *
       * "LEFTMOST" ALONE IS NOT THE RULE, because it would not be safe in
       * general: pipes slide over one another as they are knocked loose, and a
       * blind sweep could reach for one with another lying on it. The rule is
       * the leftmost pipe that is CLEAR.
       *
       * AND ON THIS ROW THAT GUARD IS INERT - SAY IT PLAINLY. pipeRest returns
       * y = ground - r for every pipe in the roster, so the fallen row is one
       * flat layer, and planEra's own gap floor keeps consecutive centres at
       * least 2 r apart. Nothing can be on top of anything, so the clear test
       * cannot fire and pl.pblock is 0 BY CONSTRUCTION, not by luck. That is a
       * consequence of the row rather than an assumption the code leans on:
       * the number is published so it moves the day pipeRest stops pinning y,
       * and the rule itself is not a lump of unexercised code either - it is
       * clearSweep, the same function PSTEP is derived by running and the same
       * one __DIAG.sweep hands to a checker, which CAN stack a row and watch
       * it defer the loaded pipe. Under `pblock: 0` below, read "the guard was
       * offered the row and had nothing to do", never "the guard was tested".
       * pl.pcyc likewise counts the impossible case (a ring of pipes each on
       * the next), where the leftmost is taken anyway: leaving the roster
       * short is the one outcome that is worse than a bad order.
       *
       * WHERE IT PUTS IT. Slot k for the k-th pick: the ground course filled
       * completely left to right, then the three that nest in its valleys,
       * then the two, then the apex. A pipe is never lowered into a valley
       * that does not yet exist, and that is a property of the SLOT NUMBERING
       * (see pipeCell), so it holds whichever pipe is in the hook - and it is
       * RE-DERIVED into pl.pcrs rather than left to this paragraph: pcrs
       * counts the fills that took a course lower than the one before, or
       * moved right to left inside a course. Every slot is written exactly
       * once because pIdx is clearSweep's inverse of pqueue, and clearSweep
       * returns a permutation for any row at all.
       *
       * THE ERA SEAM. pmap said where the pipes stood as this era opened;
       * pIdx says where they stand as it closes, and pipeMap(era + 1) is what
       * the NEXT era opens from. Those two MUST agree or all NP pipes jump at
       * the boundary. They agree exactly while the real row is the canonical
       * one PSTEP was derived on - which is the one thing above that could
       * stop being true - so the agreement is RE-DERIVED here against PSTEP
       * and any disagreement is counted into pl.pseam and published, rather
       * than asserted in this comment. */
      const rx = new Array(NP), ry = new Array(NP);
      for (let j = 0; j < NP; j++) {
        const q = pipeRest(pl, j);       // ONE definition of where a pipe rests
        rx[j] = q.x; ry[j] = q.y;
      }
      const sw     = clearSweep(rx, ry, r);
      const pqueue = sw.q;               // pqueue[k]: the pipe picked up k-th
      const pIdx   = sw.idx;             // pIdx[j]:   when pipe j is picked up
      const pslot  = new Array(NP);
      for (let k = 0; k < NP; k++) pslot[k] = k;   // slot order IS course order

      // The two things the paragraphs above claim, as numbers. pcrs: the fill
      // order never drops a course or backs up inside one. pseam: the era
      // closes on exactly the arrangement the next era opens from.
      let pcrs = 0;
      for (let k = 1; k < NP; k++) {
        const c1 = pipeCell(pslot[k]).c, c0 = pipeCell(pslot[k - 1]).c;
        if (c1 < c0) pcrs++;
        else if (c1 === c0 && pipeHome(pslot[k]).x <= pipeHome(pslot[k - 1]).x) pcrs++;
      }
      let pseam = 0;
      for (let j = 0; j < NP; j++) if (pIdx[j] !== PSTEP[pmap[j]]) pseam++;
      pl.pqueue = pqueue;
      pl.pIdx   = pIdx;
      pl.pslot  = pslot;
      pl.pblock = sw.blocked;
      pl.pcyc   = sw.cyc;
      pl.pcrs   = pcrs;
      pl.pseam  = pseam;

      return pl;
    }

    function planFor(era) {
      const key = era + '|' + W + 'x' + H;
      if (planKey[0] === key) return planVal[0];
      if (planKey[1] === key) return planVal[1];
      const v = planEra(era);
      planKey[planNext] = key;
      planVal[planNext] = v;
      planNext = 1 - planNext;
      return v;
    }

    /* ------------------------------------------------------------ the phase
     *
     * Where we are in the era, as a tagged value. Exactly one of five kinds,
     * and everything downstream branches on it — including the draw order, so
     * the piece on the hook is always painted last. */
    function phaseAt(tau) {
      if (tau < T_BUILD) return { kind: 0, i: 0, s: seg(tau, 0, T_BUILD) };       // stocked
      if (tau < T_PARK) {
        const q = (tau - T_BUILD) / CYCLE;
        const n = Math.min(N - 1, Math.floor(q));
        return { kind: 1, i: n, s: q - n };                                        // build
      }
      // PARK, EMERGE, REVERSE, IMPACT, SWAY, TOPPLE and both BEATs are one
      // phase as far as the GIRDERS are concerned: s is time relative to the
      // impact and is NEGATIVE before it, which the fall table reads as "still
      // standing in the stack".
      if (tau < T_PREC) return { kind: 2, i: 0, s: tau - T_FALL };
      if (tau < T_GREC) {
        const q = (tau - T_PREC) / PCYC;
        const m = Math.min(NP - 1, Math.floor(q));
        return { kind: 4, i: m, s: q - m };                                        // pipes
      }
      const q = (tau - T_GREC) / CYCLE;
      const m = Math.min(N - 1, Math.floor(q));
      return { kind: 3, i: m, s: q - m };                                          // girders
    }

    /* ------------------------------------------------------------- the carry
     *
     * ONE chain of clamped lerps from a pick pose to a drop pose. Valid for
     * every s: below 0.10 it IS the pick pose, above 0.70 it IS the drop pose.
     * There is no branch that could stop drawing the load, which is what makes
     * the hand-offs identities rather than jumps. Used for every direction of
     * travel — yard to stack, heap to yard, and pipe ground to pyramid. */
    function carry(pk, dp, s, t, ty) {
      let x = pk.x, y = pk.y;
      y = lp(y, ty, eio(seg(s, 0.10, 0.30)));              // hoist clear
      x = lp(x, dp.x, eio(seg(s, 0.30, 0.52)));            // trolley crosses the site
      y = lp(y, dp.y, eio(seg(s, 0.52, 0.70)));            // lower onto the destination
      // A slung load levels out early in the hoist and is dead level well
      // before it is set down. Recovery is where this earns its keep: a girder
      // comes off the heap at whatever angle it landed at and arrives flat, and
      // a pipe arrives at the a = 0 that every pyramid slot has, so the yard
      // and the pyramid are pixel-identical era to era even though the pipes
      // have swapped slots inside it.
      const a = lp(pk.a, dp.a, eio(seg(s, 0.10, 0.44)));
      // Sway must be 0 at pick-up AND before release: a load still swinging
      // when the hook lets go would snap into its slot.
      const w = reduced ? 0 : swayWin(s);
      return { x: x + Math.sin(t * 2.1) * 1.5 * u * w,
               y: y,
               a: a - 0.030 * Math.cos(t * 2.1) * w };
    }

    // Lowering ends at s = 0.70 and this window closes at 0.68, so the frozen
    // pose IS the destination.
    function swayWin(s) { return eo(seg(s, 0.14, 0.28)) * (1 - eo(seg(s, 0.56, 0.68))); }

    /* -------------------------------------------------------- reading the fall
     *
     * A table lookup and a lerp. dt <= 0 is the stack still standing (sample 0
     * IS the upright stack pose, so the impact is not a discontinuity), and past
     * the end of the table it is the canonical pile pose, which the last sample
     * already equals. */
    function fallPose(pl, id, dt) {
      const tr = pl.tr[id];
      if (dt <= 0) return { x: tr[0], y: tr[1], a: tr[2] };
      const q = dt / DT;
      const i = Math.floor(q);
      if (i >= FSTEPS - 1) return pl.states[0].pose[id];
      const k = q - i, j = 3 * i;
      return { x: lp(tr[j], tr[j + 3], k),
               y: lp(tr[j + 1], tr[j + 4], k),
               a: lp(tr[j + 2], tr[j + 5], k) };
    }

    /* ------------------------------------------------------------- settling
     *
     * How far through its slump the heap is, during recovery job m. Opens just
     * after the hook takes the load and is finished long before the piece is
     * set down, so each removal reads as its own distinct event. */
    function slumpK(s) { return eo(seg(s, 0.14, 0.42)); }

    // Pose of a surviving pile piece part-way through that slump. The extra
    // sin() term carries it a touch PAST its new seat and back — a heap
    // dropping onto itself overshoots. It is 0 at both ends, so the endpoints
    // are still exactly states[m] and states[m + 1].
    function slumpPose(a, b, k) {
      const over = Math.abs(b.y - a.y) * 0.22 * Math.sin(Math.PI * k);
      return { x: lp(a.x, b.x, k), y: lp(a.y, b.y, k) + over, a: lp(a.a, b.a, k) };
    }

    /* ------------------------------------------------------- the girder pose
     *
     * THE TOTAL FUNCTION. For every phase and every id this takes exactly one
     * branch — YARD, HOOK, STACK, FALLING or PILE — and every branch returns a
     * pose. No branch returns nothing, so no girder can stop being drawn; no
     * branch invents an id, so no girder can appear. */
    function poseAt(pl, ph, id, t) {
      const hm = home(id);

      if (ph.kind === 0) return hm;                                     // YARD

      if (ph.kind === 1) {                                              // build
        const n = pl.level[id];
        if (n > ph.i) return hm;                                        // YARD, awaiting
        const slot = { x: pl.slotX[n], y: slotY(n), a: pl.slotA[n] };
        if (n < ph.i) return slot;                                      // STACK, placed
        return carry(hm, slot, ph.s, t, travelYFor(ph.i));              // HOOK
      }

      if (ph.kind === 2) return fallPose(pl, id, ph.s);                 // STACK -> PILE
      if (ph.kind === 4) return pl.states[0].pose[id];                  // PILE, waiting

      const m = pl.qIdx[id];                                            // recovery
      if (m < ph.i) return hm;                                          // YARD, recovered
      if (m === ph.i) {                                                 // HOOK
        /* THE PICKUP ANGLE IS TAKEN MODULO A HALF TURN. It used to be
         * justified by symmetry - a lattice girder looks the same either way
         * up - and that argument is GONE: a plate with a letter cut into it is
         * not symmetric under anything, and if this branch ever fired it would
         * snap the letter through 180 degrees at the moment the hook took it.
         *
         * It cannot fire, and now for a reason that does not depend on taste.
         * THCAP bounds a loose piece's |theta| at pi/2 - 0.12, and sleepPiece
         * then clamps the rest angle to +/-0.40 rad of the nearest multiple of
         * pi - so the multiple is always 0 and round(a / pi) is always 0.
         * Measured: over four eras the largest |angle| any plate rests at is
         * 22.9 degrees, and every letter in the fallen heap is still the right
         * way up. This line is therefore a provable no-op, kept as the guard it
         * always was: if some future geometry did let a piece land past
         * vertical, the pile and the hook would still hand off to the pixel. */
        const pk = pl.states[m].pose[id];
        const a0 = pk.a - Math.PI * Math.round(pk.a / Math.PI);
        return carry({ x: pk.x, y: pk.y, a: a0 }, hm, ph.s, t,
                     travelYFor(N + NP + ph.i));
      }
      return slumpPose(pl.states[ph.i].pose[id],                        // PILE, settling
                       pl.states[ph.i + 1].pose[id], slumpK(ph.s));
    }

    /* --------------------------------------------------------- the pipe pose
     *
     * The second roster, and the same shape of total function: PYRAMID, ROLLING,
     * REBOUNDING, LOOSE, HOOK, PYRAMID. Rolling is closed-form and exact rather
     * than integrated, because rolling without slipping IS a closed form:
     *
     *     theta = (x - x0) / r
     *
     * — a pipe that travels its own circumference turns exactly once. It is
     * applied to x WHATEVER x is doing, which is why it survives the rebound
     * unchanged: the lead pipe visibly counter-rotates on the way back because
     * its x is decreasing, not because a second rule says to spin it the other
     * way. There is no path on which the drawn rotation and the drawn position
     * can disagree.
     *
     * THE TRANSLATION IS A CONSTANT DECELERATION, and rollK is its exact
     * solution rather than an easing curve dressed up as one: a body that
     * starts at speed v and is down to f*v after covering D is at
     *
     *     x = D * (2k - (1 - f)k^2) / (1 + f),      k = t/T
     *
     * f = 0 is a pipe rolling to a dead stop — every pipe but the lead — and
     * reduces to the 2k - k^2 this file used before. f = PARRF is the lead
     * pipe: STILL MOVING when it reaches the tower, which is what makes the
     * strike a strike rather than a touch. It then reverses at a fraction of
     * that speed and decelerates to rest PREB radii back (f = 0 again, mirrored
     * — so the rebound dies out instead of stopping dead). Speed jumps at the
     * contact, as it must; position does not, so nothing teleports. */
    const PROLL = 1.05;                // how long a knocked pipe rolls, all but the lead
    const PSPRD = 0.34;                // how long the shove takes to reach the back of
                                       // the pile, front pipe first
    /* A NESTED PIPE FALLS THROUGH ITS VALLEY, it does not sink through the
     * pipes beside it — and with four courses that is no longer a thing to
     * approximate with a timer. Its centre is exactly 2 r from each of the two
     * pipes it is sitting on, so given where THEY are its height is not a
     * choice: at a horizontal offset dx from a support it rides
     * sqrt(4r^2 - dx^2) above it, and it reaches the ground only once both
     * offsets have opened to a full 2 r. That is what pipeLoose solves below,
     * recursively down the courses, and it makes interpenetration
     * IMPOSSIBLE rather than merely unlikely: at dx = r it gives exactly the
     * r*sqrt(3) rise pipeHome uses, so the pyramid is the t = 0 case of the
     * same expression.
     *
     * The timed version this replaces (a hold, then an accelerating drop) put
     * two centres 1.73 r apart during the shove — pipes visibly through pipes.
     * It survived two courses because there the hold could be tuned; with four
     * there is no single number that works.
     *
     * WHAT MAKES THE SOLVE MONOTONE: a nested pipe is knocked loose BEFORE the
     * support on its left and AFTER the one on its right, because pdel falls
     * with the left-to-right index and PLR always places a nested pipe between
     * its own two supports. Both offsets therefore only ever open, so the pipe
     * only ever descends. The hashed part of pdel is held to half the spacing
     * between consecutive delays so it cannot reorder them. */

    const PWIN   = 2.20;               // s of pipe fall integrated per era: the
                                       // longest roll is 1.41 s and the deepest
                                       // drop that follows it 0.19 s
    /* A QUARTER OF THE GIRDERS' STEP, and the reason is the reader, not the
     * physics. draw() lerps between samples, and the curve a nested pipe
     * follows off its supports is a circle whose slope runs away near the end:
     * a chord across 1/60 s of it cuts 0.044 r inside, which is two pipe
     * centres closer than a diameter — the one thing the pipe geometry is not
     * allowed to show. At 1/240 s the chord error is sixteenth of that. It
     * costs 5280 doubles per era, integrated once, off the render loop. */
    const PDT    = DT / 4;
    const PSTEPS = Math.round(PWIN / PDT);
    const PREBT = 0.34;                // seconds the lead pipe's rebound takes
    const PARRF = 0.34;                // its speed at contact, as a fraction of the
                                       // speed it started the roll at

    function rollK(k, f) { return (2 * k - (1 - f) * k * k) / (1 + f); }

    // WHERE A PIPE ENDS UP LYING, and how far round it turned getting there.
    // The rotation is measured from the slot it STARTED this era in, which is
    // the only origin the roll ever had - it is the same closed form as before,
    // with pmap standing where the identity used to.
    function pipeRest(pl, j) {
      const hx = pipeHome(pl.pmap[j]).x;
      return { x: pl.prest[j], y: L.ground - L.pipeR, a: (pl.prest[j] - hx) / L.pipeR };
    }

    // WHERE A KNOCKED PIPE IS ALONG THE GROUND. Closed form and independent of
    // every other pipe, which is what lets the heights below be solved in one
    // sweep rather than iterated.
    function pipeLooseX(pl, j, tau) {
      const hx = pipeHome(pl.pmap[j]).x;        // the slot it started the era in
      const rt = tau - T_PIMP - pl.pdel[j];
      if (rt <= 0) return hx;
      if (rt < pl.pta[j]) {
        // ROLLING. Decelerating toward pcx: the rest slot, or - for the lead
        // pipe - the tower's face, which it reaches at exactly T_FALL.
        return hx + (pl.pcx[j] - hx) * rollK(rt / pl.pta[j], pl.pf[j]);
      }
      if (pl.ptb[j] > 0) {
        // REBOUNDING. Off the tower, decelerating to rest. rollK(1, f) is 1 for
        // every f, so this starts exactly where the roll ended.
        const b = Math.min(1, (rt - pl.pta[j]) / pl.ptb[j]);
        return pl.pcx[j] + (pl.prest[j] - pl.pcx[j]) * (2 * b - b * b);
      }
      return pl.prest[j];
    }

    /* A pipe's HEIGHT is read out of a table planEra integrated once. Past the
     * end of it every pipe is on the ground, which is the value the last sample
     * already holds — checked, not assumed. */
    function pipeLoose(pl, j, tau) {
      const r = L.pipeR, st = pipeHome(pl.pmap[j]), x = pipeLooseX(pl, j, tau);
      const q = (tau - T_PIMP) / PDT;
      let y;
      if (q <= 0) y = st.y;
      else if (q >= PSTEPS - 1) y = L.ground - r;
      else {
        const i = Math.floor(q), o = j * PSTEPS;
        y = lp(pl.ptab[o + i], pl.ptab[o + i + 1], q - i);
      }
      return { x: x, y: y, a: (x - st.x) / r };
    }

    /* TWO SLOTS, NOT ONE. A pipe starts the era in pl.pmap[j] and finishes it
     * in the slot its place in the recovery sweep gives it, pl.pslot[m]. Those
     * are the same slot only in the sense that both are pyramid slots; the
     * pipe genuinely moves, which is the change this file exists to make. Both
     * are read through pipeHome, so both are layout, and neither is a record
     * that could disagree with where the pyramid is drawn. */
    function pipePoseAt(pl, tau, j, t) {
      const st = pipeHome(pl.pmap[j]);                                  // where it began
      if (tau < T_PIMP) return st;                                      // PYRAMID
      const m  = pl.pIdx[j];
      const hm = pipeHome(pl.pslot[m]);                                 // where it goes back
      const t0 = T_PREC + m * PCYC;
      if (tau < t0) return pipeLoose(pl, j, tau);                       // ROLLING / LOOSE
      if (tau < t0 + PCYC) {                                            // HOOK
        /* THE PICKUP ANGLE IS TAKEN MODULO A WHOLE TURN. A pipe that has rolled
         * ten radii is at ten radians, and carry() unwinds the pickup angle to
         * zero over 0.39 s. Ten radians in 0.39 s is eight turns a second,
         * which at frameRate(30) is 97 degrees A FRAME: the off-centre key
         * strobes around the bore instead of turning, and that key exists
         * precisely so the rotation reads. A circle is invariant under a whole
         * turn, so dropping the turns changes NOTHING on screen - the first
         * carried frame is the last loose frame, to the pixel - and it caps the
         * unwind at half a turn however far the pipe rolled. The set-down still
         * arrives at exactly a = 0, and a = 0 is what pipeHome says EVERY slot
         * is, so a pipe dropped into a slot it did not start in still lands at
         * the rotation that slot has always had and the era-to-era pyramid
         * stays pixel-identical. */
        const pk = pipeRest(pl, j);
        pk.a -= 2 * Math.PI * Math.round(pk.a / (2 * Math.PI));
        return carry(pk, hm, (tau - t0) / PCYC, t, travelYFor(N + m));
      }
      return hm;                                                        // PYRAMID again
    }

    /* -------------------------------------------------------------- the hook
     *
     * The trolley and hook are driven off the SAME waypoints as the load, so
     * the two are rigidly attached instead of drifting apart mid-segment. Job k
     * ends with the hook parked over job k+1's pick point, so the chain is
     * continuous across every job and across the era boundary.
     *
     * Jobs: 0..N-1 build, N..N+NP-1 pipe recovery, N+NP.. girder recovery. */
    // How high a load rides while it crosses the site. A pipe job is half the
    // length of a girder job, so hoisting a pipe to the girders' travel height
    // would drop it twice as fast -- 100 px in a frame, which reads as a snap
    // rather than a lower. Pipes ride lower instead, which is also what a crane
    // does with a small load. A job's EMPTY rise at the end goes to the NEXT
    // job's height, so the hook's chain stays continuous across every boundary.
    function travelYFor(k) { return (k >= N && k < N + NP) ? L.jibY + 34 * u : L.travelY; }

    function pickPoint(pl, k) {
      if (k < N) return home(pl.order[k]);
      if (k < N + NP) return pipeRest(pl, pl.pqueue[k - N]);
      if (k < N + NP + N) { const m = k - N - NP; return pl.states[m].pose[pl.queue[m]]; }
      return { x: L.yardC, y: L.travelY, a: 0 };            // parked over the yard
    }
    function dropPoint(pl, k) {
      if (k < N) return { x: pl.slotX[k], y: slotY(k), a: 0 };
      if (k < N + NP) return pipeHome(pl.pslot[k - N]);   // slot k, not "its own"
      return home(pl.queue[k - N - NP]);
    }

    function hookAt(pl, ph) {
      const half = L.bh * 0.62;

      if (ph.kind === 0) {
        // Drift from the parked spot to the first pick over the STOCKED beat.
        return { x: lp(L.yardC, pickPoint(pl, 0).x, eio(ph.s)), y: travelYFor(0), s: 0 };
      }
      if (ph.kind === 2) {
        /* PARKED. This is beat C and it is the whole point: the crane holds a
         * single position, absolutely still, from the last placement until the
         * pipes are cleared. Without it the vehicle reads as a second
         * independent machine rather than as the same person having climbed
         * down. The last build job already walked the hook here (job k ends
         * over pick k+1), so the stop is continuous, not a snap. */
        return { x: pickPoint(pl, N).x, y: travelYFor(N), s: 0 };
      }

      const k = ph.kind === 1 ? ph.i : ph.kind === 4 ? N + ph.i : N + NP + ph.i;
      const pk = pickPoint(pl, k), dp = dropPoint(pl, k), nx = pickPoint(pl, k + 1);
      const ty = travelYFor(k), s = ph.s;
      let x = pk.x, y = ty;
      y = lp(y, pk.y - half, eo(seg(s, 0.00, 0.10)));       // drop to the load
      y = lp(y, ty - half, eio(seg(s, 0.10, 0.30)));        // hoist   \
      x = lp(x, dp.x, eio(seg(s, 0.30, 0.52)));             // travel   > same easings
      y = lp(y, dp.y - half, eio(seg(s, 0.52, 0.70)));      // lower   /  as carry()
      y = lp(y, travelYFor(k + 1), eo(seg(s, 0.76, 0.88))); // rise, empty, to job k+1
      x = lp(x, nx.x, eio(seg(s, 0.88, 1.00)));             // over the NEXT pick
      return { x: x, y: y, s: s };
    }

    /* ----------------------------------------------------------- the vehicle
     *
     * A PROP. It is in neither roster, is never counted, never recovered, never
     * stacked, and its whole existence is a pure function of tau. It backs out
     * from behind the cabin facing left, reverses across the site still facing
     * left — it is not looking where it is going, which is the joke — recoils
     * off the stack, waits out the first beat, then drives forward home.
     *
     * COLOUR: accent, hazard, rule and ink only. NOT the girder ramp, whose
     * every step is how the girder-conservation instrument identifies girders,
     * and not the darker ink those steps are braced, banded and outlined in
     * either -- the whole ramp AND its marks are on __DIAG.ramp so that
     * instrument widens to the colours actually drawn rather than to a guess
     * -- and NOT --ink-soft
     * either: in the light palette #56514a falls inside that instrument's blue
     * tolerance, so a moving soft-coloured prop would make the blue count track
     * the vehicle and quietly invalidate every measurement taken with it. */
    function vehicleAt(tau) {
      const hide = L.hutX - 1.0 * u;                    // fully behind the cabin
      const out  = L.hutX + 18.0 * u;                   // clear of the mast and cones
      // The blade stops at the PIPES, never at the tower.
      const hit  = L.pipeX - PK * L.pipeR - 3.4 * u;    // rear blade against the pipes
      if (tau < T_EMERG) return hide;
      if (tau < T_REV)   return lp(hide, out, eio(seg(tau, T_EMERG, T_REV)));
      if (tau < T_PIMP)  return lp(out, hit, eio(seg(tau, T_REV, T_PIMP)));
      // Recoil off the impact, then dead still for the beat. Zero at both ends.
      if (tau < T_RET)   return hit - 1.6 * u * Math.sin(Math.PI * seg(tau, T_PIMP, T_PIMP + 0.40));
      if (tau < T_BEAT2) return lp(hit, hide, eio(seg(tau, T_RET, T_BEAT2)));
      return hide;
    }

    /* THE RECOVERY, AS NUMBERS A CHECK CAN READ. Copied into the caller's
     * object rather than handed out by reference, so nothing downstream can
     * reach into a cached plan. Fixed-size, allocation-free: the arrays are
     * created once, with DIAG and with each sample. */
    function pubPipes(pl, o) {
      for (let k = 0; k < NP; k++) {
        o.pmap[k] = pl.pmap[k];
        o.pq[k]   = pl.pqueue[k];
        o.psl[k]  = pl.pslot[k];
        o.pix[k]  = pl.pIdx[k];
        o.pdst[k] = pl.pslot[pl.pIdx[k]];
        const h = pipeHome(k);
        o.phx[k] = h.x; o.phy[k] = h.y;
      }
      o.pblk = pl.pblock; o.pcyc = pl.pcyc;
      o.pcrs = pl.pcrs;  o.pseam = pl.pseam;
    }

    /* An exact, off-loop sample of the scene at any instant: both rosters'
     * poses, the phase, and the collapse's own timings — computed exactly the
     * way draw() computes them, and without touching the canvas. This is what
     * the headless creep check reads. It exists because p5 2.x's redraw() is
     * async, so reading a snapshot the renderer left behind is not a reliable
     * way to sample one exact instant. */
    function sampleAt(t) {
      if (!ready) return null;
      const era = Math.floor(t / ERA), tau = t - era * ERA;
      layout();
      const pl = planFor(era), ph = phaseAt(tau);
      // The layout numbers a check needs to reason about CONTACT are published
      // alongside the poses: a gap in pixels means nothing without the radius
      // and the girder width that define what touching IS.
      const o = { t: t, tau: tau, era: era, kind: ph.kind, s: ph.s,
                  bot: pl.botL, botR: pl.botR, sw: SWAY_T, fw: FALLW,
                  A3: pl.A3, A3b: pl.A3b,
                  tHit: pl.tHit, tLeanB: pl.tLeanB, seed: pl.seed, esc: pl.esc,
                  hv: pl.hv, srB: pl.srB,
                  swx: pl.swx, faceB: pl.faceB, stack2: L.stack2X,
                  lword: '', rword: '', leanB: 0,
                  forced: pl.forced, wall: pl.wall, mx: [], me: [],
                  oob: pl.oob, oobm: pl.oobm, vdrop: pl.vdrop, lnd: [],
                  hR: L.heapR, hL: L.heapL, wr: L.X0 + L.WW,
                  fdx: L.fdx / L.bw,
                  veh: vehicleAt(tau), lean: 0, hx: 0, hy: 0,
                  ww: L.WW, x0: L.X0, bw: L.bw, bh: L.bh, gap: L.gap,
                  gnd: L.ground, trav: L.travelY, u: u,
                  pr: L.pipeR, lim: L.pipeLim,
                  lead: pl.plead, stack: L.stackX, con: 0,
                  face: L.stackX - 0.5 * L.bw,        // the tower's own left face
                  jibL: L.jibL, jibR: L.jibR, cw: W, ch: H,
                  gx: [], gy: [], ga: [], px: [], py: [], pa: [],
                  pmap: new Array(NP), pq: new Array(NP), psl: new Array(NP),
                  pix: new Array(NP), pdst: new Array(NP),
                  phx: new Array(NP), phy: new Array(NP),
                  pblk: 0, pcyc: 0, pcrs: 0, pseam: 0,
                  word: WORD, gword: '', tword: '', qw: '', qon: [], qtop: 0,
                  rel: [], slp: [] };
      pubPipes(pl, o);
      /* THE RECOVERY, AS LETTERS. qw is the pick order spelled out - the letter
       * of each plate in the order the crane takes it off the heap - and qon is
       * how many pieces were lying ON each of those picks when it was lifted,
       * with qtop their sum. A checker reads the word the crane collects and
       * the number of times it cheated, side by side. */
      for (let m = 0; m < N; m++) {
        o.qw += WORD.charAt(pl.queue[m]);
        o.qon.push(pl.qOn[m]);
        o.qtop += pl.qOn[m];
      }
      for (let id = 0; id < N; id++) {
        const g = poseAt(pl, ph, id, t);
        o.gx.push(g.x); o.gy.push(g.y); o.ga.push(g.a);
        o.rel.push(pl.simRel[2 * id]); o.slp.push(pl.simRel[2 * id + 1]);
        o.lnd.push(pl.simLnd[id]);
        o.mx.push(pl.mx[id]); o.me.push(pl.me[id]);
      }
      for (let j = 0; j < NP; j++) {
        const q = pipePoseAt(pl, tau, j, t);
        o.px.push(q.x); o.py.push(q.y); o.pa.push(q.a);
      }
      readWords(pl, o.gx, o.gy, o.ga, o);
      o.lean  = o.ga[pl.botL] - pl.slotA[pl.nL];   // `bryan`, the struck tower
      o.leanB = o.ga[pl.botR] - pl.slotA[0];       // `bar`, tipped by bryan
      /* THE STRIKE, AS ONE NUMBER: the SURFACE gap, lead pipe's rim to the
       * face of the BOTTOM COURSE -- which is the girder the pipe actually
       * hits, and not always the leftmost one, since the courses are jittered.
       * Zero is contact. A centre-to-centre distance means nothing without bw
       * and pr, and re-deriving it at the check leaves two definitions of
       * "touching" free to disagree; this is the only one. */
      o.con = (o.gx[o.bot] - 0.5 * L.bw) - (o.px[o.lead] + L.pipeR);
      const hk = hookAt(pl, ph);
      o.hx = hk.x; o.hy = hk.y;
      return o;
    }

    /* ---------------------------------------------------------------- paint */

    /* --------------------------------------------------------- the ramps
     *
     * ONE FAMILY PER ROSTER, PURE VALUE. Every piece of a roster is painted
     * from a ramp between two CSS custom properties that share a hue and a
     * saturation, so only LIGHTNESS moves along the roster. No hue enters the
     * drawing that was not already in the page's palette, and no step can
     * drift toward --accent or --hazard, which identify different things.
     *
     * COLOUR IS A FUNCTION OF IDENTITY, NEVER OF SLOT. Girder 3 is the same
     * colour for the life of the page. That is the whole point: the yard is
     * ordered by identity - home(i) is monotonic in i - so it reads as a clean
     * ramp every era, while the tower is built, and the pyramid restacked, in
     * a shuffled order and read as jumbled ones AGAINST that reference. A
     * gradient carries its own ordering, so a shuffled gradient is legible as
     * out-of-order without the viewer remembering which colour is which.
     *
     * The steps are DERIVED from N and NP, not enumerated, so adding a piece
     * cannot leave one without a colour.
     *
     * WHAT THE RAMP ALONE CANNOT DO, AND WHAT CARRIES IT. Ten pipes across a
     * usable lightness range leaves about five L-points a step, roughly 1.2:1
     * between neighbours; at the size a pipe actually renders — about 13 px
     * across — the middle of the pyramid reads as one warm mass and only the
     * two or three palest and darkest pipes announce that they moved. That is
     * measured, and it is why the PLATE roster carries the reading: eight
     * steps over the same range are nearly twice as far apart, and each plate
     * additionally carries its LETTER, which is a shape rather than a value.
     * Two independent channels on the roster that has to be read; one,
     * honestly capped, on the roster that only has to read as coarsely
     * reshuffled. Where a letter repeats - b at 0 and 5, r at 1 and 7, a at 3
     * and 6 - the ramp is what tells the pair apart, and every such pair is at
     * least three steps of the eight apart, which is the widest separation any
     * pair in the roster has. A collar encoding a pipe's index by arc length was
     * tried and rejected: at 13 px the arc is illegible amid the bore, the rib
     * and the key, and the extra ink eats the very fill the ramp lives in.
     *
     * Nothing here is read per frame by the drawing code: readColors() bakes
     * both ramps and both mark sets into `c` when the palette is read, which
     * is at setup, on a scheme flip, and on the once-a-second re-read below.
     */

    // #rgb / #rrggbb -> [r,g,b] 0..255, or null for anything else. The only
    // shape a ramp endpoint is allowed to take; see hexPick in readColors.
    function parseHex(str) {
      const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(str).trim());
      if (!m) return null;
      const h = m[1];
      const w = h.length === 3
        ? [h[0] + h[0], h[1] + h[1], h[2] + h[2]]
        : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
      return [parseInt(w[0], 16), parseInt(w[1], 16), parseInt(w[2], 16)];
    }

    function toHex(rgb) {
      let out = '#';
      for (let i = 0; i < 3; i++) {
        const v = Math.max(0, Math.min(255, Math.round(rgb[i])));
        out += (v < 16 ? '0' : '') + v.toString(16);
      }
      return out;
    }

    function rgbToHsl(rgb) {
      const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const l = (mx + mn) / 2, d = mx - mn;
      if (d === 0) return [0, 0, l];
      const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      let h;
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      return [((h * 60) % 360 + 360) % 360, s, l];
    }

    function hslToRgb(h, s, l) {
      h = ((h % 360) + 360) % 360;
      const ch = (1 - Math.abs(2 * l - 1)) * s;
      const x = ch * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - ch / 2;
      const k = Math.floor(h / 60) % 6;
      const t = k === 0 ? [ch, x, 0] : k === 1 ? [x, ch, 0] : k === 2 ? [0, ch, x]
              : k === 3 ? [0, x, ch] : k === 4 ? [x, 0, ch] : [ch, 0, x];
      return [(t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255];
    }

    // WCAG relative luminance and contrast ratio. The mark colours are CHOSEN
    // to clear a ratio rather than eyeballed, so every plate keeps the cut edge
    // round its letter, and every pipe its bore and key, whatever the CSS
    // endpoints are retuned to.
    function relLum(rgb) {
      const w = [0.2126, 0.7152, 0.0722];
      let y = 0;
      for (let i = 0; i < 3; i++) {
        const v = rgb[i] / 255;
        y += w[i] * (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      }
      return y;
    }

    function contrast(a, b) {
      const x = relLum(a), y = relLum(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    }

    /* n steps from lo to hi, interpolated in HSL. When the endpoints share a
     * hue and a saturation - which is how style.css defines every pair - the
     * hue and saturation terms are constant and the result is a pure value
     * ramp. The shortest-arc hue term is there so a mistuned pair degrades to
     * a sane gradient rather than sweeping the wheel the long way round. */
    function rampOf(lo, hi, n) {
      const a = rgbToHsl(parseHex(lo) || [0, 0, 0]);
      const b = rgbToHsl(parseHex(hi) || [0, 0, 0]);
      const dh = ((b[0] - a[0] + 540) % 360) - 180;
      const out = new Array(n);
      for (let i = 0; i < n; i++) {
        const f = n === 1 ? 0 : i / (n - 1);
        out[i] = toHex(hslToRgb(a[0] + dh * f,
                                a[1] + (b[1] - a[1]) * f,
                                a[2] + (b[2] - a[2]) * f));
      }
      return out;
    }

    /* THE INK, ONE PER STEP: the nearest DARKER lightness of the step's own
     * hue that clears MARK_CR against it. On a plate that ink draws the
     * outline, the two bolt holes and the CUT EDGE around the letter; on a
     * pipe, the bore, the rib and the key. Two things are load-bearing and
     * neither is taste.
     *
     * ALWAYS DARKER, NEVER WHICHEVER FITS BEST. An earlier version picked the
     * direction that reached the ratio most easily, which inked the pale steps
     * dark and the deep steps pale; the deep steps then READ LIGHTER THAN THE
     * MID ONES and the ramp's ordering - the entire point of colouring the
     * rosters - inverted at the flip. That was measured in a rendered frame,
     * not feared. Ink that stays on one side is a monotone function of the
     * step's lightness, so however much of the piece it covers the order
     * survives. It covers less than it did - the lattice this replaced inked
     * two fifths of a girder's face, the letter's cut edge and outline a
     * fraction of that - so the rule is now cheaper to keep, not dearer. The
     * price is still paid in style.css: neither ramp may end darker than dark
     * ink can still be seen against, which is what fixes --girder-hi and
     * --pipe-hi where it does.
     *
     * A DARK OUTLINE ALSO ANSWERS THE PAGE. On the light theme it is what keeps
     * a pale step from dissolving into the canvas; on the dark theme the deep
     * steps are held off the background by their own fill instead, which is why
     * both dark endpoints are pulled toward the light. Saturation is eased off
     * slightly so the mark reads as ink rather than as more of the piece. */
    const MARK_CR = 2.7;

    function markOf(fill) {
      const f = parseHex(fill) || [0, 0, 0];
      const hsl = rgbToHsl(f);
      for (let k = 1; k <= 100; k++) {
        const nl = hsl[2] - k / 100;
        if (nl < 0.05) break;
        const cand = hslToRgb(hsl[0], hsl[1] * 0.9, nl);
        if (contrast(cand, f) >= MARK_CR) return toHex(cand);
      }
      return toHex(hslToRgb(hsl[0], hsl[1] * 0.9, 0.05));
    }

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      const pick = function (name, fallback) {
        const v = cs.getPropertyValue(name).trim();
        return v || fallback;
      };
      // A ramp endpoint has to be a hex this file can take apart. Anything
      // else - a named colour, a colour function, a typo - falls back to the
      // shipped default rather than to a NaN fill nobody would see coming.
      const hexPick = function (name, fallback) {
        const v = pick(name, fallback);
        return parseHex(v) ? v : fallback;
      };
      const bg = hexPick('--bg-raised', '#fffefb');
      const gl = hexPick('--girder-lo', '#90b3d0');
      const gh = hexPick('--girder-hi', '#345a79');
      const pl = hexPick('--pipe-lo',   '#dbd5c9');
      const ph = hexPick('--pipe-hi',   '#625741');
      c = {
        ink:    pick('--ink', '#1c1a17'),
        soft:   pick('--ink-soft', '#56514a'),
        rule:   pick('--rule', '#d9d4c9'),
        accent: pick('--accent', '#b8560f'),
        hazard: pick('--hazard', '#e0a92b'),
        blue:   pick('--blueprint', '#2d4a63'),
        // The page's own ground, and therefore the colour of a hole cut in a
        // plate: the canvas is cleared, never filled, so this IS what is behind
        // every pixel here. Re-read with the rest of the palette, so a theme
        // flip changes what the letters show through to.
        bg:     bg,
        gcol:   rampOf(gl, gh, N),        // girder fill, by identity
        pcol:   rampOf(pl, ph, NP),       // pipe fill, by identity
        gmark:  new Array(N),             // its outline, bolt holes, cut edge
        pmark:  new Array(NP)             // its bore, rib and key
      };
      for (let i = 0; i < N; i++) c.gmark[i] = markOf(c.gcol[i]);
      for (let j = 0; j < NP; j++) c.pmark[j] = markOf(c.pcol[j]);
      /* PUBLISHED, NOT RE-DERIVED. An instrument that identifies girders by
       * counting blueprint-blue pixels has to widen to a ramp; one that works
       * the ramp out for itself is a second definition free to disagree with
       * this one. Both endpoints AND every step, for both rosters, plus the
       * canvas background every step has to stay legible against, so a check
       * can compute the ratios rather than be told them. */
      const R = DIAG.ramp;
      R.girderLo = gl; R.girderHi = gh; R.pipeLo = pl; R.pipeHi = ph; R.bg = bg;
      for (let i = 0; i < N; i++) { R.girder[i] = c.gcol[i]; R.girderMark[i] = c.gmark[i]; }
      for (let j = 0; j < NP; j++) { R.pipe[j] = c.pcol[j]; R.pipeMark[j] = c.pmark[j]; }
    }

    // The CANVAS. u is NOT set here: it is derived from the capped world, in
    // layout(), which runs at the head of every draw and every off-loop sample.
    function measure() {
      const r = holder.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
    }

    function blueprintGrid() {
      p.stroke(c.rule);
      p.strokeWeight(1);
      const step = 8 * u;
      for (let x = step; x < W; x += step) p.line(x, 0, x, H);
      for (let y = step; y < H; y += step) p.line(0, y, W, y);
    }

    /* --------------------------------------------------- THE LETTERFORMS
     *
     * THE PLATE IS A STENCIL: the letter is CUT OUT of it and the page shows
     * through the hole. The plate keeps its own step of the colour ramp and its
     * own dark outline, so it still reads as a fabricated steel plate with a
     * mark burned into it rather than as an alphabet block.
     *
     * WHY THIS REPLACES THE INDEX BAND AND THE LATTICE. Both used to live in
     * the middle of the piece, which is now where the letter lives, and neither
     * survives being crossed by one: a diagonal brace through the counter of an
     * `a` at 19 px closes it. The letter is a far stronger second channel than
     * a stripe ever was - five distinct glyphs across eight pieces - and where
     * it repeats (b at 0 and 5, r at 1 and 7, a at 3 and 6) the pairs are at
     * least three steps apart on an eight-step ramp, which is the widest
     * lightness separation any pair in the roster has. Identity is still
     * readable off a single piece; it is read off shape AND value instead of
     * off value AND place. The two bolt holes are what is left of the "this is
     * fabricated, not moulded" job the lattice was doing.
     *
     * DRAWN FROM PRIMITIVES, NEVER FROM A FONT. No webfont, no canvas text
     * metrics, no dependency, and nothing that behaves differently under
     * file:// or on a machine without the family installed. Every glyph is
     * lines, an ellipse and two arcs, stroked at a fixed fraction of the
     * plate - so the letterform scales exactly with the piece and a screenshot
     * at one width is a screenshot at all of them.
     *
     * DESIGNED AT ITS SMALLEST SIZE, NOT SCALED DOWN TO ONE. The plate is
     * 18.6 px across on a 520 px page and 23.2 px on an 1100 px one - the
     * canvas is capped, so 1100 is also as big as it ever gets - which means
     * the face has to work at a 10.8 px x-height and never gets to enjoy more
     * than a 13.5 px one. Everything below is a fraction
     * of the PLATE, on one grid, with one stroke weight and one x-height,
     * because at that size the difference between two letters has to be a
     * difference in SKELETON - a stem's side, a bowl, an ascender - and not in
     * modelling, which is gone whatever you do.
     *
     * THE FIVE GLYPHS ARE b r y a n, and the pairs that have to stay apart are
     * b/r/a. Each pair is separated on TWO INDEPENDENT CHANNELS, so losing one
     * to a pixel grid still leaves the other:
     *
     *   b vs a   b has an ASCENDER (0.760 of the plate against a's 0.580) and
     *            its stem is on the LEFT; a's stem is on the RIGHT.
     *   b vs r   b has a closed bowl and is tall; r has no bowl and is short.
     *   a vs r   a has a closed bowl and a right stem; r has an arm and a
     *            left stem.
     *
     * EACH GLYPH IS CENTRED ON ITS OWN BOX rather than sharing a baseline
     * across the eight plates, and that inversion is what buys the size. A
     * shared baseline has to fit the ascender AND the descender inside one
     * plate, which is what held the version before this one to a 0.645
     * ascender and a 0.499 x-height; centring each glyph frees both to 0.760
     * and 0.580 - 16% more x-height and 18% more ascender on the same steel,
     * measured against that version and not against a guess. These are eight
     * separate plates, not a line of type, and nothing about a stencilled
     * plate promises a baseline it shares with the plate beside it. The
     * ascender/descender DIFFERENCE, which is what actually separates b from
     * a, is kept in full. The cost is a baseline that steps by 0.09 of a plate
     * - 1.7 px at 520 - between a tall letter and a short one along the yard.
     *
     * NO STENCIL BRIDGES, and that is a decision rather than an oversight. In
     * a real cut plate the counters of b and a would fall out and each would
     * need a tie. Here the letter is PAINTED in the page's ground rather than
     * cut through (see girder), so the counter is simply plate that was never
     * painted and nothing is unsupported. A bridge would cost real pixels: b's
     * counter is 5.8 x 5.4 px at the 520 px viewport, and a 1.7 px tie across
     * it removes a third of the only thing separating b from r. A tie across
     * the LEFT of a's bowl is also where a lowercase e keeps its crossbar,
     * which is a misread this face cannot afford.
     *
     * MEASURED AT THE 520 px VIEWPORT, where the plate is 18.6 px square:
     * x-height 10.8 px, ascender 14.1 px, stem 2.70 px, cut edge 0.56 px, and
     * the counters of b and a 5.8 x 5.4 and 5.0 x 5.4 px. The tallest ink is
     * 0.760 of the plate, so 0.12 of it - 2.2 px - is solid steel above and
     * below every letter. A plate still looks like a plate. */
    const GS    = 0.145;   // stroke weight, as a fraction of the plate's side
    const GXH   = 0.580;   // x-height, OUTER (a, r, n), ditto
    const GASC  = 0.760;   // ascender / descender height, OUTER (b, y), ditto
    const GRIV  = 0.075;   // bolt-hole diameter, ditto
    const GRIVX = 0.395;   // ...and its offset along the plate's mid-line. It
                           // is CENTRED IN THE BAND IT HAS TO FIT: the widest
                           // glyph reaches 0.30 of the plate and its cut edge
                           // another 0.03, and the outline's own half-weight
                           // comes 0.04 in from the edge, so the clear band is
                           // 0.33 to 0.46 and a 0.075 hole centred at 0.395
                           // leaves 0.022 either side. At 0.425 - where this
                           // sat - the hole touched the outline and read as a
                           // nick in the plate's edge rather than as a bolt.
    const GRAD  = 0.070;   // the plate's eased corner, ditto. Small on purpose:
                           // at 0.12 a square piece reads as a child's alphabet
                           // block, which is the one thing the letters must not
                           // turn this into. This is a flame-cut edge, knocked
                           // off just enough not to be a knife.
    const GRIM  = 0.030;   // the cut edge left around the knockout, ditto

    // The metric lines, relative to each glyph's OWN centre. CENTRELINES, so
    // the ink reaches half a stroke beyond them - which is why the caps below
    // are ROUND and not SQUARE: the outer heights quoted above are only true
    // if the cap adds its half-stroke back at each end.
    const G_XT = -(GXH - GS) / 2, G_XB = (GXH - GS) / 2;    // x-height band
    const G_AT = -(GASC - GS) / 2, G_AB = (GASC - GS) / 2;  // ascender band

    /* ONE GLYPH'S SKELETON, as strokes on the grid above, in plate-local
     * coordinates with the plate's centre at the origin and `d` the plate's
     * side. It only issues stroke primitives: the CALLER owns the colour and
     * the weight, which is what lets the same path be stroked twice - once
     * wide in the plate's own ink for the cut edge, once narrow in the page's
     * colour for the hole itself. Overlap freely; the second pass simply
     * covers the first. Unknown characters draw nothing, so a different WORD
     * cannot throw; it just loses a letter, visibly.
     *
     *   b  full-height stem, left; bowl over the x-height band, closing on it.
     *   r  x-height stem, left; arm branching off it below the top and rising
     *      to the x-height. No bowl - that is the whole of r vs b.
     *   y  two diagonals meeting on the baseline, the right one carrying on
     *      into a descender. The only glyph with ink below the baseline.
     *   a  bowl over the x-height band with a straight stem down its RIGHT
     *      side - the mirror of b's arrangement, and short.
     *   n  an arch on two legs. The left stem is NOT carried to the x-line: a
     *      stem whose cap stands above the shoulder's springing cuts a V-notch
     *      into the top-left silhouette, which at 11 px reads as a broken
     *      letter rather than as a branch.
     */
    function stencilPath(ch, d) {
      const ln = function (x0, y0, x1, y1) {
        p.line(x0 * d, y0 * d, x1 * d, y1 * d);
      };
      const el = function (x0, y0, w, h) {
        p.ellipse(x0 * d, y0 * d, w * d, h * d);
      };
      const ar = function (x0, y0, w, h, a0, a1) {
        p.arc(x0 * d, y0 * d, w * d, h * d, a0, a1);
      };
      const PI = Math.PI;
      if (ch === 'b') {
        ln(-0.2275, G_AT, -0.2275, G_AB);
        el(0, 0.0900, 0.455, 0.435);
      } else if (ch === 'r') {
        ln(-0.1100, G_XT, -0.1100, G_XB);
        ar(0.1100, G_XT + 0.135, 0.440, 0.270, PI, 1.5 * PI);
      } else if (ch === 'y') {
        ln(-0.1900, G_AT, 0.0000, 0.1275);
        ln(0.1900, G_AT, -0.0750, G_AB);
      } else if (ch === 'a') {
        el(0, 0, 0.415, 0.435);
        ln(0.2075, G_XT, 0.2075, G_XB);
      } else if (ch === 'n') {
        ar(0, G_XT + 0.190, 0.455, 0.380, PI, 2 * PI);
        ln(-0.2275, G_XT + 0.190, -0.2275, G_XB);
        ln(0.2275, G_XT + 0.190, 0.2275, G_XB);
      }
    }

    /* ONE LETTER PLATE. Always the same size — nothing in this scene squashes,
     * shrinks, fades or is crushed into anything — always the same COLOUR, and
     * always the same LETTER, because `id` is its identity and both are keyed
     * to identity rather than to the slot it happens to be standing in. A plate
     * carries its step of the ramp and its glyph into the tower, which is what
     * makes the word readable in both places at once.
     *
     * c.gmark[id] inks the bolt holes, the cut edge and the outline — always
     * darker than the step it is drawn on, so the outline never loses a pale
     * plate against the page and the ramp's ordering cannot invert.
     *
     * THE HOLE IS PAINTED IN THE PAGE'S OWN GROUND, not erased. The canvas is
     * cleared, never filled, so the colour behind every pixel of this sketch IS
     * --bg-raised; painting the letter in that colour and cutting it out with a
     * composite operation put exactly the same pixels on the screen, and this
     * way cannot leave a hole in the plate UNDERNEATH when two plates overlap
     * in the heap. Two passes: the cut edge first, a hair wider, then the hole.
     * On a pale plate the edge is what carries the letter; on a deep one the
     * hole is. Neither theme depends on the other's channel.
     *
     * DRAWN, NOT BLITTED. Eight cached bitmaps would cost less per frame, but
     * every plate in this scene spends a third of the era ROTATED - through the
     * topple, the flight and the settle - and a rotated blit resamples a 2.7 px
     * stem into mush at exactly the moment the heap has to stay readable. The
     * cost is two stencil passes over eight plates - sixteen paths of one to
     * three primitives each - against the ~300 strokes the lattice cost, so
     * the frame got cheaper, not dearer.
     *
     * `d` is the SHORT side, so nothing here can be stretched by a plate that
     * is not quite square: the glyph grid is undistorted by construction.
     *
     * KNOWN, DISCLOSED, NOT FIXED: in the fallen heap a plate resting on
     * another CLIPS the crown of the letter below it, because the pile beds
     * each piece 0.14-0.24 of a depth into the surface under it (sleepPiece)
     * and the ink now reaches 0.38 of the plate. Eyeballed over eras 0-3, both
     * themes, 520 and 1100: the only shape it makes is an `a` whose bowl loses
     * its top and reads as a `u`, deep in a five-plate stack with the covering
     * plate's own edge drawn across it. No letter outside the word is ever
     * formed at the FRONT of the pile and no wrong word appears. This is
     * inherited, not new - the same instant renders identically in the version
     * before the face grew - and readWords cannot see it, because gword and
     * tword sample home bays and tower courses only, never fallen plates. The
     * fix would be to bed pieces less deeply, which moves the pile's height
     * and its creep; it is not worth that. */
    function girder(cx, cy, ang, id) {
      const w = L.bw, h = L.bh, d = Math.min(w, h);
      const fill = c.gcol[id] || c.blue, mark = c.gmark[id] || c.rule;
      p.push();
      p.translate(cx, cy);
      if (ang) p.rotate(ang);
      const cr = GRAD * d;
      p.noStroke();
      p.fill(fill);
      p.rect(-w / 2, -h / 2, w, h, cr);
      // Two bolt holes on the plate's mid-line, well outside the widest glyph
      // (0.30 of the plate) — the fabricated read the lattice used to carry, in
      // the one band no letter reaches. They are on the mid-line rather than in
      // the corners because the ascenders now come within a pixel of where a
      // corner rivet would sit.
      p.fill(mark);
      const rv = Math.max(1.6, GRIV * d);
      p.circle(-GRIVX * w, 0, rv);
      p.circle( GRIVX * w, 0, rv);
      // The letter, knocked out. ROUND caps and joins: the metrics above are
      // centrelines, so the cap is what carries the ink out to the stated
      // outer height, and a round join is what keeps r's arm and n's shoulder
      // continuous with their stems. Both are set inside this push/pop so they
      // cannot leak out to the rope or the crane.
      const ch  = WORD.charAt(id);
      // The 1.35 px floor is a GUARD, not a working limit: GS*d falls below
      // it only under a 9.3 px plate, and the narrowest viewport this page can
      // produce gives 18.6 px. It is here so a future geometry degrades to a
      // thin face rather than to a hairline that anti-aliases away.
      const sw  = Math.max(1.35, GS * d);
      const rim = Math.max(0.50, GRIM * d);
      p.noFill();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      p.stroke(mark);
      p.strokeWeight(sw + 2 * rim);
      stencilPath(ch, d);
      p.stroke(c.bg || '#fffefb');
      p.strokeWeight(sw);
      stencilPath(ch, d);
      // The outline last, so the plate always closes.
      p.noFill();
      p.stroke(mark);
      p.strokeWeight(Math.max(1, 0.4 * u));
      p.rect(-w / 2, -h / 2, w, h, cr);
      p.pop();
    }

    /* One concrete pipe. The rib and the offset key are not decoration: a
     * circle is rotationally symmetric and the old drawing was CONCENTRIC
     * circles, so a rolling pipe was indistinguishable from a sliding disc and
     * the whole beat failed silently. An off-centre mark is what makes the roll
     * visible at all.
     *   `j` is the pipe's IDENTITY, not its slot: c.pcol[j] is fixed for the
     * page's life, so a pipe that lands in a different slot next era arrives
     * there wearing the same colour and the reshuffle is what the eye sees.
     * The bore, the rib and the key are drawn in c.pmark[j], which is picked
     * for contrast against that very fill - the rotation mark has to survive
     * every step of the ramp or the roll stops reading, which is the failure
     * this drawing already had once. */
    function pipe(x, y, r, ang, j) {
      const lw = Math.max(1, 0.4 * u);
      const fill = c.pcol[j] || c.rule, mark = c.pmark[j] || c.soft;
      p.push();
      p.translate(x, y);
      p.rotate(ang);
      p.noStroke();
      p.fill(fill);
      p.circle(0, 0, r * 2);
      p.stroke(mark);
      p.strokeWeight(lw);
      p.noFill();
      p.circle(0, 0, r * 2);
      p.circle(0, 0, r * 0.95);         // the bore
      p.line(0, -r * 0.48, 0, -r * 0.94);   // radial rib, bore to rim
      p.noStroke();
      p.fill(mark);
      p.circle(r * 0.70, 0, r * 0.30);      // the key: unmistakably off centre
      p.pop();
    }

    function hazardBand(y, h) {
      p.noStroke();
      const w = 3.2 * u;
      for (let x = -h; x < W + h; x += w * 2) {
        p.fill(c.hazard);
        p.quad(x, y + h, x + w, y + h, x + w + h, y, x + h, y);
      }
    }

    /* The laydown yard's furniture: timber bearers and a chalked bay marking
     * under every home slot, drawn whether the slot is occupied or not. An
     * empty, still-marked bay is what tells the viewer the girder that left it
     * is coming back to exactly that spot. The pipe ground gets the same
     * treatment, for the same reason. */
    function yardBays() {
      const lw = Math.max(1, 0.4 * u);
      for (let i = 0; i < N; i++) {
        const x = yardX(i);
        p.noStroke();
        p.fill(c.rule);
        p.rect(x - L.bw * 0.36, L.ground - L.dun, L.bw * 0.17, L.dun);
        p.rect(x + L.bw * 0.19, L.ground - L.dun, L.bw * 0.17, L.dun);
        p.stroke(c.soft);
        p.strokeWeight(lw);
        p.line(x - L.bw * 0.54, L.ground, x - L.bw * 0.54, L.ground - 1.5 * u);
        p.line(x + L.bw * 0.54, L.ground, x + L.bw * 0.54, L.ground - 1.5 * u);
      }
      const r = L.pipeR;
      p.stroke(c.soft);
      p.strokeWeight(lw);
      const pe = (PK + 0.3) * r;         // the pyramid's own footprint, whatever PK is
      p.line(L.pipeX - pe, L.ground, L.pipeX - pe, L.ground - 1.3 * u);
      p.line(L.pipeX + pe, L.ground, L.pipeX + pe, L.ground - 1.3 * u);
    }

    /* Static site furniture. The crane, the yard and the heap all sit in a
     * band; without this the corners of the frame are grid and nothing.
     * Everything here is fixed geometry — no state, no allocation. It is drawn
     * AFTER the vehicle, so the cabin is what hides the vehicle when parked. */
    function siteFurniture() {
      const g = L.ground;
      // The cabin is tall enough to hide the PARKED vehicle completely,
      // beacon included: it is the only thing occluding it, so if the roof is
      // lower than the vehicle's cab the prop's blinking light shows above it
      // at the STOCKED beat and the era-to-era pixel identity of the ground
      // band quietly stops holding.
      const hw = 5.8 * u, hh = 9.8 * u, hx = L.hutX;
      const lw = Math.max(1, 0.45 * u);

      // cabin
      p.noStroke();
      p.fill(c.rule);
      p.rect(hx - hw, g - hh, hw * 2, hh, 0.6 * u);
      p.stroke(c.soft);
      p.strokeWeight(lw);
      p.noFill();
      p.rect(hx - hw, g - hh, hw * 2, hh, 0.6 * u);
      p.line(hx - hw - 1.1 * u, g - hh, hx + hw + 1.1 * u, g - hh);   // roof lip
      p.noStroke();
      p.fill(c.hazard);
      p.rect(hx - hw + 1.0 * u, g - hh + 1.6 * u, 3.6 * u, 2.8 * u, 0.3 * u);  // lit window
      p.stroke(c.soft);
      p.strokeWeight(lw);
      p.noFill();
      p.rect(hx + 1.1 * u, g - hh + 1.4 * u, 3.4 * u, hh - 1.4 * u, 0.3 * u);  // door

      // ladder leaning on the cabin's far side
      const lx = hx - hw - 2.6 * u;
      p.line(lx, g, lx + 1.9 * u, g - hh - 0.9 * u);
      p.line(lx + 1.5 * u, g, lx + 3.4 * u, g - hh - 0.9 * u);
      for (let k = 1; k <= 4; k++) {
        const f = k / 5;
        p.line(lx + f * 1.9 * u, g - f * (hh + 0.9 * u),
               lx + 1.5 * u + f * 1.9 * u, g - f * (hh + 0.9 * u));
      }

      // cones flanking the mast foot
      cone(L.mastX - 4.6 * u, g);
      cone(L.mastX + 4.6 * u, g);

      yardBays();
    }

    function cone(x, g) {
      p.noStroke();
      p.fill(c.hazard);
      p.triangle(x - 1.9 * u, g, x + 1.9 * u, g, x, g - 4.2 * u);
      p.fill(c.rule);
      p.rect(x - 1.15 * u, g - 2.5 * u, 2.3 * u, 0.85 * u);
    }

    // The vehicle, facing LEFT. It travels right while facing left the whole
    // way out and the whole way to the stack, so it is unmistakably reversing.
    function vehicleDraw(vx, t) {
      const g = L.ground;
      const bl = 4.6 * u, wr = 1.5 * u;
      const wa = (vx - (L.hutX - 1.0 * u)) / wr;         // rolling without slipping
      const lw = Math.max(1, 0.4 * u);

      p.noStroke();
      p.fill(c.accent);
      p.rect(vx - bl, g - 4.4 * u, bl * 2, 2.4 * u, 0.5 * u);          // chassis
      p.rect(vx + bl * 0.62, g - 6.2 * u, 1.1 * u, 5.0 * u, 0.2 * u);  // rear blade
      p.fill(c.rule);
      p.stroke(c.ink);
      p.strokeWeight(lw);
      p.rect(vx - bl * 0.92, g - 7.9 * u, 3.6 * u, 3.6 * u, 0.4 * u);  // cab, on the front
      p.noStroke();
      p.fill(c.hazard);
      // Amber beacon, blinking on a whole-second grid: deterministic in t.
      if (Math.floor(t * 2) % 2 === 0) p.circle(vx - bl * 0.92 + 1.8 * u, g - 8.6 * u, 1.3 * u);

      // wheels, with a spoke so their roll is visible too
      p.fill(c.ink);
      for (let k = -1; k <= 1; k += 2) {
        const cxw = vx + k * bl * 0.55;
        p.circle(cxw, g - wr, wr * 2);
        p.push();
        p.translate(cxw, g - wr);
        p.rotate(wa);
        p.stroke(c.hazard);
        p.strokeWeight(lw);
        p.line(0, 0, 0, -wr * 0.78);
        p.pop();
        p.noStroke();
        p.fill(c.ink);
      }
    }

    function crane(still) {
      p.stroke(c.accent);
      p.strokeWeight(Math.max(1.5, 0.9 * u));
      p.noFill();
      p.line(L.mastX, L.ground, L.mastX, L.jibY);
      p.line(L.mastX - 2 * u, L.ground, L.mastX + 2 * u, L.ground);
      p.line(L.jibL, L.jibY, L.jibR, L.jibY);
      p.line(L.mastX, L.jibY - 7 * u, L.jibL, L.jibY);      // back stay
      p.line(L.mastX, L.jibY - 7 * u, L.jibR, L.jibY);      // fore stay
      p.line(L.mastX, L.jibY, L.mastX, L.jibY - 7 * u);     // apex
      p.noStroke();
      p.fill(c.accent);
      p.rect(L.jibL - 1.5 * u, L.jibY - 2 * u, 5 * u, 4 * u, 0.8 * u);   // counterweight
      // The cab light goes out while the crane is parked: the one drawn cue
      // that the operator has left it. Everything else about beat C is the
      // ABSENCE of motion.
      p.fill(still ? c.rule : c.hazard);
      p.rect(L.mastX - 1.4 * u, L.jibY + 0.2 * u, 2.8 * u, 2.2 * u, 0.4 * u);
    }

    /* ------------------------------------------------------- diagnostics hook
     *
     * Read-only, numbers only, allocated once. The headless checks read girder
     * angles out of this to verify the creep signature of the fall; leaving it
     * in costs a few dozen float writes a frame and makes the animation
     * inspectable from the console. */
    const DIAG = { t: 0, tau: 0, era: 0, kind: 0, s: 0, lean: 0, veh: 0,
                   gx: new Array(N), gy: new Array(N), ga: new Array(N),
                   px: new Array(NP), py: new Array(NP), pa: new Array(NP),
                   rel: new Array(N), slp: new Array(N), lnd: new Array(N),
                   bot: 0, A3: 0,
                   leanB: 0, tHit: 0, tLeanB: 0, lword: '', rword: '',
                   /* THE BOUND, AS THREE NUMBERS RATHER THAN A PARAGRAPH:
                    * pieces the moving bound touched, seats the lie-bound
                    * moved (and by how much, in plate widths), and the longest
                    * straight-down airborne run in the roster. See EDGEK. */
                   wall: 0, oob: 0, oobm: 0, vdrop: 0,
                   /* THE RECOVERY, PUBLISHED RATHER THAN RE-DERIVED. A checker
                    * that has to work out the sweep for itself is checking its
                    * own arithmetic, not the sketch's, so the sketch says:
                    * pmap  slot each pipe STARTED the era in
                    * pq    pipe ids in the order the crane collects them
                    * psl   slot the k-th collected pipe is set down in
                    * pix   collection index of each pipe (inverse of pq)
                    * pdst  slot each pipe ENDS the era in
                    * phx/phy  every slot's home, so slots can be compared as
                    *       positions without re-deriving pipeHome
                    * pblk  times the clear-on-top rule skipped a pipe. It
                    *       is 0 on every row this file builds - see planEra,
                    *       and read __DIAG.sweep before reading it as a test
                    * pcyc  times no clear pipe existed (leftmost taken anyway)
                    * pcrs  fills that dropped a course, or backed up in one
                    * pseam era-boundary disagreements with PSTEP */
                   pmap: new Array(NP), pq: new Array(NP), psl: new Array(NP),
                   pix: new Array(NP), pdst: new Array(NP),
                   phx: new Array(NP), phy: new Array(NP),
                   pblk: 0, pcyc: 0, pcrs: 0, pseam: 0,
                   /* THE WORD AS DRAWN. gword is the eight yard bays read left
                    * to right, tword the eight courses read TOP DOWN, both
                    * matched against the poses this frame actually painted and
                    * both '.'-padded where a slot is empty. word is what they
                    * are supposed to say. */
                   word: WORD, gword: '', tword: '',
                   /* THE RAMPS AS DRAWN. Filled by readColors, so it tracks a
                    * theme flip. Every colour the rosters are painted in, plus
                    * the endpoints they were interpolated from and the canvas
                    * background they were inked against - an instrument that
                    * identifies girders by their blue widens to THESE rather
                    * than to a guess about how far the ramp spread. */
                   ramp: { girderLo: '', girderHi: '', pipeLo: '', pipeHi: '',
                           bg: '', girder: new Array(N), girderMark: new Array(N),
                           pipe: new Array(NP), pipeMark: new Array(NP) },
                   sw: SWAY_T, fw: FALLW };

    /* ----------------------------------------------------------------- draw */

    p.setup = function () {
      measure();
      p.createCanvas(W, H);
      readColors();
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      p.frameRate(30);
      ready = true;
      if (reduced) p.noLoop();          // one still frame, no animation
    };

    p.draw = function () {
      const t = reduced ? STILL_T : (vt !== null ? vt : p.millis() / 1000 + WARM);
      const era = Math.floor(t / ERA);
      const tau = t - era * ERA;         // phase inside this stocked -> stocked loop

      layout();
      // Cheap insurance against a palette that settles after first paint, and
      // against a theme toggled by something other than the OS. The scheme
      // listener below is what actually satisfies the requirement.
      if (!reduced && vt === null && p.frameCount % 60 === 0) readColors();

      const pl = planFor(era);
      const ph = phaseAt(tau);

      p.clear();
      blueprintGrid();

      p.stroke(c.soft);
      p.strokeWeight(Math.max(1, 0.6 * u));
      p.line(0, L.ground, W, L.ground);

      // The vehicle goes down FIRST so the cabin occludes it while it is
      // parked: emerging is literally coming out from behind the cabin.
      const vx = vehicleAt(tau);
      vehicleDraw(vx, t);

      siteFurniture();

      /* THE PIPE ROSTER. Every id, every frame, LOWEST COURSE FIRST so a
       * nested pipe is drawn over the two it rests on. WHICH id that is now
       * depends on when you ask: until the crane starts clearing, the pipes
       * stand in pl.pmap's arrangement, so slot order is pl.pinv; from T_PREC
       * on they are being restacked in collection order and pl.pqueue[k] is
       * the pipe that ends up in slot k. Both are permutations of 0..NP-1, so
       * every pipe is painted exactly once whichever one is in use - the order
       * decides legibility, never WHETHER something is drawn. */
      const pord = tau < T_PREC ? pl.pinv : pl.pqueue;
      const pcar = ph.kind === 4 ? pl.pqueue[ph.i] : -1;
      for (let n = 0; n < NP; n++) {
        const j = pord[n];
        if (j === pcar) continue;
        const q = pipePoseAt(pl, tau, j, t);
        pipe(q.x, q.y, L.pipeR, q.a, j);
        DIAG.px[j] = q.x; DIAG.py[j] = q.y; DIAG.pa[j] = q.a;
      }
      if (pcar >= 0) {
        const q = pipePoseAt(pl, tau, pcar, t);
        pipe(q.x, q.y, L.pipeR, q.a, pcar);
        DIAG.px[pcar] = q.x; DIAG.py[pcar] = q.y; DIAG.pa[pcar] = q.a;
      }

      /* THE GIRDER ROSTER. Every id is drawn exactly once, every frame. The
       * order is chosen only so the picture is legible — pieces lower in the
       * heap first, the piece on the hook last — never to decide WHETHER
       * something is drawn. Painting is a permutation of 0..N-1 in all phases. */
      const carried = ph.kind === 1 ? pl.order[ph.i]
                    : ph.kind === 3 ? pl.queue[ph.i]
                    : -1;
      const heap = ph.kind === 2 || ph.kind === 4 ? pl.states[0].order
                 : ph.kind === 3 ? pl.states[ph.i].order
                 : null;

      const paint = function (id) {
        const gp = poseAt(pl, ph, id, t);
        girder(gp.x, gp.y, gp.a, id);
        DIAG.gx[id] = gp.x; DIAG.gy[id] = gp.y; DIAG.ga[id] = gp.a;
      };

      if (heap) {
        // Heap pieces bottom crown first, so a piece resting on another is
        // painted over it and the stacking reads correctly.
        for (let k = 0; k < heap.length; k++) {
          if (heap[k] === carried) continue;
          paint(heap[k]);
        }
        // Anything already recovered is standing in the yard.
        for (let id = 0; id < N; id++) {
          if (id === carried || pl.states[ph.kind === 3 ? ph.i : 0].alive[id]) continue;
          paint(id);
        }
      } else {
        for (let id = 0; id < N; id++) {
          if (id === carried) continue;
          paint(id);
        }
      }
      if (carried >= 0) paint(carried);

      crane(ph.kind === 2);

      // Rope and hook over everything. The empty hook is allowed its own swing,
      // damped to zero by the end of the job so the next one starts from rest.
      const hk = hookAt(pl, ph);
      const sway = reduced ? 0
        : Math.sin(t * 2.1) * 1.5 * u * swayWin(hk.s)
          + Math.sin(t * 2.6) * 0.9 * u * eo(seg(hk.s, 0.78, 0.88)) * (1 - eo(seg(hk.s, 0.94, 1.00)));
      p.stroke(c.soft);
      p.strokeWeight(Math.max(1, 0.4 * u));
      p.line(hk.x, L.jibY, hk.x + sway, hk.y);
      p.noFill();
      p.strokeWeight(Math.max(1, 0.55 * u));
      p.arc(hk.x + sway, hk.y + 1.1 * u, 2.2 * u, 2.2 * u, 0, p.PI);      // the hook itself
      p.noStroke();
      p.fill(c.accent);
      p.rect(hk.x - 2 * u, L.jibY - 1.2 * u, 4 * u, 2.4 * u, 0.5 * u);    // trolley

      hazardBand(L.ground + 1.5 * u, 2.6 * u);

      DIAG.t = t; DIAG.tau = tau; DIAG.era = era;
      DIAG.kind = ph.kind; DIAG.s = ph.s; DIAG.veh = vx;
      readWords(pl, DIAG.gx, DIAG.gy, DIAG.ga, DIAG);
      DIAG.bot = pl.botL;                // `bryan`'s base: the plate the pipes hit
      // The stack's lean, read straight off the piece that is carrying it. While
      // the bottom course is attached this IS the shared rotation, so the creep
      // check can read either.
      DIAG.lean  = DIAG.ga[pl.botL] - pl.slotA[pl.nL];
      DIAG.leanB = DIAG.ga[pl.botR] - pl.slotA[0];
      DIAG.A3 = pl.A3;
      DIAG.tHit = pl.tHit; DIAG.tLeanB = pl.tLeanB;
      DIAG.wall = pl.wall; DIAG.oob = pl.oob; DIAG.oobm = pl.oobm;
      DIAG.vdrop = pl.vdrop;
      for (let id = 0; id < N; id++) {
        DIAG.rel[id] = pl.simRel[2 * id];
        DIAG.slp[id] = pl.simRel[2 * id + 1];
        DIAG.lnd[id] = pl.simLnd[id];
      }
      pubPipes(pl, DIAG);
    };

    /* --------------------------------------------------------------- resize */

    // ResizeObserver delivers an initial notification as soon as it observes,
    // which can arrive before setup() has created the canvas. resizeCanvas()
    // would throw there, so the guard lives in the handler itself rather than
    // at any one call site.
    p.windowResized = function () {
      if (!ready) return;
      measure();
      p.resizeCanvas(W, H);
      if (reduced || vt !== null) p.redraw();
    };

    // The container can change size without the window doing so (rotation,
    // a CSS breakpoint, devtools). Watch the element itself as well.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { p.windowResized(); }).observe(holder);
    }

    // Re-read the palette if the OS flips between light and dark.
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = function () { readColors(); if (reduced || vt !== null) p.redraw(); };
    if (scheme.addEventListener) scheme.addEventListener('change', onScheme);
    else if (scheme.addListener) scheme.addListener(onScheme);

    /* ------------------------------------------------------------ test seams
     *
     * __DIAG  a read-only snapshot of the frame just drawn: both rosters'
     *         poses, the phase, the collapse's release/sleep times, and
     *         __DIAG.ramp - every colour both rosters are painted in.
     * __setVT drives the sketch off a virtual clock instead of millis(), so a
     *         headless screenshot lands on an exact instant. Pass null to hand
     *         the clock back. Both are inert unless something touches them —
     *         the scene is already a pure function of time, so neither changes
     *         what is drawn, only when. */
    // The timeline, so a headless check locates a beat by reading it rather
    // than by copying constants that then drift out of step.
    DIAG.T = { ERA: ERA, T_BUILD: T_BUILD, T_PARK: T_PARK, T_EMERG: T_EMERG,
               T_REV: T_REV, T_PIMP: T_PIMP, T_FALL: T_FALL, T_BEAT1: T_BEAT1,
               T_RET: T_RET, T_BEAT2: T_BEAT2, T_PREC: T_PREC, T_GREC: T_GREC,
               FALLW: FALLW, SWAY_T: SWAY_T, CYCLE: CYCLE, PCYC: PCYC,
               N: N, NP: NP, PK: PK, WARM: WARM, STILL_T: STILL_T,
               SPLIT: SPLIT, TSEP: TSEP, STACK_L: STACK_L,
               LWORD: WORD.slice(0, SPLIT), RWORD: WORD.slice(SPLIT),
               WORD: WORD };
    DIAG.at = sampleAt;                 // exact off-loop sampler, see above
    /* THE PICK RULE, HANDED OUT SO THAT IT CAN BE MADE TO FIRE. On the row
     * this file builds every pipe rests on the ground, so the clear-on-top
     * test never bites and DIAG.pblk is 0 by construction - a guard that
     * cannot be exercised in situ, and a 0 that would look the same if the
     * rule were missing. This is that rule, not a copy of it: the same
     * function planEra sweeps with and PSTEP is derived from. Hand it a row
     * that IS stacked and it defers the loaded pipe and counts it.
     *   rx, ry  pipe centres, NP of each      rad  the pipe radius
     *   -> { q, idx, blocked, cyc } as planEra reads them */
    DIAG.sweep = function (rx, ry, rad) { return clearSweep(rx, ry, rad); };
    window.__DIAG = DIAG;
    window.__setVT = function (ms) {
      if (!ready) return false;
      if (ms === null || ms === undefined) {
        vt = null;
        if (!reduced) p.loop();
        return true;
      }
      vt = ms / 1000;
      p.noLoop();
      p.redraw();
      return true;
    };
  };

  new window.p5(sketch, holder);
})();
