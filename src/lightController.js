export class LightController {
    constructor(light) {
        this.light = light;
        this.form = document.createElement("div");
    }

    /**
     * 
     * @param {HTMLElement} parent 
     */
    appendToElement(parent) {
        parent.appendChild(this.form);
    }
}
