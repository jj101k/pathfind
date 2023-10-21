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
     * *[data-read]: these get unidirectional data mapping (replacing
     * textContent). This may have data-read-trigger to announce what the actual
     * trigger for updating this value is.
     * *[data-call]: these trigger an action (click)
     * select[data-options]: These get options from the supplied key-value property
     * fieldset[data-options]: These get radio inputs from the supplied key-value property
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
        for(const e of form.querySelectorAll("fieldset[data-options]")) {
            /**
             * @type {HTMLSelectElement}
             */
            const se = e
            /**
             * @type {string}
             */
            const options = se.dataset.options
            const document = se.ownerDocument
            const name = "" + Math.random()
            for(const [k, v] of this.#optionKeyValues(options)) {
                const input = document.createElement("input")
                input.type = "radio"
                input.name = name
                input.value = k
                input.textContent = v.name
                const label = document.createElement("label")
                label.append(input)
                label.append(" " + v.name)
                se.append(label)
            }
        }
        for(const e of form.querySelectorAll("fieldset[data-readwrite]")) {
            /**
             * @type {HTMLFieldSetElement}
             */
            const he = e
            /**
             * @type {string}
             */
            const key = he.dataset.readwrite
            this.#assertKey(key)
            /**
             * @type {string}
             */
            const optionsKey = he.dataset.options
            this.#assertKey(optionsKey)
            for(const le of he.querySelectorAll("label")) {
                /**
                 * @type {HTMLLabelElement}
                 */
                const hle = le
                const ie = hle.querySelector("input")
                if(ie instanceof HTMLInputElement) {
                    he.addEventListener("change", () => {
                        if(ie.checked) {
                            this.#retainedData[key] = this.#retainedData[optionsKey][ie.value]
                            hle.classList.add("selected")
                        } else {
                            hle.classList.remove("selected")
                        }
                    })
                    ie.checked = (this.#retainedData[key] == this.#retainedData[optionsKey][ie.value])
                    if(ie.checked) {
                        hle.classList.add("selected")
                    } else {
                        hle.classList.remove("selected")
                    }
                    this.#listeners[key].push(
                        () => {
                            ie.checked = (this.#retainedData[key] == this.#retainedData[optionsKey][ie.value])
                            if(ie.value) {
                                hle.classList.add("selected")
                            } else {
                                hle.classList.remove("selected")
                            }
                        }
                    )
                }
            }
        }
        for(const e of form.querySelectorAll("input[data-readwrite]")) {
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
            const triggerKey = he.dataset["read-trigger"] ?? key
            this.#assertKey(triggerKey)
            this.#listeners[triggerKey].push(
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