import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { correctionArrayHour, degreesToRadians, p2c, s2c } from './utils';
import { SunPosition } from 'sun-position';
import { CSS2DRenderer } from 'three/examples/jsm/Addons.js';
import { CSS2DObject } from 'three/examples/jsm/Addons.js';
import panelImage from './zneg.png';
import fontText from '../fonts/helvetiker_regular.typeface.json';

const RADIUS_PATH = 4000;
const coords = {
    latitude: -4.56454,
    longitude: -38.9172
}

const sunPosition = new SunPosition(coords.latitude, coords.longitude, new Date());

let camera, scene, renderer, raycaster, mouse;
let sky, sun, sphere, uniforms;
let path = [], inputLat, inputLng;
const degToRad = THREE.MathUtils.degToRad;
const { innerWidth, innerHeight } = window;

async function sVector(param) {

    sunPosition.setDateTime(param);
    let elevation = await sunPosition.getElevation();
    let azimuth = await sunPosition.getAzimuth();
    // Deve ser subtraido de 180 para ficar de acordo com as referencias dos eixos do three.js
    let coords = s2c(RADIUS_PATH, degreesToRadians(azimuth - 180), degreesToRadians(elevation));
    return { coords, elevation, azimuth }
}

init();
render();

function initSky() {
    // Add Sky
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    pointSky();

    sun = new THREE.Vector3();

    // GUI

    const effectController = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {
        uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

        const phi = degToRad(90 - effectController.elevation);
        const theta = degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(sun);
        let elevation = effectController.elevation;
        let elev = (elevation * RADIUS_PATH) / 90;
        let elevCart = p2c([RADIUS_PATH * 0.8, degreesToRadians(elevation)]);
        let azimuth = effectController.azimuth
        let coords = p2c([RADIUS_PATH - elev, degreesToRadians(-azimuth + 90)]);
        sphere.position.set(coords[0], elevCart[1], coords[1]);

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render(scene, camera)
    }

    // const gui = new GUI();

    // gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged)
    // gui.add(effectController, 'rayleigh', 0.0, 4.0, 0.001).onChange(guiChanged)
    // gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged)
    // gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged)
    // gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged)
    // gui.add(effectController, 'azimuth', -180, 180, 0.1).onChange(guiChanged)
    // gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged)

    guiChanged();

}

function init() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 100, 2000000);
    camera.position.set(0, 1000, 6100);
    scene = new THREE.Scene();

    const helper = new THREE.GridHelper(10000, 12, 0xcccccc, 0xcccccc);
    const pHelper = new THREE.PolarGridHelper(RADIUS_PATH, 24, 0, 64, 0x7a7a7a, 0x7a7a7a);
    const elevationGrid = [];
    const divisions = 150;
    for (let i = 0; i <= Math.floor(90 / 15); i++) {
        const elevCart2 = p2c([RADIUS_PATH, degreesToRadians((15 * i))]);
        for (let i = 0; i <= divisions; i++) {
            const v = (i / divisions) * (Math.PI * 2);
            const x = (elevCart2[0] / 2) * Math.sin(v);
            const z = (elevCart2[0] / 2) * Math.cos(v);
            elevationGrid.push(x, 0, z);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(elevationGrid, 3));
        const material = new THREE.LineDashedMaterial({
            color: 0x7a7a7a,
            linewidth: 3,
            dashSize: 10,
            gapSize: 10
        });
        const line = new THREE.Line(geometry, material);
        line.scale.setScalar(2);
        scene.add(line);
    }
    scene.add(helper);
    scene.add(pHelper);
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMappingExposure = 0.5
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
    controls.enableZoom = true;
    controls.enablePan = true;

    initSky();
    initText();
    controlsPanel();
    getLocation();
    solarPanel();
    window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
    render()
}

function render() {
    renderer.render(scene, camera);
}

