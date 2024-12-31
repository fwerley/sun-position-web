import subjects from "./subject";

// Polar to Cartesian [r, theta] => [x, y]
const p2c = pt => [pt[0] * Math.cos(pt[1]), pt[0] * Math.sin(pt[1])];

// Cartesian to Polar [x, y] => [r, theta]
const c2p = pt => [Math.sqrt(pt[0] ** 2 + pt[1] ** 2), Math.atan2(pt[1], pt[0])];

// Spherical coordinates to cartesian, theta is azimute angle, fi is elevation angle => [x, y, z]
const s2c = (r = 4000, theta, fi) => {
    const x = r * Math.cos(theta) * Math.cos(fi);
    const y = r * Math.sin(theta) * Math.cos(fi);
    const z = r * Math.sin(fi);
    return [x, y, z];
}


const dateWithoutTimezone = (date) => {
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const withoutTimezone = new Date(date.valueOf() - tzoffset)
        .toISOString()
        .slice(0, -1);
    return withoutTimezone;
}

// Dregrees to Radians
const degreesToRadians = (degrees) => {
    return (degrees % 360) * (Math.PI / 180);
}

// Radians to Degress
const radiansToDegrees = (radians) => {
    return radians * (180 / Math.PI);
}

const correctionArrayHour = (array, values) => {
    let hour = array[0];
    let minute = array[1] + values.minutes;
    let second = array[2] + values.seconds;

    if (second >= 60) {
        minute = minute + 1;
        second = second - 60;
    } else if (second < 0) {
        minute = minute - 1;
        second = 60 - Math.abs(second);
    }

    if (minute >= 60) {
        hour = hour + 1;
        minute = minute - 60;
    } else if (minute < 0) {
        hour = hour - 1;
        minute = 60 - Math.abs(minute);
    }

    return [hour, minute, second];
}

// Hora decimal para hora, minuto e segundos
const hd2hms = (hd) => {
    let hend = Math.floor(hd);
    let med = (hd - hend) * 60;
    let mend = Math.floor((hd - hend) * 60);
    let sed = (med - mend) * 60;
    let send = Math.floor(sed);
    return [hend, mend, send];
}

const capitalize = (string) => {
    return string.charAt(0).toUpperCase()
        + string.slice(1);
}

const urlApiRequest = (sufix) => {
    return process.env.NODE_ENV === "development" ?
        `http://127.0.0.1:5001/sun-position-app/us-central1/app/v1/${sufix}` :
        `https://us-central1-sun-position-app.cloudfunctions.net/app/v1/${sufix}`;
}

const redirectPage = (url) => {
    let notParams = url.split("?")[0];
    subjects.handlePageChange(notParams.substring(1));
    window.history.pushState(notParams, capitalize(notParams), url);
}

export {
    p2c,
    c2p,
    s2c,
    hd2hms,
    capitalize,
    redirectPage,
    urlApiRequest,
    degreesToRadians,
    radiansToDegrees,
    dateWithoutTimezone,
    correctionArrayHour
}