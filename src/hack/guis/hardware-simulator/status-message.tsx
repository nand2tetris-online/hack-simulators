export type StatusMessageProps = {
  status: string | null
}

export function StatusMessage({ status }: StatusMessageProps) {
  return (<div>{status}</div>)
}
