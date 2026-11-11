/**
 * Bounding corridor between the dock and preview panel, expanded for forgiving
 * pointer travel. Rectangles use transformed stage coordinates.
 */
export function buildHoverCorridor(panel, dock, padding) {
    return {
        x1: Math.min(panel.x1, dock.x1) - padding,
        y1: Math.min(panel.y1, dock.y1) - padding,
        x2: Math.max(panel.x2, dock.x2) + padding,
        y2: Math.max(panel.y2, dock.y2) + padding,
    };
}

export function pointInRect(x, y, rect) {
    return x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
}
