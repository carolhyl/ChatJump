 import { createApp, nextTick } from 'vue'
 import LockPopover from '../components/LockPopover.vue'

 class LockDialogManager {
    constructor() {
        this.app = null
        this.instance = null
        this.container = null
    }

    ensureInitialized() {
        if (this.instance) return this.instance

        this.createContainer()
        this.mountComponent()

        return this.instance
    }

    createContainer() {
        if (this.container) return

        this.container = document.createElement('div')
        this.container.id = 'chatjump-lock-dialog-container'
        document.body.appendChild(this.container)
    }

    mountComponent() {
        this.app = createApp(LockPopover, {
            popoverId: 'chatjump-lock-dialog'
        })

        const mountedComponent = this.app.mount(this.container)
        this.instance = this.app._instance?.exposed || mountedComponent
    }

    async open(anchorElement) {
        if (!anchorElement) return

        const instance = this.ensureInitialized()

        if (instance?.openNearAnchor) {
            instance.openNearAnchor(anchorElement)
        } else {
            // Retry on next tick if component not fully ready
            await nextTick()
            const retryInstance = this.ensureInitialized()
            retryInstance?.openNearAnchor?.(anchorElement)
        }
    }

    destroy() {
        if (this.app) {
            this.app.unmount()
            this.app = null
            this.instance = null
        }

        if (this.container) {
            this.container.remove()
            this.container = null
        }
    }
}

export default LockDialogManager