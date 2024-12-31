import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./Banner.css";

const { div } = helpers(h);

const Banner = () => div({ className: "banner hidden" });

export default Banner;