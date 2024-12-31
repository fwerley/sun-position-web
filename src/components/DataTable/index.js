import { Grid, h as gridH } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import "./dataTable.css";

let grid = null;

const DataTable = (ref = null, columns = [], data = []) => {
    grid = new Grid({
        columns,
        sort: true,
        search: true,
        data: formatDataTableItem(data),
        // className: {
        //     td: {
        //         'overflow-wrap': 'break-word'
        //     }
        // },
        language: {
            'search': {
                'placeholder': '🔍 Pesquisar...'
            }
        }
    });
    if (ref) {
        grid.render(ref);
    }

}

const formatDataTableItem = (list) => list.map(item => [item.tag, item.name, item.lat, item.lng, new Date(item.createdAt).toLocaleString("pt-BR"), null])

export default DataTable;
export { grid, formatDataTableItem, gridH };