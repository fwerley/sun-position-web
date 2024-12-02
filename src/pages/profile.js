import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import DataTable from "../components/DataTable";
import state, { subscribe } from "../store/index";

const { div, h2, i, button } = helpers(h);

const labels = ['Tag', 'Nome', 'Latitude', "Longitude", "Criado"];

const Profile = div({ className: "container" }, [
    h2("Meus projetos"),
    div({ className: "table-profile" }),
    // h2("Novo projeto"),
    div({}, button([
         i({ className: "bx bxs-layer-plus" }),
        "Novo Projeto"
    ]))
]);

const refRender = Profile.querySelector(".table-profile");
DataTable(refRender, labels, state.user.projects);

subscribe(state.user, () => {
    refRender.innerHTML = "";
    if (state.user.projects.length > 0) {
        DataTable(refRender, labels, state.user.projects);
    } else {
        DataTable(refRender, labels);
    }
});

export default Profile;