function initText() {
    const loader = new FontLoader();
    // loader.load('./assets/fonts/helvetiker_regular.typeface.json', function (font) {
    loader.load('fonts/helvetiker_regular.typeface.json', function (font) {

        const color = 0x006699;
        const matLite = new THREE.MeshBasicMaterial({
            color,
            transparent: false,
            opacity: 0.4,
            side: THREE.DoubleSide
        });

        const cardealPoints = [
            { text: 'N', rotate: -1.595 },
            { text: 'L', rotate: 3.13 },
            { text: 'S', rotate: 1.54 },
            { text: 'O', rotate: -0.03 }
        ];
        const polarAngles = 45;
        const altitude = 15;

        // Texto com pontos cardeais
        for (let i = 0; i < cardealPoints.length; i++) {
            let translate = {
                x: 0.1,
                y: 0,
                z: 5000
            }
            let rotate = {
                x: 0,
                y: cardealPoints[i].rotate,
                z: 0,
            }
            textPolar(cardealPoints[i].text, 250, { translate, rotate });
        }

        // Texto polar angulos
        for (let i = 0; i < Math.floor(360 / polarAngles); i++) {
            let translate = {
                x: -0.4,
                y: 4000,
                z: 0
            }
            let rotate = {
                x: THREE.MathUtils.degToRad(-90),
                y: THREE.MathUtils.degToRad(360 - (polarAngles * i) + 90),
                z: THREE.MathUtils.degToRad(0),
            }
            textPolar(`${polarAngles * i}°`, 150, { translate, rotate });
        }

        // Altitude angulos
        for (let i = 0; i <= Math.floor(90 / altitude); i++) {
            let translate = {
                x: -0.4,
                y: p2c([RADIUS_PATH, degreesToRadians((15 * i))])[0],
                z: 0
            }
            let rotate = {
                x: THREE.MathUtils.degToRad(-90),
                y: THREE.MathUtils.degToRad(30),
                z: THREE.MathUtils.degToRad(0),
            }
            textPolar(`${(altitude * i)}°`, 150, { translate, rotate });
        }

        function textPolar(display, size, position) {
            let message = display;
            let shapes = font.generateShapes(message, size);
            let geometry = new THREE.ShapeGeometry(shapes);
            geometry.computeBoundingBox();
            let xMid = position.translate.x * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
            geometry.translate(xMid, position.translate.y, position.translate.z);
            geometry.rotateX(position.rotate.x)
            geometry.rotateY(position.rotate.y);
            geometry.rotateZ(position.rotate.z)
            let text = new THREE.Mesh(geometry, matLite);
            text.position.z = 0;
            scene.add(text);
        }
    });
}

async function makeArcLines(object, pathSun = false) {
    let arc = [];
    path = [];
    sunPosition.setDateTime(object.date);
    let date = object.date;
    let aurora = (await sunPosition.getLocTime()).sunrise;
    let crepusculo = (await sunPosition.getLocTime()).sunset;
    let hourControl = aurora.getHours();
    let minuteControl = aurora.getMinutes();
    let secondsControl = aurora.getSeconds();
    while (hourControl <= crepusculo.getHours()) {
        if (hourControl === crepusculo.getHours() && minuteControl > crepusculo.getMinutes()) {
            break;
        }
        let solarVector = await sVector(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hourControl, minuteControl, secondsControl));
        arc.push(new THREE.Vector3(solarVector.coords[0], solarVector.coords[2], solarVector.coords[1]));
        if (pathSun === true) {
            path.push({
                x: solarVector.coords[0],
                y: solarVector.coords[2],
                z: solarVector.coords[1],
                elevation: solarVector.elevation,
                azimuth: solarVector.azimuth,
                time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hourControl, minuteControl, secondsControl)
            });
        }
        let increment = correctionArrayHour([hourControl, minuteControl, secondsControl], { minutes: 1, seconds: 0 });
        hourControl = increment[0];
        minuteControl = increment[1];
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: object.color, linewidth: 1.5 });
    const curve = new THREE.CatmullRomCurve3(arc);
    const newPoints = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
    const line = new THREE.Line(geometry, lineMaterial);
    line.name = object.name ? object.name : '';
    scene.add(line);
}

