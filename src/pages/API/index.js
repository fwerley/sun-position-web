import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import { urlApiRequest } from "../../helpers/utils";
import "./API.css";

const { div, h2, iframe } = helpers(h);

const Api = div({ className: "container" }, [
    iframe({ src: urlApiRequest("doc/#/") })
]
);

export default Api;