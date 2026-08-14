interface LabeledOption<T> {
    value: T
    label: string
}

export function getOptionLabel<T>(options: readonly LabeledOption<T>[], value: T) {
    return options.find((option) => option.value === value)?.label ?? String(value)
}
