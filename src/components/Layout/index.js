import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "prismjs/themes/prism-okaidia.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import Prism from "prismjs";

import Subjects from "../../helpers/subject";
import Sidebar from "../sidebar";
import Main from "../Main";
import Banner from "../Banner";
import changeContent from "../../helpers/change-content";

import "./Layout.css";

window.addEventListener('load', function () {
    Prism.highlightAll();
});

const { div } = helpers(h);

const PageLayout = div([
    Banner,
    Sidebar,
    Main
]);

Subjects.subscribePageObservers(changeContent);

export default PageLayout;