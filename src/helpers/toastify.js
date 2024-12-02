import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css"

const toastify = (text) => Toastify({
    text,
    duration: 3000,
    close: false,
    gravity: "bottom", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    offset: {
        x: 0, // horizontal axis - can be a number or a string indicating unity. eg: '2em'
        y: 100 // vertical axis - can be a number or a string indicating unity. eg: '2em'
      },
    style: {
        background: "var(--primary-color)",
        fontSize: "1.5rem"
    },
    onClick: function () { }
}).showToast();

export default toastify;