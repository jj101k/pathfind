/**
 *
 */
class Frameworker {
    /**
     * @type {{[k: string]: (() => any)[]}}
     */
    #listeners = {}

    /**
     * @type {{[k: string]: any}}
     */
    #retainedData

    /**
     * @type {{[k: string]: any}}
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
            /**
             * @type {string}
             */
            const key = he.dataset.readwrite
            this.#listeners[key] = this.#listeners[key] || []
            if(he.type == "checkbox") {
                he.onchange = () => {
                    this.#retainedData[key] = he.checked
                    for(const l of this.#listeners[key]) {
                        l()
                    }
                }
                he.checked = this.#retainedData[key]
            } else {
                he.onchange = () => {
                    this.#retainedData[key] = he.value
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
            /**
             * @type {string}
             */
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
            /**
             * @type {string}
             */
            const key = he.dataset.call
            he.onclick = () => {
                this.#retainedData[key]()
            }
        }
    }
}