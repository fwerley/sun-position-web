import h from "hyperscript";
import helpers from "hyperscript-helpers";
import { marked } from "marked";
import "./Home.css";

const { div } = helpers(h);


const Home = div({ className: "container" },
    // h2("Aqui é a home"),
    div({ className: "md-container" })
);

const mdContainer = Home.querySelector(".md-container");

export const loadMarkdown = async (file) => {
    try {
        const response = await fetch(`/markdown/${file}`);
        if (!response.ok) throw new Error("Erro ao carregar o arquivo.");
        const markdown = await response.text();

        mdContainer.innerHTML = marked.parse(markdown);

        // Processa links internos
        processInternalLinks();
        Prism.highlightAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        mdContainer.innerHTML = "<p>Erro ao carregar o conteúdo.</p>";
        console.error(error);
    }
}

function processInternalLinks() {
    const links = mdContainer.querySelectorAll("a[href$='.md']");
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const file = link.getAttribute("href");
            history.pushState(null, "", `?file=${file}`);
            loadMarkdown(file);
        });
    });
};

function loadInitialFile() {
    const urlParams = new URLSearchParams(window.location.search);    
    const file = urlParams.get("file") || "home/index.md";
    loadMarkdown(file);
}

window.addEventListener("popstate", () => {
    const file = new URLSearchParams(window.location.search).get("file") || "home/index.md";
    if (file) loadMarkdown(file);
})

loadInitialFile();

export { loadInitialFile }

export default Home;