export class LightController {
    constructor(light) {
        this.light = light;
        this.form = document.createElement("div");

        this.colorSelector = document.createElement("input");
        this.colorSelector.setAttribute("type", "color");
        this.colorSelector.defaultValue = "#020202";
        this.colorSelector.setAttribute("list", "");

        this.form.appendChild(document.createTextNode("Color"));
        this.form.appendChild(this.colorSelector);
        this.form.appendChild(document.createElement("br"));

        this.translateX = this.addRangeNode("Translate X", 0, 10, -10, 0.1);
        this.translateY = this.addRangeNode("Translate Y", 0, 10, -10, 0.1);
        this.translateZ = this.addRangeNode("Translate Z", 0, 10, -10, 0.1);
        this.form.appendChild(document.createTextNode("Translate Unit"));
        this.translateUnit = document.createElement("input");
        this.translateUnit.setAttribute("type", "number");
        this.translateUnit.setAttribute("value", "10");
        this.translateUnit.setAttribute("step", "any");
        this.form.appendChild(this.translateUnit);

        this.translateX.oninput = this.translateY.oninput = this.translateZ.oninput = this.translateUnit.oninput = this.colorSelector.oninput = () => this.updateLight();
    }

    /**
     * 
     * @param {HTMLElement} parent 
     */
    appendToElement(parent) {
        parent.appendChild(this.form);
    }

    updateLight() {
        let translateUnit = Number.parseFloat(this.translateUnit.value);
        this.light.position[0] = Number.parseFloat(this.translateX.value) * translateUnit;
        this.light.position[1] = Number.parseFloat(this.translateY.value) * translateUnit;
        this.light.position[2] = Number.parseFloat(this.translateZ.value) * translateUnit;
        this.light.color[0] = parseInt(this.colorSelector.value.substring(1, 3), 16) / 255;
        this.light.color[1] = parseInt(this.colorSelector.value.substring(3, 5), 16) / 255;
        this.light.color[2] = parseInt(this.colorSelector.value.substring(5, 7), 16) / 255;
    }

    updateForm() {
        let translateUnit = Number.parseFloat(this.translateUnit.value);
        this.translateX.value = this.light.position[0] / translateUnit;
        this.translateY.value = this.light.position[1] / translateUnit;
        this.translateZ.value = this.light.position[2] / translateUnit;
        let c = "#" + ((1 << 24) + ((this.light.color[0]*255) << 16) + ((this.light.color[1]*255) << 8) + Math.trunc(this.light.color[2]*255)).toString(16).slice(1);
        this.colorSelector.value = c;
    }

    addRangeNode(text, value, max, min, step) {
        let div = document.createElement("div");
        let rangeInput = document.createElement("input");
        rangeInput.setAttribute("type", "range");
        rangeInput.setAttribute("min", min);
        rangeInput.setAttribute("max", max);
        rangeInput.setAttribute("step", step);
        rangeInput.setAttribute("value", value);
        let valueText = document.createTextNode(rangeInput.value);
        div.oninput = () => valueText.textContent = rangeInput.value;
        div.appendChild(document.createTextNode(text));
        div.appendChild(rangeInput);
        div.appendChild(valueText);
        this.form.appendChild(div);
        return rangeInput;
    }
}
