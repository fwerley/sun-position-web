import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import Subjects from "../../helpers/subject";
import Sidebar from "../sidebar";
import Main from "../Main";
import Banner from "../Banner";
import changeContent from "../../helpers/change-content";
import "./Layout.css";

const { div } = helpers(h);

const PageLayout = div([
    Banner,
    Sidebar,
    Main
]);

Subjects.subscribePageObservers(changeContent);

export default PageLayout;