async function solarChart() {

    let date1 = new Date(2023, 11, 22);
    let date2 = new Date(2023, 5, 20);
    const data = [{ date: date2, color: 0xff00ff, name: `Solstício de ${coords.latitude < 0 ? 'inverno' : 'verão'}` }, { date: date1, color: 0xffff00, name: `Solstício de ${coords.latitude < 0 ? 'verão' : 'inverno'}` }];

    for (let i = 0; i < data.length; i++) {
        await makeArcLines(data[i]);
    }
}

function pointSky() {
    const geometry = new THREE.SphereGeometry(100, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}

function skyLight(elevation) {
    return {
        turbidity: -0.0006 * Math.pow(elevation, 2) + 0.1565 * elevation + 2.4709,
        rayleigh: 0.0003 * Math.pow(elevation, 2) - 0.0383 * elevation + 1.3206,
        mieCoefficient: 6 * Math.pow(10, -6) * Math.pow(elevation, 2) - 0.0015 * elevation + 0.087,
        mieDirectionalG: 3 * Math.pow(10, -6) * Math.pow(elevation, 2) - 0.0005 * elevation + 0.998,
    }
}

function controlsPanel() {
    let loopMoviment;
    const accordion = document.querySelector("#controls");
    const play = document.querySelector("#play");
    const pause = document.querySelector("#pause");
    const now = document.querySelector("#now");
    const beforeTitle = document.styleSheets[0].cssRules[1];
    accordion.addEventListener("click", function () {
        var panel = this.nextElementSibling;
        panel.classList.toggle("active");
        if (beforeTitle.style.transform == "rotate(0deg)") {
            beforeTitle.style.transform = "rotate(90deg)"
        } else {
            beforeTitle.style.transform = "rotate(0deg)"
        }
    });

    inputLat = document.querySelector("#lat");
    inputLng = document.querySelector("#lng");
    const date = document.querySelector("#date");
    const anglesInfo = document.getElementsByClassName("data");

    date.addEventListener("input", async function (event) {
        scene.children.forEach(element => {
            if (element.name !== '') {
                scene.remove(scene.getObjectByName(element.name))
            }
        })
        if (inputLat.value && inputLng.value && event.target.value) {
            coords.latitude = parseFloat(inputLat.value);
            coords.longitude = parseFloat(inputLng.value);
            sunPosition.setLatitude(coords.latitude);
            sunPosition.setLongitude(coords.longitude);
            let solarVector = await sVector(new Date(event.target.value));
            let duration = sunPosition.getDurationDay();
            sphere.position.set(solarVector.coords[0], solarVector.coords[2], solarVector.coords[1]);
            let infoData = [
                solarVector.elevation,
                solarVector.azimuth,
                (await sunPosition.getLocTime()).sunrise.toLocaleTimeString(),
                (await sunPosition.getLocTime()).sunset.toLocaleTimeString(),
                `${duration[0]}h${duration[1]}m${duration[2]}s`,
                '',
                '',
                '',
                ''
            ]
            let phi = degToRad(90 - infoData[0]) || degToRad(90 - effectController.elevation);
            let theta = degToRad(-infoData[1] - 90) || degToRad(effectController.azimuth);

            let tag = ["Elevação", "Azimute", "Aurora", "Crepúsculo", "Duração", `Solstício ${coords.latitude < 0 ? 'inverno' : 'verão'}`, `Solstício ${coords.latitude < 0 ? 'verão' : 'inverno'}`, new Date(event.target.value).toLocaleDateString(), "Analemma"]
            Array.from(anglesInfo).forEach((element, index) => {
                element.innerHTML = `${tag[index]}: 
                ${typeof infoData[index] == 'number' ?
                        infoData[index].toFixed(3) : infoData[index]}${index < 2 ? '°' : ''}`
            })
            const arcLineData = { date: new Date(event.target.value), color: 0x0000ff, name: `Trajetória do Sol em ${new Date(event.target.value).toLocaleDateString()}` };

            let light = skyLight(solarVector.elevation);
            uniforms['turbidity'].value = light.turbidity;
            uniforms['rayleigh'].value = light.rayleigh;
            uniforms['mieCoefficient'].value = light.mieCoefficient;
            uniforms['mieDirectionalG'].value = light.mieDirectionalG;
            sun.setFromSphericalCoords(1, phi, theta);
            uniforms['sunPosition'].value.copy(sun);
            await solarChart();
            await makeArcLines(arcLineData, true);
            analemma();
            render()
        }
    });

    play.addEventListener("click", function () {
        let control = 0;
        clearInterval(loopMoviment)
        if (lat.value && lng.value && date.value) {
            loopMoviment = setInterval(() => {
                if (control < path.length) {
                    loopSunPath(path[control]);
                    control++;
                } else {
                    control = 0;
                }
            }, 100);
        }
    });

    pause.addEventListener("click", function () {
        clearInterval(loopMoviment);
    });

    now.addEventListener("click", function () {
        clearInterval(loopMoviment);
        scene.children.forEach(element => {
            if (element.name !== '') {
                scene.remove(scene.getObjectByName(element.name))
            }
        })
        date.value = dateWithoutTimezone(new Date()).slice(0, -4)
        date.dispatchEvent(new Event('input'));
    })

    async function loopSunPath(position) {
        sphere.position.set(position.x, position.y, position.z);
        let infoData = [
            position.elevation,
            position.azimuth,
        ]
        let phi = degToRad(90 - infoData[0]) || degToRad(90 - effectController.elevation);
        let theta = degToRad(-infoData[1] - 90) || degToRad(effectController.azimuth);

        let tag = ["Elevação", "Azimute"];
        date.value = dateWithoutTimezone(position.time);
        Array.from(anglesInfo).forEach((element, index) => {
            if (index < 2) {
                element.innerHTML = `${tag[index]}: 
                ${typeof infoData[index] == 'number' ?
                        infoData[index].toFixed(3) : infoData[index]}${index < 2 ? '°' : ''}`
            }
        });

        let light = skyLight(position.elevation);
        uniforms['turbidity'].value = light.turbidity;
        uniforms['rayleigh'].value = light.rayleigh;
        uniforms['mieCoefficient'].value = light.mieCoefficient;
        uniforms['mieDirectionalG'].value = light.mieDirectionalG;
        sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(sun);
        render()
    }
}

function solarPanel() {
    let cubeGeometry = new THREE.BoxGeometry(550, 1000, 25);
    let loader = new THREE.TextureLoader();
    let materialArray = [
        new THREE.MeshBasicMaterial({ map: loader.load("sr/xpos.png") }),
        new THREE.MeshBasicMaterial({ map: loader.load("sr/xneg.png") }),
        new THREE.MeshBasicMaterial({ map: loader.load("sr/ypos.png") }),
        new THREE.MeshBasicMaterial({ map: loader.load("sr/yneg.png") }),
        new THREE.MeshBasicMaterial({ map: loader.load("sr/zpos.png") }),
        new THREE.MeshBasicMaterial({ map: loader.load(panelImage) }),
    ];
    let mesh = new THREE.Mesh(cubeGeometry, materialArray);

    mesh.translateY(500);
    rotateObject(mesh, 67, 3, 0);
    scene.add(mesh);
}

function rotateObject(object, degreeX = 0, degreeY = 0, degreeZ = 0) {
    const quaternionx = new THREE.Quaternion();
    const quaterniony = new THREE.Quaternion();
    const quaternionz = new THREE.Quaternion();
    quaternionx.setFromAxisAngle(new THREE.Vector3(1, 0, 0).normalize(), degreesToRadians(degreeX));
    quaterniony.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), degreesToRadians(90 - degreeY));
    quaternionz.setFromAxisAngle(new THREE.Vector3(0, 0, 1).normalize(), degreesToRadians(degreeZ));
    object.applyQuaternion(quaternionx);
    object.applyQuaternion(quaterniony);
    object.applyQuaternion(quaternionz);
}

