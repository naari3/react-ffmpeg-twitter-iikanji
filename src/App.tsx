import React, { ReactElement, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createFFmpeg } from '@ffmpeg/ffmpeg'
import './App.css'

function App(): ReactElement {
  const [taskStarted, setTaskStarted] = useState(false)
  const [videoSrc, setVideoSrc] = useState('')
  const [message, setMessage] = useState('Click Start to transcode')
  const [inputFile, setInputFile] = useState<null | File>(null)
  const [transcodeOption, setTranscodeOption] = useState(
    `-threads 8
-vf "pad=ceil(iw/2)*2:ceil(ih/2)*2"
-pix_fmt yuv420p
-strict experimental
-r 30
-acodec aac
-ar 44100 -ac 2
-vb 1024k
-minrate 1024k -maxrate 1024k -bufsize 1024k`
  )
  const [ext, setExt] = useState('mp4')
  const [latestLog, setLatestLog] = useState('')
  const [logs, setLogs] = useState<Array<string>>([])

  const doTranscode = async () => {
    setTaskStarted(true)
    const ffmpeg = createFFmpeg({
      log: true,
      logger: ({ message: logmsg }: { message: string }) => {
        setLatestLog(logmsg)
      },
    })
    setLogs([])
    setMessage('Loading ffmpeg-core.js')
    await ffmpeg.load()
    setMessage('Start transcoding...')
    const inputFilename = uuidv4()
    const outputFilename = `${uuidv4()}.${ext}`
    await ffmpeg.write(inputFilename, inputFile)
    await ffmpeg.transcode(
      inputFilename,
      outputFilename,
      transcodeOption.split('\n').join(' ')
    )
    setMessage(
      'Complete transcoding! If need more transcoding, you should reload this page'
    )
    const data = ffmpeg.read(outputFilename)
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: `video/${ext}` }))
    )
  }

  useEffect(() => {
    if (latestLog !== '') setLogs((l) => [...l, latestLog])
  }, [latestLog])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setInputFile(e.target.files[0])
  }

  return (
    <div className="App">
      <p />
      <video src={videoSrc} controls>
        <track kind="cap" />
      </video>
      <div>
        <label htmlFor="file">
          <input
            id="file"
            type="file"
            onChange={handleFile}
            disabled={taskStarted}
          />
        </label>
      </div>
      <br />
      <div>
        ffmpeg -i inputFile&nbsp;
        <textarea
          name=""
          className="transcode-option"
          cols={45}
          rows={10}
          value={transcodeOption}
          onChange={(e) => {
            setTranscodeOption(e.target.value)
          }}
        />
        &nbsp;outputFile.
        <input
          type="text"
          value={ext}
          onChange={(e) => {
            setExt(e.target.value)
          }}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={doTranscode}
          disabled={!inputFile || taskStarted}
        >
          Start
        </button>
      </div>
      <p>{message}</p>
      <pre>
        <code>{logs.map((log) => `${log}\n`)}</code>
      </pre>
    </div>
  )
}

export default App
