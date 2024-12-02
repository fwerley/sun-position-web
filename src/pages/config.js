import h from "hyperscript";
import helpers from 'hyperscript-helpers';

const { div, h2 } = helpers(h);

const Config = div({ className: "container" },
    h2("Aqui é a Config")
);

export default Config;