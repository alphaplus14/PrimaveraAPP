import { formatPrecioInput } from '../../lib/precios'

export default function InputPrecioCOP({
  value,
  onChange,
  placeholder,
  className = '',
  sospechoso = false,
  ...rest
}) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    onChange(digits === '' ? '' : formatPrecioInput(digits))
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${className} ${
        sospechoso ? 'border-amber-400 bg-amber-50 ring-amber-200' : ''
      }`}
      {...rest}
    />
  )
}
