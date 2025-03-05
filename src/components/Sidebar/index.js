import h from "hyperscript";
import helpers from 'hyperscript-helpers';
import logo from '../../../sun-position-ico.png';

import "./Sidebar.css";
import NavLinkItem from "./NavLinkItem";
import { redirectPage, urlApiRequest } from "../../helpers/utils";
import state, { subscribe } from "../../store";
import toastify from "../../helpers/toastify";
import { clearMarkdown, extractSnippets, highlightText, search } from "../Search/search";
import { processInternalLinksSearch } from "../Search";

const { nav, header, div, span, img, i, input, ul, li, a } = helpers(h);

// Atualiza todos os botões se o usuario loggar osu deslogar
subscribe(state.user, () => {
    if (state.user.userInfo.uid) {
        btnLogin.firstChild.classList.add("hide");
        btnLogin.lastChild.classList.remove("hide");
        profile.parentNode.classList.remove("hide");
        config.parentNode.classList.remove("hide");
    } else {
        btnLogin.firstChild.classList.remove("hide");
        btnLogin.lastChild.classList.add("hide");
        profile.parentNode.classList.add("hide");
        config.parentNode.classList.add("hide");
    }
});

const Sidebar = nav({ className: "sidebar close" }, [
    header([
        div({ className: "image-text" }, [
            span({ className: "image" }, [
                img({ src: logo })
            ]),
            div({ className: "text logo-text" }, [
                span({ className: "name" }, "Sun Position"),
                span({ className: "profession" }, "Platform")
            ])
        ]),
        i({ className: "bx bx-chevron-right toggle" })
    ]),
    div({ className: "menu-bar" }, [
        div({ className: "menu" }, [
            li({ className: "search-box" }, [
                i({ className: "bx bx-search icon" }),
                input({ type: "text", placeholder: "Pesquisar...", id: "searchInput" })
            ]),
            ul({ className: "menu-links" }, [
                NavLinkItem({ href: "/", id: "home", icon: "bx-home-alt", name: "Home" }),
                NavLinkItem({ href: `/3d${state.selectedProject && `?project=` + state.selectedProject.id}`, id: "three-d", icon: "bxs-analyse", name: "3D View" }),
                NavLinkItem({ href: "/api", id: "api", icon: "bxl-graphql", name: "API" }),
                NavLinkItem({ href: "/download", id: "download", icon: "bx-cloud-download", name: "Download" }),
                NavLinkItem({ href: "/profile", id: "profile", icon: "bx-user", name: "Profile", customClass: "hide" }),
                NavLinkItem({ href: "/config", id: "config", icon: "bx-cog", name: "Config", customClass: "hide" })
            ]),
        ]),
        div({ className: "bottom-content" }, [
            li({ className: "btn-login-logout" }, [
                a({ href: "/login", id: "login" }, [
                    i({ className: "bx bx-log-in icon" }),
                    span({ className: "text nav-text" }, "Login")
                ]),
                a({ className: "hide", href: "#" }, [
                    i({ className: "bx bx-log-out icon" }),
                    span({ className: "text nav-text" }, "Logout")
                ])
            ]),
            li({ className: "mode" }, [
                div({ className: "sun-moon" }, [
                    i({ className: "bx bx-moon icon moon" }),
                    i({ className: "bx bx-sun icon sun" }),
                ]),
                span({ className: "mode-text text" }, "Dark mode"),
                div({ className: "toggle-switch" }, [
                    span({ className: "switch" })
                ])
            ])
        ])
    ])
]);

const body = document.querySelector('body'),
    sidebar = Sidebar,
    toggle = sidebar.querySelector(".toggle"),
    profile = sidebar.querySelector("#profile"),
    config = sidebar.querySelector("#config"),
    searchBtn = sidebar.querySelector(".search-box"),
    searchInput = sidebar.querySelector("#searchInput"),
    modeSwitch = sidebar.querySelector(".toggle-switch"),
    btnLogin = sidebar.querySelector(".btn-login-logout"),
    modeText = sidebar.querySelector(".mode-text"),
    page3dUrl = sidebar.querySelector('#three-d'),
    allNavLinks = sidebar.querySelectorAll(".menu-links a, .bottom-content a");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

let timeout;
searchInput.addEventListener("input", (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length > 2) {
            const results = search(query);
            displayResults(results, query);
        }
    }, 500);
})

function displayResults(results, query) {
    const listItems = div({className: "list-items"});
    results.forEach(file => {
        const snippets = extractSnippets(file.rawContent, query, 100);
        const resultItem = document.createElement("a");
        resultItem.classList.add("result-item");
        
        const snippetsHTML = snippets.map(snippet => `<p>${highlightText(snippet, query)}</p>`).join('');
        const content = clearMarkdown(snippetsHTML);
        const linkPathItem = file.path.split('/').slice(3).join('/');
        resultItem.innerHTML = `
        <h3>${linkPathItem}</h3>
        ${content}
        `;
        resultItem.href = linkPathItem;
        listItems.appendChild(resultItem);
        redirectPage(`/search`);
        history.pushState({ query }, null, `/search?query=${query}`);
    })
    const searchContainer = document.querySelector(".search-container");
    searchContainer.innerHTML = "";
    searchContainer.appendChild(listItems);
    processInternalLinksSearch();
}

searchBtn.addEventListener("click", () => {
    sidebar.classList.remove("close");
});

btnLogin.lastChild.addEventListener("click", async (e) => {
    e.preventDefault();
    state.user.loading = true;
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
        state.selectedProject = {
            loading: false,
            error: ""
        }
        state.user.loading = false;
        localStorage.setItem('userProjects', JSON.stringify([]));
        localStorage.setItem('selectProject', undefined);
        redirectPage("/");
    } catch (error) {
        state.user.userInfo = {};
        state.user.loading = false;
        state.user.error = error.message;
        toastify(error.message);
    }

});

if (state.config.lightMode === true) {
    body.classList.add("dark");
    modeText.innerText = "Light mode";
}

// Verifica se o usuario está logado
if (state.user.userInfo.uid) {
    btnLogin.firstChild.classList.add("hide");
    btnLogin.lastChild.classList.remove("hide");
    profile.parentNode.classList.remove("hide");
    config.parentNode.classList.remove("hide");
} else {
    btnLogin.firstChild.classList.remove("hide");
    btnLogin.lastChild.classList.add("hide");
    profile.parentNode.classList.add("hide");
    config.parentNode.classList.add("hide");
}

modeSwitch.addEventListener("click", () => {
    body.classList.toggle("dark");
    if (body.classList.contains("dark")) {
        modeText.innerText = "Light mode";
    } else {
        modeText.innerText = "Dark mode";
    }
});

allNavLinks.forEach(element => {
    element.addEventListener("click", (e) => {
        e.preventDefault();
        const linkPath = element.getAttribute("href");
        redirectPage(linkPath);
    })
});

let selected = '';

subscribe(state.selectedProject, () => {
    selected = JSON.stringify(state.selectedProject) !== '{}' ?
        `/3d?project=${state.selectedProject.id}` : '';
    page3dUrl.href = selected;
});


export default Sidebar;