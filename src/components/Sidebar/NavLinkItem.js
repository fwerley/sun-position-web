import h from "hyperscript";
import helpers from 'hyperscript-helpers';

const { span, i, li, a } = helpers(h);

const NavLinkItem = ({ href, id, icon, name, customClass = "" }) => li({ className: `nav-link ${customClass}` }, [
    a({ href, id }, [
        i({ className: `bx ${icon} icon` }),
        span({ className: "text nav-text" }, name)
    ])
]);

export default NavLinkItem;