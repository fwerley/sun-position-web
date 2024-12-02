import h from "hyperscript";
import helpers from 'hyperscript-helpers';

import "./Modal.css";

const { div, article, header, h3, i, button, section, footer, input, label } = helpers(h);

const Modal = () => div({ className: "modal" }, [
    article({ className: "modal-container" }, [
        header({ className: "modal-container-header" }, [
            h3({ className: "modal-container-title" }, [
                i({ className: "bx bxs-layer-plus" }),
                "Novo Projeto"
            ]),
            button({ className: "icon-button", style: { color: "#707070" } },
                i({ className: "bx bx-x" }),
            )
        ]),
        section({ className: "modal-container-body rtf" }, [
            div({ className: "modal-column" }, [
                div({ className: "modal-line" }, [
                    label(i({ className: "bx bxs-purchase-tag-alt" })),
                    input({ type: "text", placeholder: "Nome do projeto" })
                ]),
                div({ className: "modal-line" }, [
                    label(i({ className: "bx bxs-map" })),
                    input({
                        type: "text",
                        placeholder: "Latitude",
                        pattern: "[\\d\\(\\)\\-+]{1,3}.[\\d]{3,6}",
                        required: true
                    })
                ]),
                div({ className: "modal-line" }, [
                    label(i({ className: "bx bxs-map" })),
                    input({
                        type: "text",
                        placeholder: "Longitude",
                        pattern: "[\\d\\(\\)\\-+]{1,4}.[\\d]{3,6}",
                        required: true
                    })
                ])
            ])
        ]),
        footer({ className: "modal-container-footer" }, [
            button({ className: "button is-ghost" }, "Cancelar"),
            button({ className: "button is-primary" }, "Concluir")
        ])
    ])
]);

export default Modal;