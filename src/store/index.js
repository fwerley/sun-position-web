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

export const reaction = (
    state,
    keys,
    action
) => {
    let changed = false;
    const values = new Map();

    return subscribe(state, () => {
        keys.forEach(key => {
            const props = key.split('.');
            let value = state;
            props.forEach(prop => {
                value = value[prop];
            });

            if (values.get(key) !== value) {
                changed = true;
                values.set(key, value);
            }
        });
        if (changed) {
            action(Array.from(values.values()));
            changed = false;
        }
    });
};

devtools(state, { name: 'User', enabled: true });

export default state;

export { snapshot, subscribe };