async function analemma() {

    for (let index = 1; index < 24; index++) {
        scene.remove(`${index < 10 ? '0' + index : index}h:00m:00s`);
        render();
        let pathAnalemma = [];
        let currenteYear = new Date().getFullYear();
        let firstDay = new Date(currenteYear, 0, 1, index, 0, 0);
        let bissexto = (ano) => (ano % 4 == 0 && ano % 100 != 0 || ano % 400 == 0) ? true : false;
        let qtyDays = bissexto(currenteYear) ? 366 : 365;
        for (let i = 0; i < qtyDays; i++) {
            let newDate = new Date(firstDay.getTime());
            let date = new Date(newDate.setDate(firstDay.getDate() + (1 * i)));
            let vector = await sVector(date);
            if (vector.coords[2] > 0) {
                pathAnalemma.push(new THREE.Vector3(vector.coords[0], vector.coords[2], vector.coords[1]));
            }
        };
        if (pathAnalemma.length > 0) {
            let lineDashedMaterial = new THREE.LineDashedMaterial({
                color: 0x00ff00, dashSize: 100, gapSize: 100, linewidth: 10
            });
            let curve = new THREE.CatmullRomCurve3(pathAnalemma);
            let newPoints = curve.getPoints(50);
            let geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
            let line = new THREE.Line(geometry, lineDashedMaterial);
            line.computeLineDistances();
            line.name = `${index < 10 ? '0' + index : index}h:00m:00s`;
            labelInfo();
            scene.add(line);
        }
        // render();
    }
}

