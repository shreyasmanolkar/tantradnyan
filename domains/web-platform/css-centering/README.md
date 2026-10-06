# Why does `margin: auto` center a div?

A layout engine solves constraints. In a left-to-right horizontal block formatting context, a normal-flow block's content width, padding, border, and horizontal used margins must add up to the containing block's width. If the block is narrower and both horizontal margins are auto, equal margins satisfy the constraint.

## Derivation

For the lab's parent (no padding/border) and border-box child:

```text
left margin + child border-box width + right margin = parent content width
             420 - 180 = 240 pixels available
             left = right = 240 / 2 = 120 pixels
```

```css
.parent { width: 420px; }
.child { width: 180px; box-sizing: border-box; margin-left: auto; margin-right: auto; }
```

This follows the normal-flow block rules in [CSS 2.1 §10.3.3](https://www.w3.org/TR/CSS2/visudet.html#blockwidth). The rule is conditional on the box type, width, and available space. Browser engines also implement other formatting contexts with different rules.

## Manipulate and measure

[Open the lab](interactive/index.html) directly in a browser. Change parent and child widths; toggle width:auto and auto margins; compare block, flex, and grid contexts. The browser does the layout; JavaScript measures rectangles and computed styles. No package install is needed.

**Hypothesis:** with a fixed narrower child, nonnegative remaining width, and two auto horizontal margins in block flow, left and right used margins match. With width:auto, the child fills the space here and the auto margins resolve to zero. With an oversized child, the constraint no longer produces two equal positive margins.

**Expected initial result:** parent=420 px, child border-box=180 px, left/right gaps=120 px. The [initial browser verification](../../../docs/VALIDATION.md) observed these values in Chromium 151.0.7922.137 and checked width:auto, overflow, flex, and grid cases. Record browser/version, viewport, controls, computed margins, and geometric gaps for your own investigation; implementation verification does not establish personal mastery.

## Failure cases and alternative mechanisms

- An unconstrained block often has width:auto, filling its available width. There may be no free space for visible centering.
- An oversized normal-flow block overflows; equal auto margins do not solve negative free space in this context.
- Vertical auto margins in ordinary block flow do not behave like horizontal ones. The lab's block child stays at the top.
- Flex and grid have explicit alignment and sizing rules. Auto margins can participate there too; changing display changes the mechanism.
- Inline elements, absolute positioning, writing modes, and margin collapse need their own models.

The lab uses fixed child height, border-box sizing, no parent padding/border, and left-to-right direction. Signed geometric gaps show positioning; computed margins and gaps are not interchangeable in every context.

## Exercises and deeper paths

1. Predict the initial margins without opening the lab.
2. Set width:auto. Explain why the result changes.
3. Make the child wider than its parent. Which assumption fails?
4. Switch to grid. What mechanism centers vertically?
5. Add parent padding to the implementation and update the measurements to distinguish content and border boxes.

Next topic IDs: `box-model`, `layout`, `css-cascade`, and `browser-rendering`. Continue through tree traversal, runtime scheduling, processes, and instructions using [the generated paths](../../../docs/LEARNING-PATHS.md). You can answer this layout question fully before studying the lower layers.
