<div class="md-main">

# Sun Tracker - Hardware

<br>

## Esquemático
<br>
<div class="column-right">

![Esquematico tracker](img/documentation/schematic-tracker.png)
<br>
<br>

### Componentes
- 1 - Microcontrolador ESP32
- 1 - Servomotor 90° ou 180°
- 1 - Servomotor 360° [controlável](https://pt.aliexpress.com/item/1005008259401105.html?spm=a2g0o.productlist.main.41.5598UkxmUkxmF1&algo_pvid=56425c03-2d39-49f8-a6f4-5c6d0dce9d12&algo_exp_id=56425c03-2d39-49f8-a6f4-5c6d0dce9d12-20&pdp_ext_f=%7B%22order%22%3A%22-1%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21BRL%21133.83%21104.39%21%21%2121.38%2116.68%21%402101ea7117376494515758319ec21b%2112000044397457646%21sea%21BR%214518787377%21X&curPageLogUid=p2GNsVnCN0Vn&utparam-url=scene%3Asearch%7Cquery_from%3A#nav-description&)
- 1 - Display SSD1306 OLED I2C 128x64
- 1 - Módulo GPS NEO-6M
- 3 - Pushbutton

<br>
<br>

<a href="https://wokwi.com/projects/419537550126226433" target="_blank">
  Confira o esuqemático interativo
</a>

</div>

```json
{
  "parts": [
    { "type": "board-esp32-devkit-c-v4", "id": "esp"},
    { "type": "servo", "id": "servo-elevation"},
    { "type": "servo", "id": "servo-azimuth"},
    { "type": "board-ssd1306", "id": "oled1", 
      "attrs": { "i2cAddress": "0x3c" }
    },
    { "type": "chip-neo-6m", "id": "chip1"},
    { "type": "pushbutton",
      "id": "btn2",
      "attrs": { "color": "green", "bounce": "1" }
    }
  ],
  "connections": [
    [ "servo-azimuth:PWM", "esp:5", "orange"],
    [ "servo-azimuth:V+", "esp:5V", "red"],
    [ "servo-azimuth:GND", "esp:GND.2", "#8f4814"],
    [ "servo-elevation:PWM", "esp:18", "orange"],
    [ "servo-elevation:V+", "esp:3V3", "red", [ "h0" ] ],
    [ "servo-elevation:GND", "esp:GND.2", "#8f4814"],
    [ "oled1:GND", "esp:GND.1", "black"],
    [ "oled1:VCC", "esp:3V3", "red"],
    [ "oled1:SCL", "esp:22", "gray"],
    [ "oled1:SDA", "esp:21", "purple"],
    [ "chip1:GND", "esp:GND.1", "gray"],
    [ "chip1:VCC", "esp:3V3", "red"],
    [ "chip1:TX", "esp:16", "gold"],
    [ "chip1:RX", "esp:17", "gray"],
    [ "btn2:2.l", "esp:23", "green"],
    [ "btn2:1.l", "esp:GND.2", "blue"]
  ]
}
```

</div>

<div class="bottom-navigation">
<hr>
  <div class="navigation-container">
    <div class="control left">
    
[<i class='bx bx-chevron-left'></i>Introdução](tracker/index.md)
    </div>
    <div class="control right">

[Usuário e credenciais<i class='bx bx-chevron-right' /></i>](tracker/tutorial/step-02.md)
    </div>
  </div>
</div>
