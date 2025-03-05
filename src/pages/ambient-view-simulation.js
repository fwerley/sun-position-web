
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { CSS2DRenderer } from 'three/examples/jsm/Addons.js';
import { CSS2DObject } from 'three/examples/jsm/Addons.js';
import { s2c, p2c, dateWithoutTimezone, correctionArrayHour, radiansToDegrees, degreesToRadians } from '../helpers/utils';
import { SunPosition } from 'sun-position';
import panelImage from '../assets/img/panel.png';
import fontText from '../assets/fonts/helvetiker_regular.typeface.json'

import { db, ref, onValue, get, child } from "../firebase/database";
import state from "../store";

const degToRad = THREE.MathUtils.degToRad;
const RADIUS_PATH = 4000;
const rotationMatrix = new THREE.Matrix4();
const targetQuaternion = new THREE.Quaternion();
const clock = new THREE.Clock();
const speed = 2;
// GUI
let effectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    // exposure: renderer.toneMappingExposure
    exposure: null
};
let camera, scene, renderer, raycaster, mouse;
let sky, sun, sphere, uniforms, coords = { latitude: null, longitude: null };
let path = [], inputLat, inputLng, offsetWidth, offsetHeight, offsetWidthSideBar, solarPanel, arc1, arc2, halo1, halo2,
    vector3, //Projeção do vetor solar no plano XZ
    vector4; //Vetor solar

const sunPosition = new SunPosition(coords.latitude, coords.longitude, new Date());
const dataReferenceDb = ref(db, `data/users/${state.user.userInfo.uid}/projects`);
const vector1 = new THREE.Vector3(-1, 0, 0), //Referencia de azimuth 0° Norte
    vector2 = new THREE.Vector3(0, 0, 0); //Referencia geral, centro do plano

function skyLight(elevation) {
    return {
        turbidity: -0.0006 * Math.pow(elevation, 2) + 0.1565 * elevation + 2.4709,
        rayleigh: 0.0003 * Math.pow(elevation, 2) - 0.0383 * elevation + 1.3206,
        mieCoefficient: 6 * Math.pow(10, -6) * Math.pow(elevation, 2) - 0.0015 * elevation + 0.087,
        mieDirectionalG: 3 * Math.pow(10, -6) * Math.pow(elevation, 2) - 0.0005 * elevation + 0.998,
    }
}

function rotateObject(object, pointX = 0, pointY = 0, pointZ = 0) {
    const sunVectorPosition = new THREE.Vector3(pointX, pointY, pointZ);
    rotationMatrix.lookAt(sunVectorPosition, object.position, object.up);
    targetQuaternion.setFromRotationMatrix(rotationMatrix);
}

