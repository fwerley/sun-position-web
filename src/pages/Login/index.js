import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import state, { snapshot, subscribe } from "../../store";
import toastify from "../../helpers/toastify";
import "./Login.css";
import { redirectPage, urlApiRequest } from "../../helpers/utils";

const { div, input, p, a, form } = helpers(h);
const redirectInUrl = new URLSearchParams(window.location.search).get('redirect');
const redirect = redirectInUrl ? redirectInUrl : '/';

// Irá verificar mudanças nos nos filhos de userInfo, não no userInfo todo
// Só poderá increver objetos que tenham filhos aninhados, não sendo possivel se increver em bojetos simple
// tipo chave: valor
subscribe(state.user, async () => {
    if (state.user.userInfo.uid && window.location.pathname === "/login") {
        redirectPage(redirect);
        // If API Key, get
        const APIKey = await fetch(urlApiRequest("service/api-key"), {
            method: "GET",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            headers: {
                Authorization: state.user.userInfo.stsTokenManager.accessToken
            }
        })

        let { response: responseApiKey, status: statusApiKey } = await APIKey.json();
        if(statusApiKey === "Success") {
            state.user.userInfo.userApiKey = responseApiKey.apiKey;
            localStorage.setItem('userInfo', JSON.stringify(state.user.userInfo));
        }
    }
});

const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    state.user.loading = true;
    try {
        const login = await fetch(urlApiRequest("user/login"), {
            method: "POST",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get("email"),
                password: formData.get("password")
            })
        })

        let { user, status, msg } = await login.json();
        if (user === undefined) {
            throw new Error(msg.code);
        }
        state.user.userInfo = user;
        state.user.loading = false;        
        localStorage.setItem('userInfo', JSON.stringify(state.user.userInfo));
        toastify("Login efetuado");
        // -----------------------------------------------------
        toastify("Buscando projetos");
        const projects = await fetch(urlApiRequest("project"), {
            method: "GET",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            headers: {
                Authorization: state.user.userInfo.stsTokenManager.accessToken
            }
        })

        let { response, msg: error } = await projects.json();
        if (!response) {
            throw new Error(error.code);
        }
        state.user.projects.list = response;
        state.user.projects.loading = false;
        localStorage.setItem('userProjects', JSON.stringify(response));
        toastify("Lista de projetos atualizada");
    } catch (error) {
        state.user.userInfo = {};
        state.user.loading = false;
        state.user.error = error.message;
        toastify(error.message);
    }
};

const LoginPage = div({ className: "container container-full" },
    div({ className: "login-page" }, [
        div({ className: "form" }, [
            form({ className: "register-form no-height" }, [
                input({ type: "text", placeholder: "nome", name: "nome" }),
                input({ type: "email", placeholder: "email", name: "email" }),
                input({ type: "password", placeholder: "senha", name: "password" }),
                input({ className: "is-primary", type: "submit", value: "Cadastrar" }),
                p({ className: "message" }, [
                    "Já fez seu cadastro? ",
                    a({ href: "#" }, "Logar")
                ])
            ]),
            form({ className: "login-form", onsubmit: submitHandler }, [
                input({ type: "email", placeholder: "email", name: "email" }),
                input({ type: "password", placeholder: "senha", name: "password" }),
                input({ className: "is-primary", type: "submit", value: "Login" }),
                p({ className: "message" }, [
                    "Ainda não se cadastrou? ",
                    a({ href: "#" }, "Criar conta")
                ])
            ]),
        ])
    ])
);

const allLinks = LoginPage.querySelectorAll(".message a"),
    forms = LoginPage.querySelectorAll("form");

allLinks.forEach(element => {
    element.addEventListener("click", (e) => {
        e.preventDefault();
        forms.forEach(form => form.classList.toggle("no-height"));
    })
});

export default LoginPage;