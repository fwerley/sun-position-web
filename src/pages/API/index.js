import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import { urlApiRequest } from "../../helpers/utils";
import "./API.css";

const { div, h2, i, embed } = helpers(h);

const Api = div({ className: "container" }, [
    embed({ className: "embed-api", src: "https://us-central1-sun-position-app.cloudfunctions.net/app/v1/docs/#/" }),
]
);

export default Api;