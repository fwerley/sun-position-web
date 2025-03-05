import h from "hyperscript";
import helpers from "hyperscript-helpers";
import "./Download.css";

const { div, h2, h3, table, tr, td, th, thead, tbody, a } = helpers(h);


const Download = div({ className: "container" },
    h2("Downloads"),
    div({ className: "download-container" }, [
        h3("Firmware base Sun Position Tracker (SPT)"),
        table({ className: "styled-table" }, [
            thead(
                tr([
                    th("File Name"),
                    th("Size"),
                    th("Compatibility"),
                    th("Link"),
                ])
            ),
            tbody(
                tr({ className: "" }, [
                    td("Firmware base SPT_1.0.0_platformio"),
                    td("1.2 MB"),
                    td("-"),
                    td(a({ href: "https://www.google.com", target: "_blank" }, "Download")),
                ]),
                tr([
                    td("Firmware base SPT_1.0.0_arduino"),
                    td("1.2 MB"),
                    td("-"),
                    td(a({ href: "https://www.google.com", target: "_blank" }, "Download")),
                ]),
            )
        ]),
        h3("Firmware sistema"),
        table({ className: "styled-table" }, [
            thead(
                tr([
                    th("File Name"),
                    th("Size"),
                    th("Compatibility"),
                    th("Link"),
                ])
            ),
            tbody(
                tr([
                    td("Firmware sistema SPT_System_1.0.0"),
                    td("1.8 MB"),
                    td("SPT_Server_1.0.0"),
                    td(a({ href: "https://firebasestorage.googleapis.com/v0/b/sun-position-app.firebasestorage.app/o/downloads%2FSPT_System_1.0.0.bin?alt=media&token=df01612e-f77b-4805-adc4-63b397930e42", target: "_blank" }, "Download")),
                ])
            )
        ]),
        h3("Firmware servidor"),
        table({ className: "styled-table" }, [
            thead(
                tr([
                    th("File Name"),
                    th("Size"),
                    th("Compatibility"),
                    th("Link"),
                ])
            ),
            tbody(
                tr([
                    td("Firmware servidor SPT_Server_1.0.0"),
                    td("256 KB"),
                    td("SPT_System_1.0.0"),
                    td(a({ href: "https://firebasestorage.googleapis.com/v0/b/sun-position-app.firebasestorage.app/o/downloads%2FSPT_Server_1.0.0.bin?alt=media&token=72ecec3b-7f00-432a-b282-850527f74c60", target: "_blank" }, "Download")),
                ])
            )
        ]),
    ])
);


export default Download;