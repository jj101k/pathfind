//@ts-check

/**
 * @typedef {"beforeinit" | "init"} FrameworkerEventName
 */

/**
 *
 */
class PseudoSelectOption {
    #element

    #selectedStore = false

    value = ""

    get selected() {
        return this.#selectedStore

    }
    set selected(v) {
        if(v) {
            this.#element.classList.add("selected")
        } else {
            this.#element.classList.remove("selected")
        }
        this.#selectedStore = v
    }
    get textContent() {
        return this.#element.textContent
    }

    set textContent(v) {
        this.#element.textContent = v
    }

    /**
     *
     * @param {Document} document
     */
    constructor(document) {
        this.#element = document.createElement("div")
        this.#element.dataset["pseudo-option"] = ""
    }

    /**
     *
     * @param {string} event_name
     * @param {() => any} handler
     */
    addEventListener(event_name, handler) {
        return this.#element.addEventListener(event_name, handler)
    }

    /**
     *
     * @param {HTMLElement} e
     */
    appendTo(e) {
        e.append(this.#element)
    }

    /**
     *
     * @param {HTMLElement} e
     */
    removeFrom(e) {
        e.removeChild(this.#element)
    }
}

/**
 *
 */
class PseudoSelect {
    #element

    /**
     * @type {{[event_name: string]: (() => any)[]}}
     */
    #eventListeners = {}

    #changeTimeout

    /**
     * @type {PseudoSelectOption | undefined}
     */
    #selectedStore

    #changed() {
        if(this.#changeTimeout) {
            clearTimeout(this.#changeTimeout)
        }
        this.#changeTimeout = setTimeout(() => {
            this.dispatchEvent(new Event("change"))
        }, 100)
    }

    value

    /**
     *
     * @param {HTMLElement} element
     */
    constructor(element) {
        this.#element = element
        this.value = ""
    }

