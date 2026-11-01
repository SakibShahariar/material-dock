/**
 * Describe app state in text so running, focus, and urgency are not conveyed
 * by indicator color or shape alone.
 */
export function getAccessibleAppDescription(running, focused, urgent, windowCount) {
    const count = Number.isFinite(windowCount) ? Math.max(0, Math.floor(windowCount)) : 0;
    const states = [];

    states.push(running ? 'Running' : 'Not running');
    if (focused) states.push('Focused');
    if (urgent) states.push('Requires attention');
    if (count > 0) states.push(`${count} ${count === 1 ? 'window' : 'windows'} open`);

    return states.join('; ');
}
