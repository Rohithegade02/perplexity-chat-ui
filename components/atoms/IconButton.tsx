import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode
    isActive?: boolean
    variant?: 'default' | 'grouped'
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        { className, icon, isActive = false, variant = 'default', ...props },
        ref
    ) => {
        return (
            <Button
                ref={ref}
                className={cn(
                    'flex items-center justify-center transition-colors rounded-md',
                    variant === 'grouped'
                        ? 'h-7 w-7 hover:bg-accent/50'
                        : 'h-9 w-9 hover:bg-accent',
                    isActive &&
                    'bg-[oklch(55.27%_.086_208.61/1)] text-white hover:bg-[oklch(55.27%_.086_208.61/1)]',
                    !isActive && 'text-muted-foreground hover:text-foreground',
                    className
                )}
                {...props}
                variant='outline'
            >
                {icon}
            </Button>
        )
    }
)

IconButton.displayName = 'IconButton'