function labelInfo() {
    // Setup labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(innerWidth, innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.style.marginTop = '-1em';
    const label = new CSS2DObject(labelDiv);
    label.visible = false;
    scene.add(label);


    // Track mouse movement to pick objects
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('mousemove', ({ clientX, clientY }) => {
        const { innerWidth, innerHeight } = window;

        mouse.x = (clientX / innerWidth) * 2 - 1;
        mouse.y = -(clientY / innerHeight) * 2 + 1;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        const { innerWidth, innerHeight } = window;

        renderer.setSize(innerWidth, innerHeight);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    });

    renderer.setAnimationLoop(() => {
        // controls.update();

        // Pick objects from view using normalized mouse coordinates
        raycaster.setFromCamera(mouse, camera);
        raycaster.params.Line.threshold = 40;
        const [hovered] = raycaster.intersectObjects(scene.children);

        if (hovered) {
            // Setup label
            renderer.domElement.className = 'hovered';
            label.visible = true;
            labelDiv.textContent = hovered.object.name;

            // Get offset from object's dimensions
            const offset = new THREE.Vector3();
            new THREE.Box3().setFromObject(hovered.object).getSize(offset);

            // Move label over hovered element
            label.position.set(
                hovered.object.position.x,
                offset.y / 2,
                hovered.object.position.z
            );
        } else {
            // Reset label
            renderer.domElement.className = '';
            label.visible = false;
            labelDiv.textContent = '';
        }

        // Render scene
        renderer.render(scene, camera);

        // Render labels
        labelRenderer.render(scene, camera);
    });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
    else { alert("Geolocation is not supported by this browser."); }
}

function showPosition(position) {
    inputLat.value = parseFloat(position.coords.latitude);
    inputLng.value = parseFloat(position.coords.longitude);
}

const dateWithoutTimezone = (date) => {
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const withoutTimezone = new Date(date.valueOf() - tzoffset)
        .toISOString()
        .slice(0, -1);
    return withoutTimezone;
};

