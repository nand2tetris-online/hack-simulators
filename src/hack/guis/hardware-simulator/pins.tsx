import { useCallback } from "react"
import { PinData, PinUpdate } from "."
import { PinType } from "../../gates/gateclass"

export type PinsProps = {
  title: string
  type: PinType
  pinData: PinData[]
  updatePin: (data: PinUpdate) => void
}

export function Pins({ title, type, pinData, updatePin }: PinsProps) {
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
            return (<tr key={i}>
                    <td>{name}</td>
                    <td><input value={value} onChange={(e) => onChange(e.target.value, i, type)} /></td>
                    </tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}
