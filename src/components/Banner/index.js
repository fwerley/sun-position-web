import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./Banner.css";
import Modal from "../Modal";

const { div, h1 } = helpers(h);

const Banner = (item) => div({className: "banner"},[
    Modal
]);

export default Banner;