/**
 * Build stable labels and settings values for the monitor preference row.
 * The primary option uses -1 so it follows GNOME's primary display when the
 * monitor order changes.
 */
export function buildMonitorOptions(monitorCount) {
    const count = Number.isFinite(monitorCount) ? Math.max(0, Math.floor(monitorCount)) : 0;
    return [
        ['Primary monitor', -1],
        ...Array.from({length: count}, (_, index) => [`Monitor ${index + 1}`, index]),
    ];
}
