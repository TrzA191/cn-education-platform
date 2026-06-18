
const fs = require('fs');
const path = 'c:/Proyectos/node/Proyecto-CN_Edcucation/cn-frontend/src/app/(dashboard)/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Eliminar la línea duplicada del </button>
const lines = content.split(/\r?\n/);
// Buscamos la línea 892 (índice 891) que debería ser el </button> extra
if (lines[891].trim() === '</button>' && lines[890].trim() === '</button>') {
    console.log('Eliminando línea 892 duplicada...');
    lines.splice(891, 1);
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log('¡Reparado!');
} else {
    console.log('No se encontró el patrón en la línea esperada. Revisando...');
    console.log('Línea 891:', lines[890]);
    console.log('Línea 892:', lines[891]);
}
