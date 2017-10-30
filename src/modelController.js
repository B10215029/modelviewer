import Model from "./model";
import { downloadModel } from "./model";

export var modelUrlMap = {
    "ball.tri": require("../assets/ball.tri"),
    "car_roadster.tri": require("../assets/car_roadster.tri"),
    "csie.tri": require("../assets/csie.tri"),
    "easter.tri": require("../assets/easter.tri"),
    "fighter.tri": require("../assets/fighter.tri"),
    "kangaroo.tri": require("../assets/kangaroo.tri"),
    "longteapot.tri": require("../assets/longteapot.tri"),
    "mercedes.tri": require("../assets/mercedes.tri"),
    "mig27.tri": require("../assets/mig27.tri"),
    "patchair.tri": require("../assets/patchair.tri"),
    "plant.tri": require("../assets/plant.tri"),
    "pot.tri": require("../assets/pot.tri"),
    "teapot.tri": require("../assets/teapot.tri"),
    "tomcat.tri": require("../assets/tomcat.tri"),
    "Car_road.json": require("../assets/Car_road.json"),
    "Church_s.json": require("../assets/Church_s.json"),
    "Csie.json": require("../assets/Csie.json"),
    "Easter.json": require("../assets/Easter.json"),
    "Fighter.json": require("../assets/Fighter.json"),
    "Kangaroo.json": require("../assets/Kangaroo.json"),
    "Longteap.json": require("../assets/Longteap.json"),
    "Mercedes.json": require("../assets/Mercedes.json"),
    "Mig27.json": require("../assets/Mig27.json"),
    "Patchair.json": require("../assets/Patchair.json"),
    "Plant.json": require("../assets/Plant.json"),
    "Teapot.json": require("../assets/Teapot.json"),
    "Teapot2.json": require("../assets/Teapot2.json"),
    "Tomcat.json": require("../assets/Tomcat.json"),
    "ball.obj": require("../assets/ball.obj"),
    "Lumpy.obj": require("../assets/Lumpy.obj"),
    "ball2.obj": require("../assets/ball2.obj"),
    "ballH.obj": require("../assets/ballH.obj"),
    "box.obj": require("../assets/box.obj"),
    "helix.obj": require("../assets/helix.obj"),
    "kabi.obj": require("../assets/kabi.obj"),
    "manray.obj": require("../assets/manray.obj"),
    "mesh.obj": require("../assets/mesh.obj"),
    "neptune_reduce.obj": require("../assets/neptune_reduce.obj"),
    "Renamon.obj": require("../assets/Renamon.obj"),
    "sandy.obj": require("../assets/sandy.obj"),
    "squidward.obj": require("../assets/squidward.obj"),
}

export var textureUrlMap = {
    "NoTexture": "",
    "grid":require("../assets/g64x64.png"),
    "galvanized":require("../assets/galvanizedTexture.jpg"),
    "red":require("../assets/red.jpg"),
    "earth":require("../assets/earth.jpg"),
    "moon":require("../assets/moon.jpg"),
    "manray":require("../assets/manray.png"),
    "renamon":require("../assets/renamon.jpg"),
    "sandy":require("../assets/sandy.png"),
    "squidward":require("../assets/squidward.png"),
}

