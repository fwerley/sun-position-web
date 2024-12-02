import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import { ambientViewSimulation } from "../ambient-view-simulation";
import state from "../../store";

import "./view-3d.css";
import BoxInfoPanel from "../../components/BoxInfoPanel";

const { div, form, label, input, select, option } = helpers(h);
const projects = state.user.projects.map(project => {
    return {
        name: project.name,
        paramUrl: project.name.trim().toLowerCase().replace(/\s/g, "-") 
    }
});

const lineImputs = (forImput, lab, typeImput, nameImput, valueImput) => div([
    label({ for: forImput }, lab),
    input({ type: typeImput, name: nameImput, id: forImput, value: valueImput })
]);

const groupImputs = div([
    div([
        lineImputs("lat", "Latitude", "number", "latitude", ""),
        lineImputs("lng", "Longitude", "number", "longitude", ""),
        lineImputs("date", "Datetime", "datetime-local", "date", "")
    ]),
    div({ style: { "flex-direction": "row", "justify-content": "space-around" } }, [
        lineImputs("play", "", "button", "play", "Play"),
        lineImputs("pause", "", "button", "pause", "Pause"),
        lineImputs("now", "", "button", "now", "Now")
    ])
]);

const testSelect = (event) => {
    state.selectedProject.id = event.target.value;
    localStorage.setItem('selectProject', JSON.stringify({id: event.target.value}));
    history.pushState("3d", "3d", `?project=${event.target.value}`);
}

const View3d = div({ className: "container-full" }, [
    div({ className: "controls-container-left" }, [
        div({ className: "controls-pup" }, [
            select({ onchange: testSelect }, [
                option({ selected: true, value: `default` }, "Simulação"),
                projects.map(project => (
                    option({ selected: project.paramUrl === state.selectedProject.id, value: `${project.paramUrl}` }, project.name)
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
]);

// Passar a instancia da area criada para o THREE.js criar
// o canvas em cima
ambientViewSimulation(View3d);

export default View3d;