/**
 * Resolve an explicit dock visibility transition.
 *
 * Returning null means the requested stable state is already reached or the
 * same transition is already in progress. Opposite in-flight transitions are
 * allowed so a pointer event can reverse an animation.
 */
export function getVisibilityTransition(currentState, visible) {
    const stableState = visible ? 'visible' : 'hidden';
    const transitionState = visible ? 'showing' : 'hiding';

    if (currentState === stableState || currentState === transitionState) return null;

    return {stableState, transitionState};
}
