import { vec3 } from "gl-matrix";
export class Light {
    constructor() {
        this.lightType = "point" // TODO
        this.color = [0, 0, 0];
        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0]; // TODO
        this.intensitys = 1; // TODO
    }
}
