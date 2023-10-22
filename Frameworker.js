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
    }

    /**
     * @type {{[k: string]: any}}
     */
    constructor(retainedData) {
        this.#retainedData = retainedData
    }

    /**
     *
     * @param {FrameworkerEventName | string} event_name
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
            this.#assertKey(options)
            const document = se.ownerDocument

            /**
             * @type {HTMLOptionElement[]}
             */
            let addedOptions = []

            const addOptions = () => {
                const value = se.value
                for(const oldOption of addedOptions) {
                    se.removeChild(oldOption)
                }
                addedOptions = []
                for(const [k, v] of this.#optionKeyValues(options)) {
                    const option = document.createElement("option")
                    option.value = k
                    option.textContent = v.name
                    addedOptions.push(option)
                    se.append(option)
                }
                se.value = value
            }
            addOptions()
            this.addEventListener(`update:${options}`, () => addOptions())
        }
        for(const e of form.querySelectorAll("fieldset[data-options]")) {
            /**
             * @type {HTMLFieldSetElement}
             */
            const fe = e
            /**
             * @type {string}
             */
            const options = fe.dataset.options
            this.#assertKey(options)
            const document = fe.ownerDocument
            const name = "" + Math.random()

            /**
             * @type {HTMLLabelElement[]}
             */
            let addedOptions = []
            const addOptions = () => {
                /**
                 * @type {string | undefined}
                 */
                let oldValue
                for(const oldOption of addedOptions) {
                    /**
                     * @type {HTMLInputElement | null}
                     */
                    const input = oldOption.querySelector("input")
                    if(input?.checked) {
                        oldValue = input.value
                    }
                    if(oldOption.querySelector("input")?.selected)
                    fe.removeChild(oldOption)
                }
                addedOptions = []
                for(const [k, v] of this.#optionKeyValues(options)) {
                    const input = document.createElement("input")
                    input.type = "radio"
                    input.name = name
                    input.value = k
                    input.textContent = v.name
                    if(oldValue === k) {
                        input.checked = true
                    }
                    const label = document.createElement("label")
                    label.append(input)
                    label.append(" " + v.name)
                    addedOptions.push(label)
                    fe.append(label)
                }
            }
            addOptions()
            this.addEventListener(`update:${options}`, () => addOptions())
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
                    this.addEventListener(`update:${key}`, () => {
                        ie.checked = (this.#retainedData[key] == this.#retainedData[optionsKey][ie.value])
                        if(ie.value) {
                            hle.classList.add("selected")
                        } else {
                            hle.classList.remove("selected")
                        }
                    })
                }
            }
        }
        for(const e of form.querySelectorAll("input[data-readwrite], select[data-readwrite]")) {
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
                this.addEventListener(`update:${key}`, () => he.checked = this.#retainedData[key])
            } else if(he.dataset.options) {
                // <select>
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

                this.addEventListener(`update:${key}`, updateValue)
            } else {
                he.addEventListener("change", () => {
                    this.#retainedData[key] = he.value
                })
                he.value = this.#retainedData[key]
                this.addEventListener(`update:${key}`, () => he.value = this.#retainedData[key])
            }
            he.addEventListener("change", () => this.dispatchEvent(new Event(`update:${key}`)))
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
            this.addEventListener(`update:${triggerKey}`, () => he.textContent = this.#retainedData[key])
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
     * @param {FrameworkerEventName | string} event_name
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