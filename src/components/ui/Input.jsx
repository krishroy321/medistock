import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const field =
  'w-full rounded-xl border border-line bg-surface text-sm text-fg placeholder:text-subtle shadow-[0_1px_2px_rgb(16_24_22/0.04)] transition-colors duration-150 hover:border-line-strong focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:opacity-60'

function FieldWrap({ label, hint, error, id, className, children, required }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-subtle">{hint}</p>
      )}
    </div>
  )
}

/**
 * Input with optional label, leading icon, hint and error.
 */
export const Input = forwardRef(function Input({ label, hint, error, icon: Icon, className, inputClassName, id, size = 'md', required, ...props }, ref) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <FieldWrap label={label} hint={hint} error={error} id={inputId} className={className} required={required}>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          className={cn(field, size === 'sm' ? 'h-9' : 'h-10', Icon ? 'pl-9 pr-3' : 'px-3', error && 'border-red-400', inputClassName)}
          {...props}
        />
      </div>
    </FieldWrap>
  )
})

/**
 * Native select (fully accessible) styled to match the design system.
 * @param options [{ value, label }] or string[]
 */
export const Select = forwardRef(function Select({ label, hint, error, options = [], className, selectClassName, id, size = 'md', icon: Icon, ...props }, ref) {
  const autoId = useId()
  const selectId = id || autoId
  return (
    <FieldWrap label={label} hint={hint} error={error} id={selectId} className={className}>
      <div className="relative">
        {Icon && <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />}
        <select
          ref={ref}
          id={selectId}
          className={cn(field, 'cursor-pointer appearance-none pr-9', Icon ? 'pl-9' : 'pl-3', size === 'sm' ? 'h-9' : 'h-10', selectClassName)}
          {...props}
        >
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            )
          })}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
      </div>
    </FieldWrap>
  )
})

export const Textarea = forwardRef(function Textarea({ label, hint, error, className, id, ...props }, ref) {
  const autoId = useId()
  const tid = id || autoId
  return (
    <FieldWrap label={label} hint={hint} error={error} id={tid} className={className}>
      <textarea ref={ref} id={tid} className={cn(field, 'min-h-[88px] px-3 py-2.5')} {...props} />
    </FieldWrap>
  )
})

export default Input
