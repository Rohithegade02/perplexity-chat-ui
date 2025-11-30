import { FiSearch, FiShare2 } from 'react-icons/fi'
import React from 'react'
import { IconButton } from '@/components/atoms'

export const LeftIconGroup = React.memo(() => {
    return (
        <div className="flex items-center gap-0.5 rounded-lg  bg-muted/30 px-1 py-1">
            <IconButton
                icon={<FiSearch className="h-4 w-4" />}
                isActive={true}
                variant="grouped"
                aria-label="Search mode"
            />
            <IconButton
                icon={<FiShare2 className="h-4 w-4" />}
                variant="grouped"
                aria-label="Share"
            />
        </div>
    )
})
LeftIconGroup.displayName = 'LeftIconGroup'