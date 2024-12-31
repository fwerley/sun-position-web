import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import { marked } from "marked";
import "./Home.css";

import mdTest from '../../assets/MD/test.md';

const { div, h2 } = helpers(h);


const Home = div({ className: "container" },
    // h2("Aqui é a home"),
    div({ className: "md-container" })
);

const mdContainer = Home.querySelector(".md-container");

const readMD = async (filePath) => {
    const md = await fetch(mdTest);
    const response = await md.text();
    const html = marked.parse(response);
    mdContainer.innerHTML = html;
}

readMD();

export default Home;