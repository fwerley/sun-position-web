import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import { ambientViewSimulation, positionSphereLigth, removePanel, renderPanel } from "../ambient-view-simulation";
import { SunPosition } from "sun-position";
import Worker from "../../helpers/worker?worker"
import state, { reaction, subscribe } from "../../store";

import "./view-3d.css";
import BoxInfoPanel from "../../components/BoxInfoPanel";
import { interDate, urlApiRequest } from "../../helpers/utils";
import toastify from "../../helpers/toastify";

const { div, form, label, input, select, option, i } = helpers(h);
const sunPosition = new SunPosition(0, 0, new Date());
let intervalWorker = new Worker();
let projects = state.user.projects.list.map(project => {
    return {
        name: project.name,
        paramUrl: project.name.trim().toLowerCase().replace(/\s/g, "-"),
        tag: project.tag
    }
});

const lineImputs = (forImput, lab, typeImput, nameImput, valueImput, className = "") => div([
    label({ for: forImput }, lab),
    input({ type: typeImput, className, name: nameImput, id: forImput, value: valueImput })
]);

const groupImputs = div([
    div([
        lineImputs("lat", "Latitude", "number", "latitude", ""),
        lineImputs("lng", "Longitude", "number", "longitude", ""),
        lineImputs("date", "Datetime", "datetime-local", "date", "")
    ]),
    div({ className: "button-control", style: { "flex-direction": "row", "justify-content": "space-around" } }, [
        lineImputs("play", "", "button", "play", "Play", "is-primary"),
        lineImputs("pause", "", "button", "pause", "Pause", "is-primary"),
        lineImputs("now", "", "button", "now", "Now", "is-primary")
    ])
]);

const selectProject = async (event) => {
    intervalWorker.terminate();
    removePanel();
    state.selectedProject.id = event.target.value;
    localStorage.setItem('selectProject', JSON.stringify({ id: event.target.value }));
    history.pushState("3d", "3d", `?project=${event.target.value}`);
    const myproject = state.user.projects.list.filter(item => item.tag === event.target.value);
    let controlsContainer = document.body.querySelector(".controls-container-right");
    let lat = document.body.querySelector("#lat");
    let lng = document.body.querySelector("#lng");
    let dateTime = document.body.querySelector("#date");
    let dataTableInfo = document.body.querySelectorAll(".data");
    const buttonsContainer = document.body.querySelector(".button-control");
    intervalWorker = new Worker();
    if (myproject.length > 0) {
        state.selectedProject.loading = true;
        lat.value = myproject[0].lat;
        lng.value = myproject[0].lng;
        sunPosition.setLatitude(myproject[0].lat);
        sunPosition.setLongitude(myproject[0].lng);
        buttonsContainer.classList.add("not-active");
        try {
            let date = new Date(new Date().toLocaleString('en', { timeZone: myproject[0].timeZone.zoneName })
                .toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0];
            dateTime.value = date;
            dateTime.dispatchEvent(new Event('input'));
            // -------------------------------------
            let dateOffset = new Date(date);
            sunPosition.setDateTime(dateOffset);
            intervalWorker.onmessage = async () => {
                // Atualiza informações de tempo de conexão do modulo  na tela info Info Module
                let elev = document.body.querySelector("#info-module-elevation");
                let azi = document.body.querySelector("#info-module-azimuth");
                let lastUpdate = document.body.querySelector("#last-update");
                let statusPanel = document.body.querySelector("#status-panel");
                let statusPanelSpan = document.body.querySelector("#status-panel #status-span");
                if (state.selectedProject.epochTime) {
                    const { days, hours, minutes } = interDate(state.selectedProject.epochTime, myproject[0].timeZone.zoneName);
                    if ((days > 0 || hours > 0 || minutes > 1) && statusPanel) {
                        statusPanel.classList.add("not-active");
                        statusPanelSpan.innerHTML = "Offline";
                    } else {
                        if (statusPanelSpan && statusPanel) {
                            statusPanelSpan.innerHTML = "Online";
                            statusPanel.classList.remove("not-active");
                        }
                    }
                    let lastUpdate = document.body.querySelector("#last-update span");
                    if (lastUpdate) {
                        let stringFormatted = (days > 0) ? `${days}d-` : '';
                        stringFormatted += (hours > 0) ? `${hours}h-` : '';
                        stringFormatted += `${minutes}m`;
                        lastUpdate.innerHTML = stringFormatted;
                    }
                } else {
                    if (elev) {
                        elev.classList.add("no-active");
                        azi.classList.add("no-active");
                        lastUpdate.classList.add("no-active");
                        statusPanel.classList.add("not-active");
                        statusPanelSpan.innerHTML = "Offline";
                        removePanel();
                    }
                }
                // Update time in display
                const comp = new Date(dateOffset.setSeconds(dateOffset.getSeconds() + 1));
                // Update elevation and azimuth target
                sunPosition.setDateTime(comp);
                let formatedDateInput = new Date(comp.toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0];
                dateTime.value = formatedDateInput;
                let momentElevation = parseFloat(await sunPosition.getElevation()).toFixed(3);
                let momentAzimuth = parseFloat(await sunPosition.getAzimuth()).toFixed(3);
                dataTableInfo[0].innerHTML = `Elevação ${momentElevation}°`;
                dataTableInfo[1].innerHTML = `Azimute ${momentAzimuth}°`;
                positionSphereLigth(momentElevation, momentAzimuth)
            };
        } catch (error) {
            state.selectedProject.error = error.message;
            toastify(error.message);
        }
        state.selectedProject.loading = false;
        controlsContainer.querySelector(".info-panel").classList.remove("no-active");
        renderPanel();
    } else {
        controlsContainer.querySelector(".info-panel").classList.add("no-active");
        buttonsContainer.classList.remove("not-active");
    }
}

