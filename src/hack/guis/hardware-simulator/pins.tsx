import { useCallback } from "react"
import { PinData, PinUpdate } from "."
import { PinType } from "../../gates/gateclass"

export type PinsProps = {
  title: string
  type: PinType
  pinData: PinData[]
  updatePin: (data: PinUpdate) => void
  format: string
}

export function Pins({ title, type, pinData, updatePin, format }: PinsProps) {
  const onChange = useCallback((value: string, number: number, type: PinType) => {
    updatePin({ value, number, type })
  }, [updatePin])

  return (
    <div className="pins">
      <h3>{title}</h3>
      <table>
        <tbody>
          {pinData.map((data, i) => {
            const { name, value } = data
            const displayValue = type === PinType.INPUT ? value : formatValue(value, format)
            return (<tr key={i}>
                    <td>{name}</td>
                    <td><input value={displayValue} onChange={(e) => onChange(e.target.value, i, type)} /></td>
                    </tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}

export function formatValue(value: string, format: string): string {
  const int = parseInt(value) ?? 0
  switch (format) {
    case "binary":
      return int.toString(2)
    case "hexadecimal":
      return int.toString(16)
    default:
      return int.toString()
  }
}
