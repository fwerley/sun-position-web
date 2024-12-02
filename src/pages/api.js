import h from "hyperscript";
import helpers from 'hyperscript-helpers';

const { div, h2 } = helpers(h);

const Api = div({ className: "container" },
    h2("Aqui é a API")
);

export default Api;