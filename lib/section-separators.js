export function getSectionSeparatorVisibility(sections, enabled = true) {
    if (!enabled) return sections.map(() => false);

    return sections.map(
        (visible, index) => Boolean(visible && sections.slice(index + 1).some(Boolean)),
    );
}
