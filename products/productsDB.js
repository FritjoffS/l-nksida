import briggsStratton from './db/briggsStratton.js';
import stiga from './db/stiga.js';
import husqvarna from './db/husqvarna.js';
import stihl from './db/stihl.js';

const productsDB = {
    categories: [
        briggsStratton,
        stiga,
        husqvarna,
        stihl,
        // Lägg till fler fabrikat här
    ]
};

export default productsDB;