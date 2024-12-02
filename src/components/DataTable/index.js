import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import "./dataTable.css"

const DataTable = (ref = null, columns = [], data = []) => {
    const grid = new Grid({
        columns,
        search: true,
        data: data.map(item => [item.tag, item.name, item.lat, item.lng, new Date(item.createdAt).toLocaleString("pt-BR")]),
        language: {
            'search': {
                'placeholder': '🔍 Pesquisar...'
            }
        }
    });
    if(ref) {
        grid.render(ref);
    }
}

export default DataTable;