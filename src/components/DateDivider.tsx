interface DateDividerProps {
  label: string
}

export const DateDivider = ({ label }: DateDividerProps) => {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-surface-border" />
      <span className="text-xs text-ink-faint px-2 py-1 rounded-full border border-surface-border bg-surface-raised">
        {label}
      </span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  )
}