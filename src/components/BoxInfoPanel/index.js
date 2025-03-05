import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./boxInfoPanel.css";
import state, { subscribe } from "../../store";
import { interDate } from "../../helpers/utils";


const { div, span } = helpers(h);

const InfoPanel = () => div({ className: "info-panel no-active" }, [
    div({ className: "title", id: "info-panel" }, [
        "Info Solar Panel"
    ]),
    div({ className: "detail-module" }, [
        div({ className: "row-info-panel status-panel", id: "status-panel" }, [
            div({ className: "pulse" }, [
                span({ style: { "--i": "0" } }),
                span({ style: { "--i": "1" } }),
                span({ style: { "--i": "2" } }),
                span({ style: { "--i": "3" } }),
            ]),
            span({ id: "status-span" }, "Online")
        ]),
        div({ className: "row-info-panel", id: "info-module-elevation" }, [
            `Elevação ${state.selectedProject.elevation}°`
        ]),
        div({ className: "row-info-panel", id: "info-module-azimuth" }, [
            `Azimute ${state.selectedProject.azimuth}°`
        ]),
        div({ className: "row-info-panel last-update", id: "last-update" }, [
            `Ultima atualização`,
            span()
        ]),
    ])
]);


subscribe(state.selectedProject, () => {
    let elev = document.body.querySelector("#info-module-elevation");
    let azi = document.body.querySelector("#info-module-azimuth");
    let lastUpdate = document.body.querySelector("#last-update");
    let statusPanel = document.body.querySelector("#status-panel");
    let statusPanelSpan = document.body.querySelector("#status-panel #status-span");
    if (state.selectedProject.elevation !== undefined && state.selectedProject.azimuth !== undefined && elev) {
        elev.classList.remove("no-active");
        azi.classList.remove("no-active");
        lastUpdate.classList.remove("no-active");
        elev.innerHTML = `Elevação ${state.selectedProject.elevation}°`;
        azi.innerHTML = `Azimute ${state.selectedProject.azimuth}°`;
    } else {
        if (elev) {
            elev.classList.add("no-active");
            azi.classList.add("no-active");
            lastUpdate.classList.add("no-active");
            statusPanel.classList.add("not-active");
            statusPanelSpan.innerHTML = "Offline";
        }
    }
})

export default InfoPanel;
