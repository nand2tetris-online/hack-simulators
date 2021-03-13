export type StatusMessageProps = {
  status: string | null
}

export function StatusMessage({ status }: StatusMessageProps) {
  return (<div className="statusMessage">{status}</div>)
}
