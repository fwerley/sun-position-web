import h from "hyperscript";
import helpers from 'hyperscript-helpers';

const { button } = helpers(h);

const Button = button({ id: 'meu-btn' }, 'Meu botão');

export default Button;