const View3d = div({ className: "container-full" }, [
    div({ className: "controls-container-left" }, [
        div({ className: "controls-pup" }, [
            select({ onchange: selectProject }, [
                option({ selected: true, value: `default` }, "Simulação"),
                projects.map(project => (
                    option({ selected: project.tag === state.selectedProject.id, value: `${project.tag}` }, project.name)
                ))
            ]),
        ]),
    ]),
    div({ className: "controls-container-right" }, [
        div({ className: "controls" }, [
            div({ className: "title", id: "controls" }, "Controls"),
            form({ action: "", id: "form" },
                groupImputs
            ),
            div({ className: "angles" }, [...Array(9).keys()].map(() =>
                div({ className: "data" })
            ))
        ]),
        BoxInfoPanel
    ]),
    div({ className: "loader no-active" },
        div({ className: "spinner" },
            i({ className: "bx bx-loader-circle icon" })
        )
    ),
]);

// Passar a instancia da area criada para o THREE.js criar
// o canvas em cima
ambientViewSimulation(View3d);

reaction(state, ['user.projects.list'], ([list]) => {
    let intervalRenderProject;
    intervalRenderProject = setInterval(() => {
        let listSelect = document.body.querySelector(".controls-pup");
        const data = state.user.projects.list;
        const updateSelect = select({ onchange: selectProject }, [
            option({ selected: true, value: `default` }, "Simulação"),
            data.map(project => (
                option({ selected: project.tag === state.selectedProject.id, value: `${project.tag}` }, project.name)
            ))
        ]);
        
        if (listSelect !== null && window.location.pathname === "/3d") {
            listSelect.innerHTML = "";
            listSelect.appendChild(updateSelect);
            if (state.selectedProject.id !== "default") {
                updateSelect.dispatchEvent(new Event('change'));
            }
            clearInterval(intervalRenderProject);
        }
    }, 1000);
});

reaction(state, ['selectedProject.loading'], ([loading]) => {
    let loaderSpinner = View3d.querySelector(".loader");
    if (loading) {
        loaderSpinner.classList.remove("no-active");
    } else {
        loaderSpinner.classList.add("no-active");
    }
});

reaction(state, ['selectedProject.id'], ([]) => {
    if (window.location.pathname === "/3d" && state.selectedProject.id) {
        const select = View3d.querySelector("select");
        select.dispatchEvent(new Event('change'));
    }
});

let loadProject = setInterval(() => {
    if (state.selectedProject.id !== "default" && window.location.pathname === "/3d") {
        View3d.querySelector("select").dispatchEvent(new Event('change'));
        clearInterval(loadProject);
    } 
}, 500);

export default View3d;