import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import "./Main.css";

const { section, div } = helpers(h);

const Main = section({ className: "main" }, [
    // div({ className: "container" })
]);

export default Main;