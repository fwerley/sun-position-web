# Biblioteca Sun Position

Se coordenadas solares são o que você busca, nossa biblioteca JavaScript é a estrela principal. Basta dizer onde e quando, e ela calcula exatamente onde o Sol está brilhando. (Sem óculos escuros, por favor! 😎)

<br>

## Funcionalidades

- Cálculo da elevação solar
- Cálculo do azimute solar
- Cálculo de horario do nascer e pôr do sol (horario oficial local e horario solar)
- Determinação da declinação solar
- Duração do dia
- Informações da Time Zone pelas coordenadas

<br>

## Uso

<br>

[![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/fwerley/sun-position)
[![Npm package version](https://badgen.net/npm/v/sun-position)](https://npmjs.com/package/sun-position)

```console
npm i sun-position
```

```javascript
import SunPosition from "sun-position";

const sunPosition = new SunPosition({
    coords: { latitude: 40.7128, longitude: -74.0060 },
    date: new Date('2025-01-01 10:55:00'),
});

const elevation = sunPosition.getElevation();
const azimuth = sunPosition.getAzimuth();
```