export class ModelController {
    constructor(model) {
        /** @type {Model} */
        this.model = model;
        this.form = document.createElement("div");

        this.modelSelector = document.createElement("select");
        for (const key in modelUrlMap) {
            if (key) {
                let opt = document.createElement("option");
                opt.innerText = key;
                opt.value = modelUrlMap[key];
                this.modelSelector.appendChild(opt);
            }
        }
        this.textureSelector = document.createElement("select");
        for (const key in textureUrlMap) {
            if (key) {
                let opt = document.createElement("option");
                opt.innerText = key;
                opt.value = textureUrlMap[key];
                this.textureSelector.appendChild(opt);
            }
        }
        this.colorSelector = document.createElement("input");
        // this.colorSelector.type = "color";
        this.colorSelector.setAttribute("type", "color");
        this.colorSelector.defaultValue = "#808066";
        this.colorSelector.setAttribute("list", "");
        this.colorAlpha = document.createElement("input");
        this.colorAlpha.setAttribute("type", "range");
        this.colorAlpha.min = 0;
        this.colorAlpha.max = 1;
        this.colorAlpha.step = 0.01;
        this.colorAlpha.value = 1;
        this.shaderSelector = document.createElement("select");
        ["Flat", "Gouraud", "Phong", "Toon"].forEach((value, index) => {
            let opt = document.createElement("option");
            opt.innerText = value;
            opt.value = index;
            this.shaderSelector.appendChild(opt);
        });


        this.form.appendChild(document.createTextNode("Model"));
        this.form.appendChild(this.modelSelector);
        this.form.appendChild(document.createElement("br"));
        this.form.appendChild(document.createTextNode("Texture"));
        this.form.appendChild(this.textureSelector);
        this.form.appendChild(document.createElement("br"));
        this.form.appendChild(document.createTextNode("Color"));
        this.form.appendChild(this.colorSelector);
        this.form.appendChild(this.colorAlpha);
        this.form.appendChild(document.createElement("br"));
        this.form.appendChild(document.createTextNode("Shader"));
        this.form.appendChild(this.shaderSelector);
        this.form.appendChild(document.createElement("br"));

        this.translateX = this.addRangeNode("Translate X", 0, 10, -10, 0.1);
        this.translateY = this.addRangeNode("Translate Y", 0, 10, -10, 0.1);
        this.translateZ = this.addRangeNode("Translate Z", 0, 10, -10, 0.1);
        this.form.appendChild(document.createTextNode("Translate Unit"));
        this.translateUnit = document.createElement("input");
        this.translateUnit.setAttribute("type", "number");
        this.translateUnit.setAttribute("value", "1");
        this.translateUnit.setAttribute("step", "any");
        this.form.appendChild(this.translateUnit);
        this.form.appendChild(document.createElement("br"));
        this.form.appendChild(document.createElement("br"));
        this.rotateX = this.addRangeNode("Rotation X", 0, 180, -180, 1);
        this.rotateY = this.addRangeNode("Rotation Y", 0, 180, -180, 1);
        this.rotateZ = this.addRangeNode("Rotation Z", 0, 180, -180, 1);
        this.form.appendChild(document.createElement("br"));
        this.lockScale = this.addCheckBox("鎖定比例", true);
        this.scaleX = this.addRangeNode("Scale X", 0, 10, -10, 0.1);
        this.scaleY = this.addRangeNode("Scale Y", 0, 10, -10, 0.1);
        this.scaleZ = this.addRangeNode("Scale Z", 0, 10, -10, 0.1);
        this.form.appendChild(document.createElement("br"));
        this.lockShear = this.addCheckBox("鎖定比例", true);
        this.shearX = this.addRangeNode("Shear X", 0, 5, -5, 0.1);
        this.shearY = this.addRangeNode("Shear Y", 0, 5, -5, 0.1);
        this.form.appendChild(document.createElement("br"));
        this.translateX.oninput = this.translateY.oninput = this.translateZ.oninput = this.translateUnit.oninput =
            this.rotateX.oninput = this.rotateY.oninput = this.rotateZ.oninput = () => this.updateModel();
        this.scaleX.oninput = this.scaleY.oninput = this.scaleZ.oninput = (ev) => {
            if (this.lockScale.checked)
                this.scaleX.value = this.scaleY.value = this.scaleZ.value = ev.target.value;
            this.updateModel();
        }
        this.shearX.oninput = this.shearY.oninput = (ev) => {
            if (this.lockShear.checked)
                this.shearX.value = this.shearY.value = ev.target.value;
            this.updateModel();
        }
        this.colorSelector.onchange = this.colorAlpha.oninput = () => this.updateModel();
        this.modelSelector.onchange = () => {
            downloadModel(this.modelSelector.value, this.model.gl).then((model) => {
                this.model = model;
                this.updateModel();
            });
        }
        this.textureSelector.onchange = () => {
            this.model.texture = this.textureSelector.value;
        }
    }

    /**
     * 
     * @param {HTMLElement} parent 
     */
    appendToElement(parent) {
        parent.appendChild(this.form);
    }

    updateModel() {
        let translateUnit = Number.parseFloat(this.translateUnit.value);
        this.model.position[0] = Number.parseFloat(this.translateX.value) * translateUnit;
        this.model.position[1] = Number.parseFloat(this.translateY.value) * translateUnit;
        this.model.position[2] = Number.parseFloat(this.translateZ.value) * translateUnit;
        this.model.rotation[0] = Number.parseFloat(this.rotateX.value);
        this.model.rotation[1] = Number.parseFloat(this.rotateY.value);
        this.model.rotation[2] = Number.parseFloat(this.rotateZ.value);
        this.model.scale[0] = Math.pow(2, Number.parseFloat(this.scaleX.value));
        this.model.scale[1] = Math.pow(2, Number.parseFloat(this.scaleY.value));
        this.model.scale[2] = Math.pow(2, Number.parseFloat(this.scaleZ.value));
        this.model.shear[0] = Number.parseFloat(this.shearX.value);
        this.model.shear[1] = Number.parseFloat(this.shearY.value);
        this.model.color[0] = parseInt(this.colorSelector.value.substring(1, 3), 16) / 255;
        this.model.color[1] = parseInt(this.colorSelector.value.substring(3, 5), 16) / 255;
        this.model.color[2] = parseInt(this.colorSelector.value.substring(5, 7), 16) / 255;
        this.model.color[3] = Number.parseFloat(this.colorAlpha.value);
    }

    updateForm() {

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

    addCheckBox(text, value) {
        let div = document.createElement("div");
        let checkBoxInput = document.createElement("input");
        checkBoxInput.setAttribute("type", "checkbox");
        checkBoxInput.setAttribute("checked", value);
        div.appendChild(checkBoxInput);
        div.appendChild(document.createTextNode(text));
        this.form.appendChild(div);
        return checkBoxInput;
    }
}
