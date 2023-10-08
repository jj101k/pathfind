//@ts-check

/**
 * @typedef {"beforeinit" | "init"} FrameworkerEventName
 */

/**
 *
 */
class Frameworker {
    /**
     * This modifies `o` to proxy `f[k]` for `ks`, similar for `mapped` but with
     * different names, and properly proxy methods `methods`.
     *
     * You can safely do this multiple times, but old names will be overwritten.
     *
     * @template T
     * @param {Object} o
     * @param {T} f
     * @param {(keyof T)[]} ks
     * @param {Partial<Record<keyof T, string>>} mapped
     * @param {(keyof f)[]} methods
     */
    static proxy(o, f, ks, mapped = {}, methods = []) {
        for(const k of ks) {
            Object.defineProperty(o, k, {
                get: () => f[k],
                set(v) {
                    f[k] = v
                },
            })
        }
        for(const [k, ok] of Object.entries(mapped)) {
            Object.defineProperty(o, ok, {
                get: () => f[k],
                set(v) {
                    f[k] = v
                },
            })
        }
        for(const m of methods) {
            const c = f[m]
            if(typeof c != "function") {
                throw new Error(`Property ${m.toString()} is not a method`)
            }
            Object.defineProperty(o, m, {
                get: () => c.bind(f),
            })
        }
    }
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
     *
     * @param {string} key
     * @returns
     */
    #optionKeyValues(key) {
        return Object.entries(this.#retainedData[key])
    }

    /**
     * Connects to the form.
     *
     * *[data-readwrite]: these get bidirectional data mapping
     * *[data-read]: these get unidirectional data mapping (replacing textContent)
     * *[data-call]: these trigger an action (click)
     * select[data-options]: These get options from the supplied key-value property
     *
     * @param {HTMLElement} form
     */
    init(form) {
        this.dispatchEvent(new Event("beforeinit"))
        for(const e of form.querySelectorAll("select[data-options]")) {
            /**
             * @type {HTMLSelectElement}
             */
            const se = e
            /**
             * @type {string}
             */
            const options = se.dataset.options
            const document = se.ownerDocument
            for(const [k, v] of this.#optionKeyValues(options)) {
                const option = document.createElement("option")
                option.value = k
                option.textContent = v.name
                se.append(option)
            }
        }
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
                this.#listeners[key].push(
                    () => he.checked = this.#retainedData[key]
                )
            } else if(he.dataset.options) {
                const optionsKey = he.dataset.options
                // Options mode - rewrite.
                he.addEventListener("change", () => {
                    this.#retainedData[key] = this.#retainedData[optionsKey][he.value]
                })
                const updateValue = () => {
                    for(const [k, v] of this.#optionKeyValues(optionsKey)) {
                        if(v === this.#retainedData[key]) {
                            he.value = k
                            break
                        }
                    }
                }
                updateValue()

                this.#listeners[key].push(updateValue)
            } else {
                he.addEventListener("change", () => {
                    this.#retainedData[key] = he.value
                })
                he.value = this.#retainedData[key]
                this.#listeners[key].push(
                    () => he.value = this.#retainedData[key]
                )
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