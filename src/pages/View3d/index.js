import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import { ambientViewSimulation, positionSphereLigth } from "../ambient-view-simulation";
import { SunPosition } from "sun-position";
import Worker from "../../helpers/worker?worker"
import state, { subscribe } from "../../store";

import "./view-3d.css";
import BoxInfoPanel from "../../components/BoxInfoPanel";
import { urlApiRequest } from "../../helpers/utils";
import toastify from "../../helpers/toastify";

const { div, form, label, input, select, option, i } = helpers(h);
let sunPosition,
    intervalWorker = new Worker();
const projects = state.user.projects.list.map(project => {
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
    state.selectedProject.id = event.target.value;
    localStorage.setItem('selectProject', JSON.stringify({ id: event.target.value }));
    history.pushState("3d", "3d", `?project=${event.target.value}`);
    const myproject = state.user.projects.list.filter(item => item.tag === event.target.value);
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
        sunPosition = new SunPosition(myproject[0].lat, myproject[0].lng, new Date());
        buttonsContainer.classList.add("not-active");
        try {
            const getTimeZone = await fetch(urlApiRequest(`service/time-zone`), {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                headers: {
                    'x-user-id': state.user.userInfo.uid,
                    'x-api-key': state.user.userInfo.userApiKey.key
                },
                body: JSON.stringify({
                    lat: parseFloat(myproject[0].lat),
                    lng: parseFloat(myproject[0].lng)
                })
            })
            let { data, timeZone, error, status } = await getTimeZone.json();
            if (status !== "Success") {
                throw new Error(error);
            }
            let date = new Date(new Date().toLocaleString('en', { timeZone: timeZone.zoneName })
                .toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0];
            dateTime.value = date;
            dateTime.dispatchEvent(new Event('input'));
            // -------------------------------------
            let dateOffset = new Date(date);
            sunPosition.setDateTime(dateOffset);
            intervalWorker.onmessage = async () => {
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
    } else {
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

let intervalRenderProject = setInterval(() => {
    if (state.selectedProject !== "undefined" && window.location.pathname === "/3d") {
        let selectControl = View3d.querySelector("select");
        selectControl.dispatchEvent(new Event('change'));
        clearInterval(intervalRenderProject);
    }
}, 500);

subscribe(state.user, async () => {
    if (projects.length !== state.user.projects.list.length) {
        const containerSelect = View3d.querySelector(".controls-pup");
        containerSelect.innerHTML = "";
        let projectsUpdate = state.user.projects.list.map(project => {
            return {
                name: project.name,
                paramUrl: project.name.trim().toLowerCase().replace(/\s/g, "-"),
                tag: project.tag
            }
        });
        const updateSelect = select({ onchange: selectProject }, [
            option({ selected: true, value: `default` }, "Simulação"),
            projectsUpdate.map(project => (
                option({ selected: project.tag === state.selectedProject.id, value: `${project.tag}` }, project.name)
            ))
        ]);
        containerSelect.appendChild(updateSelect);
    }
})

subscribe(state.selectedProject, async () => {
    let loaderSpinner =  View3d.querySelector(".loader")
    if (state.selectedProject.loading) {
        loaderSpinner.classList.remove("no-active");
    } else {
        loaderSpinner.classList.add("no-active");
    }
})

export default View3d;