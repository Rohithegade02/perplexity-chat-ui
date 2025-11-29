import * as React from 'react'
import { FiGlobe, FiCpu, FiPaperclip, FiMic, FiVolume2 } from 'react-icons/fi'
import { IconButton } from './IconButton'

export const RightIconGroup = () => {
  return (
    <div className="flex items-center gap-1.5">
      <IconButton
        icon={<FiGlobe className="h-4 w-4" />}
        aria-label="Web search"
      />
      <IconButton icon={<FiCpu className="h-4 w-4" />} aria-label="AI mode" />
      <IconButton
        icon={<FiPaperclip className="h-4 w-4" />}
        aria-label="Attach file"
      />
      <IconButton
        icon={<FiMic className="h-4 w-4" />}
        aria-label="Voice input"
      />
      <IconButton
        icon={<FiVolume2 className="h-4 w-4" />}
        isActive={true}
        aria-label="Audio output"
      />
    </div>
  )
}
