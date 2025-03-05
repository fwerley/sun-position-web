import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./Modal.css";
import state, { subscribe } from "../../store";
import toastify from "../../helpers/toastify";
import { redirectPage, urlApiRequest } from "../../helpers/utils";

const { div, form, header, h3, i, button, section, footer, input, label } = helpers(h);

const body = document.querySelector("body");
let attempts = 0;

const closeBanner = () => {
    const banner = body.querySelector(".banner");
    banner.classList.add("hidden");
}

const registerOrUpdateProject = async (e) => {
    state.user.projects.loading = true;
    e.preventDefault();
    attempts++;
    const formData = new FormData(e.target);
    const banner = body.querySelector(".banner");
    const name = formData.get("project-name"),
        lat = parseFloat(formData.get("lat")),
        lng = parseFloat(formData.get("lng")),
        idUpdate = formData.get("id-data"),
        isUpdate = formData.get("update-data");
    try {
        let createProject;
        if (isUpdate !== "true") {
            createProject = await fetch(urlApiRequest("project/create"), {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                headers: {
                    Authorization: `Bearer ${state.user.userInfo.stsTokenManager.accessToken}`
                },
                body: JSON.stringify({
                    name,
                    lat,
                    lng
                })
            })
        } else {
            createProject = await fetch(urlApiRequest(`project/${idUpdate}`), {
                method: "PUT",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                headers: {
                    Authorization: `Bearer ${state.user.userInfo.stsTokenManager.accessToken}`
                },
                body: JSON.stringify({
                    name,
                    lat,
                    lng
                })
            })
        }

        let { status, msg, code } = await createProject.json();
        if (status !== "Success") {
            throw new Error(code);
        }
        // Buscar lista atualizada de projetos no banco de dados
        const projects = await fetch(urlApiRequest("project"), {
            method: "GET",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            headers: {
                Authorization: `Bearer ${state.user.userInfo.stsTokenManager.accessToken}`
            }
        })

        let { response, msg: error } = await projects.json();
        if (!response) {
            throw new Error({ code: error.code, });
        }
        state.user.projects.list = response;
        state.user.projects.loading = false;
        localStorage.setItem('userProjects', JSON.stringify(response));
    } catch (error) {
        // Tentar renovar credencias de acesso
        if (error.message === "401" && attempts < 3) {
            alert("unauthorized");
            const apiKey = state.user.userInfo.apiKey;
            const refreshToken = state.user.userInfo.stsTokenManager.refreshToken;
            const updateToken = await fetch(urlApiRequest("service/refresh-token"), {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey,
                    refreshToken,
                })
            });
            const response = updateToken.json();
            state.user.userInfo.stsTokenManager.refreshToken = response.refresh_token;
            state.user.userInfo.stsTokenManager.accessToken = response.access_token;
            localStorage.setItem('userInfo', JSON.stringify(state.user.userInfo));
            // Verificar como fazer o ressunimit
            const formProject = document.body.querySelector("#form-project");
            formProject.dispatchEvent(new Event('submit'));
        } else {
            try {
                const logout = await fetch(urlApiRequest("user/logout"), {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    }
                })

                let { status, msg } = await logout.json();
                if (status === "Failed") {
                    throw new Error(msg.code);
                }
                state.user.userInfo = {};
                localStorage.setItem('userInfo', JSON.stringify({}));
                state.user.projects = {
                    loading: false,
                    error: "",
                    list: []
                };
                state.user.loading = false;
                localStorage.setItem('userProjects', JSON.stringify([]));
                toastify("Faça login e tente novamente");
                redirectPage("/login");
            } catch (error) {
                state.user.userInfo = {};
                state.user.loading = false;
                state.user.error = error.message;
                toastify(error.message);
            }
        }
        console.log(error);
        state.user.projects.loading = false;
        state.user.projects.error = error.message;
        toastify(error.message);
    }
    banner.classList.add("hidden");
}

body.addEventListener('keydown', function (e) {
    if (e.key == "Escape") {
        const banner = body.querySelector(".banner");
        banner.classList.add("hidden");
    }
});

const Modal = (values = null) => div({ className: "modal" }, [
    form({ className: "modal-container", id: "form-project", onsubmit: registerOrUpdateProject }, [
        header({ className: "modal-container-header" }, [
            h3({ className: "modal-container-title" }, [
                i({ className: "bx bxs-layer-plus" }),
                "Novo Projeto"
            ]),
            button({ type: "button", className: "icon-button", style: { color: "#707070" }, onclick: closeBanner },
                i({ className: "bx bx-x" }),
            )
        ]),
        section({ className: "modal-container-body rtf" }, [
            div({ className: "modal-column" }, [
                div({ className: "modal-line" }, [
                    label(i({ className: "bx bxs-purchase-tag-alt" })),
                    input({ 
                        type: "text", 
                        placeholder: "Nome do projeto", 
                        name: "project-name",
                        required: true, 
                        value: values && values.name })
                ]),
                div({ className: "modal-line" }, [
                    label(i({ className: "bx bxs-map" })),
                    input({
                        type: "text",
                        placeholder: "Latitude",
                        name: "lat",
                        pattern: "[\\d\\(\\)\\-+]{1,3}.[\\d]{3,7}",
                        required: true,
                        value: values && values.lat
                    })
                ]),
                div({ className: "modal-line" }, [
                    label(i({ className: "bx bxs-map" })),
                    input({
                        type: "text",
                        placeholder: "Longitude",
                        name: "lng",
                        pattern: "[\\d\\(\\)\\-+]{1,4}.[\\d]{3,7}",
                        required: true,
                        value: values && values.lng
                    })
                ]),
                input({ type: "hidden", value: values && values.tag, name: "id-data" }),
                input({ type: "hidden", value: values !== null ? true : false, name: "update-data" }),
            ])
        ]),
        footer({ className: "modal-container-footer" }, [
            button({ type: "button", className: "is-ghost", onclick: closeBanner, disabled: state.user.projects.loading }, "Cancelar"),
            button({ className: "is-primary", disabled: state.user.projects.loading }, "Concluir")
        ])
    ])
]);

subscribe(state.user, () => {
    const modalContainer = document.body.querySelector(".modal-container-body");
    if (state.user.projects.loading) {
        let loaderSpinner = div({ className: "loader" },
            div({ className: "spinner" },
                i({ className: "bx bx-loader-circle icon" })
            )
        );
        modalContainer.innerHTML = "";
        modalContainer.appendChild(loaderSpinner);
    }
});

export default Modal;