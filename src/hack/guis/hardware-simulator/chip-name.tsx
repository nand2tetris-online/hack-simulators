export type ChipNameProps = {
  name: string | null
}

export function ChipName({ name }: ChipNameProps) {
  return (<div>Chip Name: {name}</div>)
}
