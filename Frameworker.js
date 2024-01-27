//@ts-check

/**
 * @typedef {"beforeinit" | "init"} FrameworkerEventName
 */

/**
 *
 */
class PseudoSelectOption {
    /**
     *
     */
    #element

    /**
     *
     */
    #selectedStore = false

    /**
     *
     */
    value = ""

    /**
     *
     */
    get selected() {
        return this.#selectedStore

    }
    set selected(v) {
        if(v) {
            this.#element.dataset.selected = ""
        } else {
            delete this.#element.dataset.selected
        }
        this.#selectedStore = v
    }

    /**
     *
     */
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
        this.#element.dataset.pseudoOption = ""
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
    /**
     * @type {ReturnType<setTimeout> | undefined}
     */
    #changeTimeout

    #element

    /**
     * @type {{[event_name: string]: (() => any)[]}}
     */
    #eventListeners = {}

    /**
     * @type {PseudoSelectOption[]}
     */
    #options = []

    /**
     * @type {PseudoSelectOption | undefined}
     */
    #selectedStore

    /**
     *
     */
    #changed() {
        if(this.#changeTimeout) {
            clearTimeout(this.#changeTimeout)
        }
        this.#changeTimeout = setTimeout(() => {
            this.dispatchEvent(new Event("change"))
        }, 100)
    }

    /**
     * The DOM-like value
     */
    get value() {
        return this.#selected?.value ?? ""
    }
    set value(v) {
        if(v != this.value) {
            const s = this.#options.find(o => o.value == v)
            this.#selected = s
        }
    }

    /**
     *
     * @param {HTMLElement} element
     */
    constructor(element) {
        this.#element = element
    }

    /**
     *
     */
    get #selected() {
        return this.#selectedStore
    }
    set #selected(v) {
        if(this.#selectedStore) {
            this.#selectedStore.selected = false
        }
        this.#selectedStore = v
        if(v) {
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
        this.#options.push(option)
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
        this.#options = this.#options.filter(o => o !== option)
        option.removeFrom(this.#element)
        if(this.#selected === option) {
            this.#selected = undefined
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
     * @protected
     * @abstract
     * @returns {U}
     */
    createOption() {
        throw new Error("Not implemented")
    }

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
     * @param {[string, {name: string}][]} options
     */
    addOptions(options) {
        const value = this.#select.value
        for (const oldOption of this.#addedOptions) {
            this.#select.removeChild(oldOption)
        }
        this.#addedOptions = []
        for (const [k, v] of options) {
            const option = this.createOption()
            option.value = k
            option.textContent = v.name
            this.#addedOptions.push(option)
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
 * @abstract
 * @template V
 * @template {{name: string}} O
 */
class OptionSet {
    /**
     * @abstract
     * @type {Record<string, O>}
     */
    get options() {
        return {}
    }
    /**
     * @param {V} value
     * @returns {boolean | undefined}
     */
    booleanValue(value) {
        throw new Error("Not implemented")
    }
    /**
     * @param {V} value
     * @returns {string | undefined}
     */
    optionMatching(value) {
        throw new Error("Not implemented")
    }

    /**
     * @abstract
     * @param {string | boolean | number | undefined} htmlValue
     * @returns {V | undefined}
     */
    valueFor(htmlValue) {
        throw new Error("Not implemented")
    }
}

/**
 * @abstract
 * @template {{name: string}} V
 */
class OptionSetLiteralAny extends OptionSet {
    /**
     * @type {Record<string, V>}
     */
    get options() {
        throw new Error("Not implemented")
    }

    optionMatching(value) {
        for(const [k, v] of Object.entries(this.options)) {
            if(v === value) {
                return k
            }
        }
        return undefined
    }
    valueFor(htmlValue) {
        return this.options[htmlValue]
    }
}

/**
 * @template {{name: string}} V
 */
class OptionSetLiteral extends OptionSetLiteralAny {
    #options

    get options() {
        return this.#options
    }
    /**
     *
     * @param {Record<string, V>} options
     */
    constructor(options) {
        super()
        this.#options = options
    }
}

/**
 * @abstract
 * @template V
 */
class OptionSetMappedAny extends OptionSet {
    /**
     * @type {Record<string, {name: string, value: V}> | {name: string, value: V}[]}
     */
    get options() {
        throw new Error("Not implemented")
    }
    optionMatching(value) {
        for(const [k, v] of Object.entries(this.options)) {
            if(v.value === value) {
                return k
            }
        }
        return undefined
    }
    valueFor(htmlValue) {
        return this.options[htmlValue].value
    }
}

/**
 * @template V
 * @extends {OptionSetMappedAny<V>}
 */
class OptionSetMapped extends OptionSetMappedAny {
    #options

    get options() {
        return this.#options
    }
    /**
     *
     * @param {Record<string, {name: string, value: V}> | {name: string, value: V}[]} options
     */
    constructor(options) {
        super()
        this.#options = options
    }
}

/**
 * @template V
 * @typedef {Record<string, V & {name: string;}>} OptionSelection
 */

/**
 * @template V
 * @typedef {{options: OptionSelection<V>, optionType?: "map" | "raw";}} OptionSpec
 */

/**
 * @template V
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

    #htmlValueMapper

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
     *
     * @param {HTMLElement} he
     * @param {string} key
     */
    #connectInputRw(he, key) {
        /**
         * @type {() => *}
         */
        let read
        /**
         * @type {() => *}
         */
        let write
        if(he instanceof HTMLInputElement && he.type == "checkbox") {
            write = () => this.#storeHTMLValue(key, he.checked)
            read = () => {
                const b = this.#valueToBoolean(key)
                if(b !== undefined) {
                    he.checked = b
                }
            }
            he.addEventListener("change", write)
        } else {
            const hex = (he instanceof HTMLInputElement || he instanceof HTMLSelectElement) ? he : new PseudoSelect(he)
            if(key in this.#htmlValueMapper && !(hex instanceof HTMLInputElement)) {
                const adder = hex instanceof HTMLSelectElement ? new SelectOptionsAdder(hex, this.#document) :
                    new PseudoSelectOptionsAdder(hex, this.#document)
                adder.addOptions(Object.entries(this.#htmlValueMapper[key].options))
                this.addEventListener(`update-options:${key}`, () => adder.addOptions(Object.entries(this.#htmlValueMapper[key].options)))
            }
            write = () => this.#storeHTMLValue(key, hex.value)
            read = () => {
                const v = this.#valueToHTML(key)
                if(v !== undefined) {
                    hex.value = v
                }
            },
            hex.addEventListener("change", write)
        }

        read()
        this.addEventListener(`update:${key}`, read)
    }

    /**
     *
     * @param {HTMLElement} form
     * @param {string} dataKey
     * @param {string} [expr]
     * @returns {{he: HTMLElement, key: string}[]}
     */
    #findAnyElements(form, dataKey, expr) {
        const es = form.querySelectorAll(`${expr ?? ""}[data-${dataKey}]`)
        //@ts-ignore
        return [...es].map((e) => ({he: e, key: e.dataset[dataKey]}))
    }

    /**
     *
     * @param {string} key
     * @param {string | number | boolean} htmlValue
     * @returns {V | undefined}
     */
    #htmlToValue(key, htmlValue) {
        if(this.#htmlValueMapper[key]) {
            return this.#htmlValueMapper[key].valueFor(htmlValue)
        } else {
            return htmlValue
        }
    }

    /**
     *
     * @param {string} key
     * @param {string | number | boolean} value
     */
    #storeHTMLValue(key, value) {
        this.#retainedData[key] = this.#htmlToValue(key, value)
        this.dispatchEvent(new Event(`update:${key}`))
    }

    /**
     * Returns an HTML-compatible boolean value for the given key.
     *
     * @param {string} key
     * @returns
     */
    #valueToBoolean(key) {
        const value = this.#retainedData[key]
        if(this.#htmlValueMapper[key]) {
            return this.#htmlValueMapper[key].booleanValue(value)
        } else {
            return !!value
        }
    }

    /**
     * Returns an HTML-compatible value string for the given key.
     *
     * @param {string} key
     * @returns
     */
    #valueToHTML(key) {
        const value = this.#retainedData[key]
        if(this.#htmlValueMapper[key]) {
            return this.#htmlValueMapper[key].optionMatching(value)
        } else {
            return "" + value
        }
    }

    /**
     * @param {{[k: string]: V}} retainedData
     * @param {Document} document
     * @param {Record<string, OptionSet<V>>} htmlValueMapper
     */
    constructor(retainedData, document, htmlValueMapper = {}) {
        this.#retainedData = retainedData
        this.#document = document
        this.#htmlValueMapper = htmlValueMapper
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
     * Connects to the form.
     *
     * (input|select)[data-readwrite]: these get bidirectional data mapping
     * *[data-readwrite]: These get turned into a pseudo-select with options
     * *[data-read]: these get unidirectional data mapping (replacing
     * textContent). This may have data-read-trigger to announce what the actual
     * trigger for updating this value is.
     * *[data-call]: these trigger an action (click)
     *
     * @param {HTMLElement} form
     */
    init(form) {
        this.dispatchEvent(new Event("beforeinit"))

        for(const {he, key} of this.#findAnyElements(form, "readwrite")) {
            this.#assertKey(key)
            this.#connectInputRw(he, key)
        }

        for(const {he, key} of this.#findAnyElements(form, "read")) {
            this.#assertKey(key)

            const triggerKey = he.dataset["read-trigger"]
            this.#assertKey(triggerKey ?? key)

            this.addEventListener(`update:${triggerKey ?? key}`, () => he.textContent = this.#valueToHTML(key) ?? null)
            he.textContent = this.#valueToHTML(key) ?? null
        }

        for(const {he, key} of this.#findAnyElements(form, "call")) {
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
        this.#eventListeners[event_name] = this.#eventListeners[event_name]?.filter(
            v => v != handler
        )
    }
}