export const ambientViewSimulation = (parentCanvas) => {

    new ResizeObserver(onWindowResize).observe(parentCanvas);
    init();
    render();

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, offsetWidth / offsetHeight, 100, 2000000);
        camera.position.set(-7500, 1500, 0);

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(offsetWidth, offsetHeight);
        renderer.setAnimationLoop(animate);
        renderer.toneMappingExposure = 0.5;
        parentCanvas.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', render);
        controls.enableZoom = true;
        controls.enablePan = true;
        initSky();
        axisHelper();
        surfaceHelpder();
        initText();
        controlsPanel();
        getLocation();
        solarPanelRender();
        // ArcAngle();
    }

    function render() {
        renderer.render(scene, camera);
    }

    function axisHelper() {
        const origin = new THREE.Vector3(0, 0, 0);
        const length = 500;
        // Direction: up
        const dirY = new THREE.Vector3(0, 1, 0);
        dirY.normalize();
        const hexY = 0x00ff00;
        // Direction: right
        const dirX = new THREE.Vector3(-1, 0, 0);
        dirX.normalize();
        const hexX = 0xff0000;

        // Direction: front
        const dirZ = new THREE.Vector3(0, 0, -1);
        dirX.normalize();
        const hexZ = 0x0000ff;

        const arrowYHelper = new THREE.ArrowHelper(dirY, origin, length, hexY);
        arrowYHelper.translateY(200);
        const arrowXHelper = new THREE.ArrowHelper(dirX, origin, length, hexX);
        arrowXHelper.translateX(200);
        const arrowZHelper = new THREE.ArrowHelper(dirZ, origin, length, hexZ);
        arrowZHelper.translateZ(200);

        scene.add(arrowYHelper);
        scene.add(arrowXHelper);
        scene.add(arrowZHelper);
    }

    function onWindowResize(event) {
        offsetWidth = parentCanvas.getBoundingClientRect().width;
        offsetHeight = parentCanvas.getBoundingClientRect().height;
        offsetWidthSideBar = window.innerWidth - offsetWidth;
        camera.aspect = offsetWidth / offsetHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(offsetWidth, offsetHeight);
        labelInfo();
        render();
    }

    function initSky() {
        // Add Sky
        sky = new Sky();
        sky.scale.setScalar(450000);
        scene.add(sky);
        pointSky();

        sun = new THREE.Vector3();

        effectController.exposure = renderer.toneMappingExposure;

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
            let elevCart = p2c([RADIUS_PATH * 0.8, degToRad(elevation)]);
            let azimuth = effectController.azimuth
            let coords = p2c([RADIUS_PATH - elev, degToRad(-azimuth + 90)]);
            sphere.position.set(coords[0], elevCart[1], coords[1]);

            renderer.toneMappingExposure = effectController.exposure;
            // renderer.render(scene, camera)
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

    function pointSky() {
        const geometry = new THREE.SphereGeometry(100, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
    }

    function surfaceHelpder() {
        const helper = new THREE.GridHelper(10000, 12, 0xcccccc, 0xcccccc);
        const pHelper = new THREE.PolarGridHelper(RADIUS_PATH, 24, 0, 64, 0x7a7a7a, 0x7a7a7a);
        const elevationGrid = [];
        const divisions = 150;
        for (let i = 0; i <= Math.floor(90 / 15); i++) {
            const elevCart = p2c([RADIUS_PATH, degToRad((15 * i))]);
            for (let i = 0; i <= divisions; i++) {
                const v = (i / divisions) * (Math.PI * 2);
                const x = (elevCart[0] / 2) * Math.sin(v);
                const z = (elevCart[0] / 2) * Math.cos(v);
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
            line.computeLineDistances();
            scene.add(line);
        }
        scene.add(helper);
        scene.add(pHelper);
    }

    function initText() {
        const loader = new FontLoader();
        // loader.load('./assets/fonts/helvetiker_regular.typeface.json', function (font) {
        loader.load('./static/helvetiker_regular.typeface.json', function (font) {

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
            const polarAngles = 22.5;
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
                    x: degToRad(-90),
                    y: degToRad(360 - (polarAngles * i) + 90),
                    z: degToRad(0),
                }
                textPolar(`${polarAngles * i}°`, 150, { translate, rotate });
            }

            // Altitude angulos
            for (let i = 0; i <= Math.floor(90 / altitude); i++) {
                let translate = {
                    x: -0.4,
                    y: p2c([RADIUS_PATH, degToRad((15 * i))])[0],
                    z: 0
                }
                let rotate = {
                    x: degToRad(-90),
                    y: degToRad(30),
                    z: degToRad(0),
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

    function controlsPanel() {
        let loopMoviment;
        const accordion = parentCanvas.querySelector("#controls");
        const play = parentCanvas.querySelector("#play");
        const pause = parentCanvas.querySelector("#pause");
        const now = parentCanvas.querySelector("#now");

        accordion.addEventListener("click", function () {
            var panel = this.nextElementSibling;
            panel.classList.toggle("active");
            this.classList.toggle("rotate");
        });

        inputLat = parentCanvas.querySelector("#lat");
        inputLng = parentCanvas.querySelector("#lng");
        const date = parentCanvas.querySelector("#date");
        const anglesInfo = parentCanvas.getElementsByClassName("data");
        // Controle de simulação, usado no controle de play
        let control = 0;
        let waitInput = null;
        inputLat.addEventListener("input", function () {
            control = 0;
        });
        inputLng.addEventListener("input", function () {
            control = 0;
        });
        date.addEventListener("input", async function (event) {
            clearTimeout(waitInput);
            for (let i = 0; i <= 2; i++) {
                scene.children.forEach(element => {
                    if (element.name !== '') {
                        scene.remove(scene.getObjectByName(element.name))
                    }
                });
            }
            waitInput = setTimeout(async () => {
                if (inputLat.value && inputLng.value && event.target.value) {
                    control = 0;
                    coords.latitude = parseFloat(inputLat.value);
                    coords.longitude = parseFloat(inputLng.value);
                    sunPosition.setLatitude(coords.latitude);
                    sunPosition.setLongitude(coords.longitude);
                    let solarVector = await sVector(new Date(event.target.value));
                    let duration = sunPosition.getDurationDay();

                    sphere.position.set(solarVector.coords[0], solarVector.coords[2], solarVector.coords[1]);
                    // rotateObject(solarPanel, solarVector.coords[0] * 500, solarVector.coords[2] * 500, solarVector.coords[1] * 500);
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
                    render();
                }
            }, 600);
        });


        play.addEventListener("click", function () {
            clearInterval(loopMoviment);
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
            date.value = dateWithoutTimezone(new Date()).slice(0, -4)
            date.dispatchEvent(new Event('input'));
        })

        async function loopSunPath(position) {
            sphere.position.set(position.x, position.y, position.z);
            // rotateObject(solarPanel, position.x * 500, position.y * 500, position.z * 500);
            ArcAngle();
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
            // render()
        }
    }

    async function sVector(param) {
        sunPosition.setDateTime(param);
        let elevation = await sunPosition.getElevation();
        let azimuth = await sunPosition.getAzimuth();
        // Deve ser subtraido de 180 para ficar de acordo com as referencias dos eixos do three.js
        let coords = s2c(RADIUS_PATH, degToRad(azimuth - 180), degToRad(elevation));
        return { coords, elevation, azimuth }
    }

    async function solarChart() {
        let date1 = new Date(2023, 11, 22);
        let date2 = new Date(2023, 5, 20);
        const data = [{ date: date2, color: 0xff00ff, name: `Solstício de ${coords.latitude < 0 ? 'inverno' : 'verão'}` }, { date: date1, color: 0xffff00, name: `Solstício de ${coords.latitude < 0 ? 'verão' : 'inverno'}` }];

        for (let i = 0; i < data.length; i++) {
            await makeArcLines(data[i]);
        }
    }

    async function makeArcLines(object, pathSun = false) {
        let arc = [];
        path = [];
        sunPosition.setDateTime(object.date);
        let date = object.date;
        let aurora = isNaN((await sunPosition.getLocTime()).sunrise) ?
            new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
            : (await sunPosition.getLocTime()).sunrise;
        let crepusculo = isNaN((await sunPosition.getLocTime()).sunset) ?
            new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
            : (await sunPosition.getLocTime()).sunset;
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
        // Verifica se a coordenada Y (eixo vertical), tem pelo menos um valor maior que zero,
        // ou seja, o Sol está acima do horizonte em algum momento.
        if (arc.filter(coord => coord.y > 0).length > 0) {
            const lineMaterial = new THREE.LineBasicMaterial({ color: object.color, linewidth: 1.5 });
            const curve = new THREE.CatmullRomCurve3(arc);
            const newPoints = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
            const line = new THREE.Line(geometry, lineMaterial);
            line.name = object.name ? object.name : '';
            scene.add(line);
        }

    }

    async function analemma() {
        for (let index = 0; index < 24; index++) {
            scene.remove(`${index < 10 ? '0' + index : index}h`);
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
                line.name = `${index < 10 ? '0' + index : index}h`;
                labelInfo();
                scene.add(line);
            }
        }
    }

    function labelInfo() {
        // Setup labels
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(offsetWidth, offsetHeight);
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
            mouse.x = ((clientX - offsetWidthSideBar) / (offsetWidth)) * 2 - 1;
            mouse.y = -(clientY / offsetHeight) * 2 + 1;
        });

        renderer.setAnimationLoop(() => {
            // controls.update();

            // Pick objects from view using normalized mouse coordinates
            raycaster.setFromCamera(mouse, camera);
            raycaster.params.Line.threshold = 40;
            const [hovered] = raycaster.intersectObjects(scene.children);

            if (hovered && hovered.object.name !== "") {
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

    function solarPanelRender() {
        let cubeGeometry = new THREE.BoxGeometry(550, 1000, 25);
        let loader = new THREE.TextureLoader();
        let materialArray = [
            new THREE.MeshBasicMaterial({ color: 0xcccccc }),
            new THREE.MeshBasicMaterial({ color: 0xcccccc }),
            new THREE.MeshBasicMaterial({ color: 0xcccccc }),
            new THREE.MeshBasicMaterial({ color: 0xcccccc }),
            new THREE.MeshBasicMaterial({ map: loader.load(panelImage) }),
            new THREE.MeshBasicMaterial({ color: 0x555555 }),
        ];
        solarPanel = new THREE.Mesh(cubeGeometry, materialArray);
        solarPanel.translateY(500);
        solarPanel.visible = false;
        solarPanel.name = "";
        scene.add(solarPanel);
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (!solarPanel.quaternion.equals(targetQuaternion)) {
            const step = speed * delta;
            solarPanel.quaternion.rotateTowards(targetQuaternion, step);
        }
    }

    // Update relatime position tracker
    onValue(dataReferenceDb, (snapshot) => {
        const data = snapshot.val();
        if (state.selectedProject.id !== undefined && snapshot.exists()) {
            if (data[state.selectedProject.id]) {
                state.selectedProject.elevation = data[state.selectedProject.id].elevation;
                state.selectedProject.azimuth = data[state.selectedProject.id].azimuth;
                state.selectedProject.epochTime = data[state.selectedProject.id].epoch_time;
                const direction = s2c(RADIUS_PATH, degToRad(data[state.selectedProject.id].azimuth - 180), degToRad(data[state.selectedProject.id].elevation));
                // Multipica por 500 para a projeção ficar na linha do horizonte
                rotateObject(solarPanel, direction[0] * 500, direction[2] * 500, direction[1] * 500);
            }
        }
    });

    function generateArc(Vectors, elevation = false, rotate = 0) {
        const N = 60;
        let radius = 200;
        let thredRender;
        let angleEndRotate;
        if (elevation) {
            let angleStart = 0;
            let angleEnd = Vectors.p1.angleTo(Vectors.p3);
            var geometry = new THREE.CircleGeometry(radius, N, Math.PI, angleEnd);

            var material = new THREE.MeshBasicMaterial({ color: 0x2f2a22, side: THREE.DoubleSide }); //white circle
            arc2 = new THREE.Mesh(geometry, material);
            arc2.rotateY(-rotate); //rotate to the right position
            arc2.rotateZ(-Math.PI);
            scene.add(arc2);
            arc2.name = radiansToDegrees(angleEnd).toFixed(2) + '°';
            

            /* create halo */
            var unit = 1 / radius;
            var biggerGeometry = new THREE.CircleGeometry(radius + 2, N, (angleStart + Math.PI) - 2 * unit, (angleEnd + angleStart) + 4 * unit);
            var haloGeometry = new THREE.EdgesGeometry(biggerGeometry);
            var haloMaterial = new THREE.LineBasicMaterial({ color: 0xA020F0 });
            halo2 = new THREE.LineSegments(haloGeometry, haloMaterial);
            arc2.add(halo2);
            halo2.name = radiansToDegrees(angleEnd).toFixed(2) + '°';
            thredRender = arc2;
        } else {
            let angleStart = Math.atan2(Vectors.p1.z - Vectors.p2.z, Vectors.p1.x - Vectors.p2.x);
            let angleEnd = Math.atan2(Vectors.p3.z - Vectors.p2.z, Vectors.p3.x - Vectors.p2.x);
            angleEndRotate = angleEnd;
            var geometry = new THREE.CircleGeometry(radius, N, (angleStart + Math.PI), (angleEnd + angleStart));

            var material = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide }); //white circle
            arc1 = new THREE.Mesh(geometry, material);
            arc1.rotateX(-Math.PI / 2);
            arc1.rotateY(-Math.PI);
            scene.add(arc1);
            arc1.name = radiansToDegrees(angleEnd+angleStart).toFixed(2) + '°';
            /* create halo */
            var unit = 1 / radius;
            var biggerGeometry = new THREE.CircleGeometry(radius + 2, N, (angleStart + Math.PI) - 2 * unit, (angleEnd + angleStart) + 4 * unit);
            var haloGeometry = new THREE.EdgesGeometry(biggerGeometry);
            var haloMaterial = new THREE.LineBasicMaterial({ color: 0xA020F0 }); //black halo    
            halo1 = new THREE.LineSegments(haloGeometry, haloMaterial);
            arc1.add(halo1);
            halo1.name = radiansToDegrees(angleEnd+angleStart).toFixed(2) + '°';
            thredRender = arc1;
        }
        return {
            render: thredRender,
            rotateAngle: angleEndRotate
        }
    }

    function ArcAngle() {
        vector3 = new THREE.Vector3(sphere.position.x, 0, sphere.position.z);
        vector4 = new THREE.Vector3(sphere.position.x, sphere.position.y, sphere.position.z);

        // console.log(scene.children);
        if (arc1) scene.remove(arc1);
        // console.log(scene.children);
        if (arc2) scene.remove(arc2);

        let angleAzimuth = generateArc({ p1: vector1, p2: vector2, p3: vector3 });
        arc1 = angleAzimuth.render;
        let rotate = angleAzimuth.rotateAngle;
        arc2 = generateArc({ p1: vector3, p2: vector2, p3: vector4 }, true, rotate).render;

        scene.add(arc1, arc2);
    }

}

export const positionSphereLigth = (elevation, azimuth) => {
    // Deve ser subtraido de 180 para ficar de acordo com as referencias dos eixos do three.js
    let coords = s2c(RADIUS_PATH, degToRad(azimuth - 180), degToRad(elevation));
    sphere.position.set(coords[0], coords[2], coords[1]);
    let phi = degToRad(90 - elevation) || degToRad(90 - effectController.elevation);
    let theta = degToRad(-azimuth - 90) || degToRad(effectController.azimuth);
    let light = skyLight(elevation);
    uniforms['turbidity'].value = light.turbidity;
    uniforms['rayleigh'].value = light.rayleigh;
    uniforms['mieCoefficient'].value = light.mieCoefficient;
    uniforms['mieDirectionalG'].value = light.mieDirectionalG;
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
}

export const renderPanel = () => {
    const dbRef = ref(db);
    get(child(dbRef, `data/users/${state.user.userInfo.uid}/projects/${state.selectedProject.id}`)).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            state.selectedProject.elevation = data.elevation;
            state.selectedProject.azimuth = data.azimuth;
            state.selectedProject.epochTime = data.epoch_time;
            const direction = s2c(RADIUS_PATH, degToRad(data.azimuth - 180), degToRad(data.elevation));
            // Multipica por 500 para a projeção ficar na linha do horizonte
            rotateObject(solarPanel, direction[0] * 500, direction[2] * 500, direction[1] * 500);
            solarPanel.visible = true;
        } else {
            state.selectedProject.elevation = null;
            state.selectedProject.azimuth = null;
            state.selectedProject.epochTime = null;
        }
    })
}

export const removePanel = () => {
    solarPanel.visible = false;
}