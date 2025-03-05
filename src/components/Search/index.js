import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./Search.css";
import { loadMarkdown } from "../../pages/Home";
import { redirectPage } from "../../helpers/utils";

const { div, h2 } = helpers(h);

const Search = div({ className: "container" }, [
    div({ className: "search-container" })
]);

export function processInternalLinksSearch() {
    const links = Search.querySelectorAll("a[href$='.md']");
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const file = link.getAttribute("href");
            redirectPage(`/`);
            history.pushState(null, "", `${window.location.origin}?file=${file}`);
            loadMarkdown(file);
        });
    });
};

export default Search;