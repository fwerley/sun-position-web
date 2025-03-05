import Home from "../pages/Home";
import Api from "../pages/API";
import Config from "../pages/Config";
import Profile from "../pages/profile";
import View3d from "../pages/View3d";
import LoginPage from "../pages/Login";
import Download from "../pages/Download";
import Search from "../components/Search";
import state from "../store";
import { loadInitialFile } from "../pages/Home/index"

const redirectInUrl = new URLSearchParams(window.location.search).get('redirect');
const redirect = redirectInUrl ? redirectInUrl : '/';

let changeContent = page => {
    const newContent = c => {
        const mainContainer = document.querySelector(".main");
        mainContainer.innerHTML = "";
        mainContainer.appendChild(c);
    }
    switch (page) {
        case '':
            loadInitialFile();
        case 'home':
            return newContent(Home);
        case 'search':
            return newContent(Search);
        case 'profile':
            return newContent(Profile);
        case '3d':
            return newContent(View3d);
        case 'download':
            return newContent(Download);
        case 'api':
            return newContent(Api);
        case 'config':
            return newContent(Config);
        case 'login':
            if (state.user.userInfo.uid) {
                location.replace(redirect);
            } else {
                return newContent(LoginPage);
            }        
        default:
            return newContent(Home);
    }
}

window.onpopstate = (e) => {
    changeContent(e.state);
}

window.onload = (e) => {
    const loadPage = e.currentTarget.document.location.pathname.slice(1)
    changeContent(loadPage);
}

export default changeContent;
