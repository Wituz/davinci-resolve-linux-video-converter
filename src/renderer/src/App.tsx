import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

function App(): JSX.Element {
  const [hasFfmpeg, setHasFfmpeg] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // Check for ffmpeg version
  useEffect(() => {
    const getFFmpegVersion = async () => {
      try {
        await window.electron.ipcRenderer.invoke('get-ffmpeg-version')
        setHasFfmpeg(true)
      } catch (error) {
        setHasFfmpeg(false)
      }
    }
    getFFmpegVersion()
  }, [])

  // Dropzone callback
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filePaths = acceptedFiles.map(file => file.path)
    setIsConverting(true)
    try {
      await window.electron.ipcRenderer.invoke('convert', JSON.stringify(filePaths))
    } finally {
      setIsConverting(false)
    }
  }, [])

  // Dropzone
  const {getRootProps, getInputProps} = useDropzone({onDrop})

  return (
      hasFfmpeg ? (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div style={{textAlign: 'center'}}>
            <img alt="logo" className="logo" src={electronLogo} />
          </div>
          <div className="text">
            Drag and drop <span className="ts">video files</span> here
          </div>
          { isConverting && <div className="text">Converting...</div> }
          { !isConverting && <>
            <p className="tip">
              They will be converted to .mkv, supported by DaVinci Resolve on Linux
            </p>
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center'}}>
              <div className="actions">
                <div className="action">
                  <a>
                    Browse files
                  </a>
                </div>
              </div>
            </div>  
          </>}
          <Versions></Versions>
        </div>
      ) : (
        <>
          <div style={{textAlign: 'center'}}>
            </div>
            <div className="text">
              ffmpeg <span className="ts">not found</span> on your system
            </div>
            <p className="tip">
              Please install ffmpeg and make sure it is in your path<br />
              <p>Restart this once installed</p>
              <br />
              Ubuntu/debian: <span style={{fontFamily: 'monospace'}}>sudo apt install ffmpeg</span><br />
              Arch: <span style={{fontFamily: 'monospace'}}>sudo pacman -S ffmpeg</span><br />
              Fedora: <span style={{fontFamily: 'monospace'}}>sudo dnf install ffmpeg</span><br />
            </p>
            <Versions></Versions>
        </>
      )
  )
}

export default App
