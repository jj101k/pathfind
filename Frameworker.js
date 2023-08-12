class Frameworker {
    /**
     * @type {Record<string, (() => any)[]}
     */
    #listeners = {}

    /**
     * @type {Record<string, any>}
     */
    #retainedData

    /**
     * @type {Record<string, any>}
     */
    constructor(retainedData) {
        this.#retainedData = retainedData
    }

    /**
     * @param {HTMLElement} form
     */
    init(form) {
        for(const e of form.querySelectorAll("[data-readwrite]")) {
            /**
             * @type {HTMLInputElement}
             */
            const he = e
            const key = he.dataset.readwrite
            this.#listeners[key] = this.#listeners[key] || []
            if(he.type == "checkbox") {
                he.onchange = function() {
                    this.#retainedData[key] = this.checked
                    for(const l of this.#listeners[key]) {
                        l()
                    }
                }
                he.checked = this.#retainedData[key]
            } else {
                he.onchange = function() {
                    this.#retainedData[key] = this.value
                    for(const l of this.#listeners[key]) {
                        l()
                    }
                }
                he.value = this.#retainedData[key]
            }
        }
        for(const e of form.querySelectorAll("[data-read]")) {
            /**
             * @type {HTMLElement}
             */
            const he = e
            const key = he.dataset.read
            this.#listeners[key] = this.#listeners[key] || []
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
            const key = he.dataset.call
            he.onclick = function() {
                this.#retainedData[key]()
            }
        }
    }
}