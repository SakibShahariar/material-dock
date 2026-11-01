export function runGroupAction(items, action) {
    let completed = 0;
    let failed = 0;

    for (const item of items) {
        try {
            action(item);
            completed++;
        } catch {
            failed++;
        }
    }

    return {completed, failed};
}
