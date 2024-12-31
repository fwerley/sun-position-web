import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import "./Config.css";
import state, { subscribe } from "../../store";

const { div, h2, h3, hr, button, i } = helpers(h);

const infoUserTable = div([
    div({ className: "block-container" }, [
        h3("Meus dados"),
        hr(),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "Nome"),
            div({ className: "item-value" }, state.user.userInfo.providerData && state.user.userInfo.providerData[0].displayName),
        ]),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "Email"),
            div({ className: "item-value" }, state.user.userInfo.email),
        ])
    ]),
    div({ classname: "block-container" }, [
        h3("Credenciais"),
        hr(),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "API Key"),
            div({ className: "item-value1", id: "user-api-key" }, state.user.userInfo.userApiKey && state.user.userInfo.userApiKey.key),
            div({ className: "item-value2" },
                button({
                    className: 'is-primary', title: "Gráfico API Key",
                }, i({ className: 'bx bx-line-chart' })),
            ),
        ]),
        div({ className: "item-container" }, [
            div({ className: "item-key" }, "ID User"),
            div({ className: "item-value" }, state.user.userInfo.uid),
        ]),
    ])
]);

const Config = div({ className: "container container-full" },
    h2("Configurações"),
    div({ className: "config-container" }, [
        infoUserTable
    ])
);

subscribe(state.user, async () => {
    if (state.user.userInfo.uid && window.location.pathname === "/login") {
        const configContainer = Config.querySelector(".config-container");
        configContainer.innerHTML = "";
        configContainer.appendChild(infoUserTable);

    }
    if (state.user.userInfo.userApiKey?.key) {
        const infoConfigKey = Config.querySelector("#user-api-key");
        infoConfigKey.innerHTML = state.user.userInfo.userApiKey.key;
    }
})

export default Config;