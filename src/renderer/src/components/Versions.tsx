import { useState } from 'react'

function Versions(): JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className="versions">
      <li className="electron-version">Made by Wituz</li>
      <li className="chrome-version">Powered by ffmpeg</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions
