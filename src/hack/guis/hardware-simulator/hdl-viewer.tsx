export type HDLViewerProps = {
  hdl: string | null
}

export function HDLViewer({ hdl }: HDLViewerProps) {
  return (<div className="hdlViewer"><pre>{hdl}</pre></div>)
}
