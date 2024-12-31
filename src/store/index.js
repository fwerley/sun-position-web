import { proxy, snapshot, subscribe } from "valtio/vanilla";
import { devtools } from "valtio/vanilla/utils";

const user = localStorage.getItem("userInfo");
const projects = localStorage.getItem("userProjects");
const config = localStorage.getItem("userConfig");
const selectProject = localStorage.getItem("selectProject");

const state = proxy({
    user: {
        userInfo: user && user !== "undefined" ? JSON.parse(user) : {},
        projects: {
            loading: false,
            error: "",
            list: projects && user !== "undefined" ? JSON.parse(projects) : []
        },
        loading: false,
        error: ""
    },
    selectedProject: selectProject && selectProject !== "undefined" ? 
    {
        id: JSON.parse(selectProject).id,
        loading: false,
        error: ""
    } : {
        loading: false,
        error: ""
    },
    config: config && config !== "undefined" ? JSON.parse(config) : {}
});

devtools(state, { name: 'User', enabled: true })

export default state;

export { snapshot, subscribe };