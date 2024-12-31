import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./boxInfoPanel.css";


const { div, form } = helpers(h);

const InfoPanel = () => div({ className: "info-panel" }, [
    div({ className: "title", id: "info-panel" }, "Module info"),
    form({ action: "", id: "form" },
        // groupImputs
    )
]);

export default InfoPanel;
