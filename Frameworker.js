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
            this.#element.classList.add("selected")
        } else {
            this.#element.classList.remove("selected")
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
     *
     */
    value

    /**
     *
     * @param {HTMLElement} element
     */
    constructor(element) {
        this.#element = element
        this.value = ""
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
            read = () => he.checked = this.#valueToHTML(key)
        } else {
            const hex = (he instanceof HTMLInputElement || he instanceof HTMLSelectElement) ? he : new PseudoSelect(he)
            if(key in this.#htmlValueMapper && !(hex instanceof HTMLInputElement)) {
                const adder = hex instanceof HTMLSelectElement ? new SelectOptionsAdder(hex, this.#document) :
                    new PseudoSelectOptionsAdder(hex, this.#document)
                adder.addOptions(Object.entries(this.#htmlValueMapper[key].options))
                this.addEventListener(`update-options:${key}`, () => adder.addOptions(Object.entries(this.#htmlValueMapper[key].options)))
            }
            write = () => this.#storeHTMLValue(key, hex.value)
            read = () => hex.value = this.#valueToHTML(key)
        }

        read()
        this.addEventListener(`update:${key}`, read)
        he.addEventListener("change", write)
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
     * @param {string | number | boolean} value
     */
    #htmlToValue(key, value) {
        if(this.#htmlValueMapper[key]) {
            return this.#htmlValueMapper[key].options["" + value]
        } else {
            return value
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
     *
     * @param {string} key
     * @returns
     */
    #valueToHTML(key) {
        const value = this.#retainedData[key]
        if(this.#htmlValueMapper[key]) {
            for(const [k, v] of Object.entries(this.#htmlValueMapper[key].options)) {
                if(v === value) {
                    return k
                }
            }
        } else {
            return value
        }
    }

    /**
     * @param {{[k: string]: any}} retainedData
     * @param {Document} document
     * @param {Record<string, {options: Record<string, {name: string}>}>} htmlValueMapper
     */
    constructor(retainedData, document, htmlValueMapper) {
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

            this.addEventListener(`update:${triggerKey ?? key}`, () => he.textContent = this.#valueToHTML(key))
            he.textContent = this.#valueToHTML(key)
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