    get #selected() {
        return this.#selectedStore
    }
    set #selected(v) {
        if(this.#selectedStore) {
            this.#selectedStore.selected = false
        }
        this.#selectedStore = v
        if(v) {
            this.value = v.value
            v.selected = true
        }
        this.#changed()
    }

    /**
     *
     * @param {string} event_name
     * @param {() => any} handler
     */
    addEventListener(event_name, handler) {
        this.#eventListeners[event_name] = this.#eventListeners[event_name] || []
        this.#eventListeners[event_name].push(handler)
    }

    /**
     *
     * @param {PseudoSelectOption} option
     */
    append(option) {
        option.addEventListener("click", () => this.#selected = option)
        option.appendTo(this.#element)
    }

    /**
     *
     * @param {Event} event
     */
    dispatchEvent(event) {
        if(this.#eventListeners[event.type]) {
            for(const l of this.#eventListeners[event.type]) {
                l.call(this)
            }
        }
    }

    /**
     *
     * @param {PseudoSelectOption} option
     */
    removeChild(option) {
        option.removeFrom(this.#element)
        if(this.#selected === option) {
            this.value = ""
        }
    }
}

/**
 * @abstract
 * @template {{append(u: U): any, value: string, removeChild(u: U): any}} T
 * @template {PseudoSelectOption | HTMLOptionElement} U
 */
class AnySelectOptionsAdder {
    /**
     * @type {U[]}
     */
    #addedOptions = []

    #select

    /**
     * @protected
     */
    document

    /**
     *
     * @param {T} s
     * @param {Document} document
     */
    constructor(s, document) {
        this.#select = s
        this.document = document
    }
    /**
     * @protected
     * @abstract
     * @returns {U}
     */
    createOption() {
        throw new Error("Not implemented")
    }

    /**
     * @param {[string, {name: string}][]} options
     */
    addOptions(options) {
        const value = this.#select.value
        for (const oldOption of this.#addedOptions) {
            this.#select.removeChild(oldOption)
        }
        this.addedOptions = []
        for (const [k, v] of options) {
            const option = this.createOption()
            option.value = k
            option.textContent = v.name
            this.addedOptions.push(option)
            this.#select.append(option)
        }
        this.#select.value = value
    }
}

/**
 * @extends {AnySelectOptionsAdder<HTMLSelectElement, HTMLOptionElement>}
 */
class SelectOptionsAdder extends AnySelectOptionsAdder {
    createOption() {
        return this.document.createElement("option")
    }
}

/**
 * @extends {AnySelectOptionsAdder<PseudoSelect, PseudoSelectOption>}
 */
class PseudoSelectOptionsAdder extends AnySelectOptionsAdder {
    createOption() {
        return new PseudoSelectOption(this.document)
    }
}

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

    #document

    /**
     * @type {{[event_name: string]: (() => any)[]}}
     */
    #eventListeners = {}

    #retainedData

    /**
     *
     */
    #x = {
        /**
         * @type {{he: HTMLSelectElement | PseudoSelect, options: string}[]}
         */
        selectOptions: [],
        /**
         * @type {{he: HTMLInputElement, key: string}[]}
         */
        inputRw: [],
        /**
         * @type {{he: HTMLSelectElement | PseudoSelect, key: string, optionsKey: string | undefined}[]}
         */
        selectRw: [],
        /**
         * @type {{he: HTMLElement, key: string, triggerKey: string | undefined}[]}
         */
        read: [],
        /**
         * @type {{he: HTMLButtonElement, key: string}[]}
         */
        call: [],
    }

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
     * @param {{[k: string]: any}} retainedData
     * @param {Document} document
     */
    constructor(retainedData, document) {
        this.#retainedData = retainedData
        this.#document = document
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
     *
     * @template T
     * @param {any} e
     * @param {T} t
     * @returns {InstanceType<T>}
     */
    #assertHtmlElement(e, t) {
        //@ts-ignore
        if(e instanceof t) {
            return e
        } else {
            throw new Error(`Internal type error: not HTML element`)
        }
    }

    /**
     *
     * @param {HTMLElement} e
     * @param {string} key
     */
    #assertDatum(e, key) {
        const v = e.dataset[key]
        if(v === undefined) {
            throw new Error(`Internal type error: not string`)
        }
        return v
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
     * *[data-options]: These get turned into a pseudo-select with options from the supplied key-value property
     *
     * @param {HTMLElement} form
     */
    init(form) {
        this.dispatchEvent(new Event("beforeinit"))

        for(const e of form.querySelectorAll("select[data-options]")) {
            const se = this.#assertHtmlElement(e, HTMLSelectElement)
            const options = this.#assertDatum(se, "options")
            this.#assertKey(options)

            this.#x.selectOptions.push({he: se, options})
        }

        for(const e of form.querySelectorAll("[data-options]:not(select)")) {
            const he = this.#assertHtmlElement(e, HTMLElement)
            const options = this.#assertDatum(he, "options")
            this.#assertKey(options)

            const ps = new PseudoSelect(he)
            this.#x.selectOptions.push({he: ps, options: options})
            const key = he.dataset.readwrite
            if(key) {
                this.#assertKey(key)
                this.#x.selectRw.push({he: ps, key, optionsKey: options})
            }
        }

        for(const e of form.querySelectorAll("input[data-readwrite]")) {
            const he = this.#assertHtmlElement(e, HTMLInputElement)
            const key = this.#assertDatum(he, "readwrite")
            this.#assertKey(key)
            this.#x.inputRw.push({key, he})
        }

        for(const e of form.querySelectorAll("select[data-readwrite]")) {
            const he = this.#assertHtmlElement(e, HTMLSelectElement)
            const key = this.#assertDatum(he, "readwrite")
            this.#assertKey(key)

            // Detect change
            const optionsKey = he.dataset.options
            this.#assertKey(optionsKey ?? key)

            this.#x.selectRw.push({he, key, optionsKey})
        }

        for(const e of form.querySelectorAll("[data-read]")) {
            const he = this.#assertHtmlElement(e, HTMLElement)
            const key = this.#assertDatum(he, "read")
            this.#assertKey(key)

            const triggerKey = he.dataset["read-trigger"]
            this.#assertKey(triggerKey ?? key)
            this.#x.read.push({he, key, triggerKey})
        }

        for(const e of form.querySelectorAll("[data-call]")) {
            const he = this.#assertHtmlElement(e, HTMLButtonElement)
            const key = this.#assertDatum(he, "call")
            this.#x.call.push({he, key})
        }

        this.#addSelectOptions()
        this.#addSelectRw()
        this.#addInputRw()
        this.#addRead()
        this.#addCall()

        this.dispatchEvent(new Event("init"))
    }

    /**
     *
     */
    #addCall() {
        const pendingCallElements = this.#x.call
        this.#x.call = []
        for (const { he, key } of pendingCallElements) {
            he.addEventListener("click", () => {
                this.#retainedData[key]()
            })
        }
    }

    /**
     *
     */
    #addRead() {
        const readElements = this.#x.read
        this.#x.read = []
        for (const { he, key, triggerKey } of readElements) {
            this.addEventListener(`update:${triggerKey ?? key}`, () => he.textContent = this.#retainedData[key])
            he.textContent = this.#retainedData[key]
        }
    }

    /**
     *
     */
    #addInputRw() {
        const inputRwElements = this.#x.inputRw
        this.#x.inputRw = []
        for (const { he, key } of inputRwElements) {
            // Detect change
            he.addEventListener("change", (evt) => {
                const te = evt.target
                if (!(te instanceof HTMLInputElement)) {
                    return
                }
                if (te.type == "checkbox") {
                    this.#retainedData[key] = te.checked
                } else {
                    this.#retainedData[key] = te.value
                }
                console.log("Sending", `update:${key}`)
                this.dispatchEvent(new Event(`update:${key}`))
            })

            if (he.type == "checkbox") {
                he.checked = this.#retainedData[key]
                this.addEventListener(`update:${key}`, () => he.checked = this.#retainedData[key])
            } else {
                he.value = this.#retainedData[key]
                this.addEventListener(`update:${key}`, () => he.value = this.#retainedData[key])
            }
        }
    }

    /**
     *
     */
    #addSelectRw() {
        const selectRwElements = this.#x.selectRw
        this.#x.selectRw = []
        for (const { he, key, optionsKey } of selectRwElements) {
            he.addEventListener("change", () => {
                this.#retainedData[key] = optionsKey ? this.#retainedData[optionsKey][he.value] : he.value
                console.log("Sending", `update:${key}`)
                this.dispatchEvent(new Event(`update:${key}`))
            })

            if (optionsKey) {
                const updateValue = () => {
                    for (const [k, v] of this.#optionKeyValues(optionsKey)) {
                        if (v === this.#retainedData[key]) {
                            he.value = k
                            break
                        }
                    }
                }
                updateValue()

                this.addEventListener(`update:${key}`, updateValue)
            } else {
                he.value = this.#retainedData[key]
                this.addEventListener(`update:${key}`, () => he.value = this.#retainedData[key])
            }
        }
    }

    /**
     *
     */
    #addSelectOptions() {
        const selectOptionElements = this.#x.selectOptions
        this.#x.selectOptions = []
        for (const { he: se, options } of selectOptionElements) {
            const adder = se instanceof HTMLSelectElement ? new SelectOptionsAdder(se, this.#document) :
                new PseudoSelectOptionsAdder(se, this.#document)
            adder.addOptions(this.#optionKeyValues(options))
            this.addEventListener(`update:${options}`, () => adder.addOptions(this.#optionKeyValues(options)))
        }
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