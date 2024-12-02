import h from "hyperscript";
import helpers from 'hyperscript-helpers';

const { div, h2 } = helpers(h);

const Home = div({ className: "container" },
    h2("Aqui é a home")
);

export default Home;