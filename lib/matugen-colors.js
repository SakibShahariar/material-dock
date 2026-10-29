const REQUIRED_MATUGEN_COLORS = [
    'surface_container',
    'surface_container_high',
    'on_surface',
    'on_surface_variant',
    'primary',
    'error',
    'scrim',
];

export function parseMatugenColors(text) {
    const vars = {};
    const re = /--([a-z0-9_]+)\s*:\s*(#[0-9a-fA-F]{6})/g;
    let match;
    while ((match = re.exec(text)) !== null) vars[match[1]] = match[2];
    return vars;
}

export function hasRequiredMatugenColors(vars) {
    return REQUIRED_MATUGEN_COLORS.every(name => /^#[0-9a-fA-F]{6}$/.test(vars[name] ?? ''));
}
