/**
 * @typedef {"beforeinit" | "init"} FrameworkerEventName
 */

/**
 *
 */
class Frameworker {
    /**
     * @type {{[event_name: string]: (() => any)[]}}
     */
    #eventListeners = {}

    /**
     * @type {{[k: string]: (() => any)[]}}
     */
    #listeners = {}

    /**
     * @type {{[k: string]: any}}
     */
    #retainedData

    /**
     *
     * @param {string} key
     */
    #assertKey(key) {
        if(!(key in this.#retainedData)) {
            console.warn(`Key ${key} isn't recognised`)
        }
        this.#listeners[key] = this.#listeners[key] || []
    }

    /**
     * @type {{[k: string]: any}}
     */
    constructor(retainedData) {
        this.#retainedData = retainedData
    }

    /**
     *
     * @param {FrameworkerEventName} event_name
     * @param {() => any} handler
     */
    addEventListener(event_name, handler) {
        this.#eventListeners[event_name] = this.#eventListeners[event_name] || []
        this.#eventListeners[event_name].push(handler)
    }

    /**
     *
     * @param {Event} event
     */
    dispatchEvent(event) {
        if(this.#eventListeners[event.type]) {
            for(const l of this.#eventListeners[event.type]) {
                l.call(this.#retainedData)
            }
        }
    }

    /**
     * @param {HTMLElement} form
     */
    init(form) {
        this.dispatchEvent(new Event("beforeinit"))
        for(const e of form.querySelectorAll("[data-readwrite]")) {
            /**
             * @type {HTMLInputElement}
             */
            const he = e
            /**
             * @type {string}
             */
            const key = he.dataset.readwrite
            this.#assertKey(key)
            if(he.type == "checkbox") {
                he.addEventListener("change", () => {
                    this.#retainedData[key] = he.checked
                })
                he.checked = this.#retainedData[key]
            } else {
                he.addEventListener("change", () => {
                    this.#retainedData[key] = he.value
                })
                he.value = this.#retainedData[key]
            }
            he.addEventListener("change", () => {
                for(const l of this.#listeners[key]) {
                    l()
                }
            })
        }
        for(const e of form.querySelectorAll("[data-read]")) {
            /**
             * @type {HTMLElement}
             */
            const he = e
            /**
             * @type {string}
             */
            const key = he.dataset.read
            this.#assertKey(key)
            this.#listeners[key].push(
                () => he.textContent = this.#retainedData[key]
            )
            he.textContent = this.#retainedData[key]
        }

        for(const e of form.querySelectorAll("[data-call]")) {
            /**
             * @type {HTMLButtonElement}
             */
            const he = e
            /**
             * @type {string}
             */
            const key = he.dataset.call
            he.addEventListener("click", () => {
                this.#retainedData[key]()
            })
        }
        this.dispatchEvent(new Event("init"))
    }

    /**
     *
     * @param {FrameworkerEventName} event_name
     * @param {() => any} handler
     */
    removeEventListener(event_name, handler) {
        if(this.#eventListeners[event_name]) {
            this.#eventListeners[event_name] = this.#eventListeners[event_name].filter(
                v => v != handler
            )
        }
    }
}