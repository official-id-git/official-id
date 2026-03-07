// Thin wrapper around sonner so we have a single import everywhere in the app
// Usage: import { showToast } from '@/hooks/useToast'
// showToast('Done!', 'success')
import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export function showToast(message: string, type: ToastType = 'info') {
    switch (type) {
        case 'success':
            toast.success(message)
            break
        case 'error':
            toast.error(message)
            break
        case 'warning':
            toast.warning(message)
            break
        case 'info':
        default:
            toast.info(message)
            break
    }
}
