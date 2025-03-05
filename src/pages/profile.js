import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import DataTable, { grid, formatDataTableItem, gridH } from "../components/DataTable";
import state, { reaction, subscribe } from "../store/index";
import Modal from "../components/Modal";
import { urlApiRequest } from "../helpers/utils";
import toastify from "../helpers/toastify";

const { div, h2, i, button } = helpers(h);

const editItemHandler = (row) => {
    const infoProject = {
        name: row.cells[1].data,
        lat: row.cells[2].data,
        lng: row.cells[3].data,
        tag: row.cells[0].data,
    }
    const banner = body.querySelector(".banner");
    banner.classList.remove("hidden");
    banner.innerHTML = "";
    banner.appendChild(Modal(infoProject));
}

const deleteItemHandler = async (row) => {
    if (confirm(`Deletando "${row.cells[1].data}"`)) {
        state.user.projects.loading = true;
        try {
            const deleteItem = await fetch(urlApiRequest(`project/${row.cells[0].data}`), {
                method: "DELETE",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                headers: {
                    Authorization: `Bearer ${state.user.userInfo.stsTokenManager.accessToken}`
                }
            })

            let { status, msg, code } = await deleteItem.json();
            if (status !== "Success") {
                throw new Error(code, msg);
            }

            state.user.projects.list = state.user.projects.list.filter(item => item.tag !== row.cells[0].data);
            state.user.projects.loading = false;
            localStorage.setItem('userProjects', JSON.stringify(state.user.projects.list));
        } catch (error) {
            console.log(error);
            state.user.projects.loading = false;
            state.user.projects.error = error.message;
            toastify(error.message);
        }
    }
}

const labels = ['Tag', 'Nome', 'Latitude', "Longitude", "Criado", {
    name: "Ação",
    formatter: (cell, row) => {
        return gridH("div", {
            className: "action-buttons"
        }, [
            gridH('button', {
                className: 'is-primary', title: "Alterar",
                onClick: () => editItemHandler(row)
            }, gridH('i', { className: 'bx bx-pencil' })),
            gridH('button', {
                className: 'is-ghost',
                style: { color: "lightpink" }, title: "Deletar",
                onClick: () => deleteItemHandler(row)
            }, gridH('i', { className: 'bx bx-trash' })),
        ]);
    }
}];

const Profile = div({ className: "container container-full" }, [
    h2("Meus projetos"),
    div({ className: "table-profile" }),
    // h2("Novo projeto"),
    div({ id: "btn-new-project" }, button({ className: "is-primary" }, [
        i({ className: "bx bxs-layer-plus" }),
        "Novo Projeto"
    ]))
]);

const refRender = Profile.querySelector(".table-profile");
DataTable(refRender, labels, state.user.projects.list);

reaction(state, ['user.projects.list'], () => {
    const data = formatDataTableItem(state.user.projects.list);
    grid.updateConfig({ data }).forceRender();
});

const body = document.querySelector("body"),
    btnNewProject = Profile.querySelector("#btn-new-project button");

btnNewProject.onclick = () => {
    const banner = body.querySelector(".banner");
    banner.classList.remove("hidden");
    banner.innerHTML = "";
    banner.appendChild(Modal());
}

export default Profile;