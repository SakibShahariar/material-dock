/**
 * Test strict rectangle intersection. Touching edges do not count as overlap.
 */
export function rectsOverlap(a, b) {
    return a.x1 < b.x2 && a.x2 > b.x1 &&
        a.y1 < b.y2 && a.y2 > b.y1;
}
