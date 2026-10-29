/**
 * Whether an explicit shell-state preference should suppress dock visibility.
 * Autohide behavior remains separate when neither preference matches.
 */
export function shouldHideForShellState(
    overviewVisible,
    fullscreen,
    hideInOverview,
    hideInFullscreen,
) {
    return (overviewVisible && hideInOverview) || (fullscreen && hideInFullscreen);
}
