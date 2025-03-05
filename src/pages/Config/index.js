import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import "./Config.css";
import state, { reaction, subscribe } from "../../store";
import toastify from "../../helpers/toastify";
import { urlApiRequest } from "../../helpers/utils";

const { div, h2, h3, hr, button, i } = helpers(h);

const infoUserTable = (user) => div([
    div({ className: "block-container" }, [
        h3("Meus dados"),
        hr(),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "Nome"),
            div({ className: "item-value" }, user.userInfo.providerData && user.userInfo.providerData[0].displayName),
        ]),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "Email"),
            div({ className: "item-value" }, user.userInfo.email),
        ])
    ]),
    div({ classname: "block-container" }, [
        h3("Credenciais"),
        hr(),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "API Key"),
            (user.userInfo.userApiKey !== undefined) ? [
                div({ className: "item-value1", id: "user-api-key" }, user.userInfo.userApiKey),
                div({ className: "item-value2" },
                    button({
                        className: 'is-primary', title: "Gráfico API Key",
                    }, i({ className: 'bx bx-line-chart' })),
                )] : (
                div({ className: "item-value" },
                    button({
                        className: 'is-primary',
                        title: "Criar chave",
                        id: "btn-create-api-key"
                    }, i({ className: 'bx bxs-key' }), "Gerar chave")
                )
            ),
        ]),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "ID User"),
            div({ className: "item-value" }, user.userInfo.uid),
        ]),
    ])
]);

const getApiKey = async () => {
    state.user.loading = true;
    try {
        const APIKey = await fetch(urlApiRequest("service/api-key"), {
            method: "GET",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            headers: {
                Authorization: `Bearer ${state.user.userInfo.stsTokenManager.accessToken}`
            }
        })

        let { response, status } = await APIKey.json();
        if (status === "Success") {
            state.user.userInfo.userApiKey = response?.apiKey.key;
            localStorage.setItem('userInfo', JSON.stringify(state.user.userInfo));
        }
        state.user.loading = false;
    } catch (error) {
        state.user.loading = false;
        state.user.error = error.message;
        toastify(error.message);
    }
}
const createApiKey = async () => {
    state.user.loading = true;
    try {
        const response = await fetch(urlApiRequest("service/generate-api-key"), {
            method: "GET",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            headers: {
                Authorization: `Bearer ${state.user.userInfo.stsTokenManager.accessToken}`
            }
        });
        state.user.loading = false;
        if (response.ok) {
            getApiKey();
        } else {
            throw new Error(`${response.statusText}. Renove suas credenciais`);
        }
    } catch (error) {
        state.user.loading = false;
        state.user.error = error.message;
        toastify(error.message);
    }
}

const Config = div({ className: "container container-full" },
    h2("Configurações"),
    div({ className: "config-container" }, [
        infoUserTable(state.user)
    ])
);
const configContainer = Config.querySelector(".config-container");
let btnCreateApiKey;

subscribe(state.user, async () => {
    if (state.user.userInfo.uid && window.location.pathname === "/login") {
        configContainer.innerHTML = "";
        configContainer.appendChild(infoUserTable(state.user));
    }
    if (state.user.userInfo.userApiKey) {
        configContainer.innerHTML = "";
        configContainer.appendChild(infoUserTable(state.user));
    } else {
        btnCreateApiKey = Config.querySelector("#btn-create-api-key");
        if (btnCreateApiKey !== null) {
            btnCreateApiKey.onclick = async () => {
                createApiKey();
            }
        }
    }
})

reaction(state, ["user.loading", "user.userInfo"], async ([loading, userInfo]) => {
    btnCreateApiKey = Config.querySelector("#btn-create-api-key");
    if (userInfo.userApiKey === undefined && btnCreateApiKey !== null) {
        btnCreateApiKey.disabled = loading;
        if (loading) {
            btnCreateApiKey.innerHTML = "";
            btnCreateApiKey.disabled = true;
            btnCreateApiKey.append(div({ className: "spinner" }, i({ className: "bx bx-loader-circle icon" })), "Gerar chave");
        } else {
            btnCreateApiKey.innerHTML = "";
            btnCreateApiKey.append(i({ className: 'bx bxs-key' }), "Gerar chave");
        }
    }
})


export default Config;