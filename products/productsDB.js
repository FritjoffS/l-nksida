import briggsStratton from './db/briggsStratton.js';
import stiga from './db/stiga.js';
import husqvarna from './db/husqvarna.js';
import stihl from './db/stihl.js';
import kohler from './db/kohler.js';
import övriga from './db/övriga.js';

const productsDB = {
    categories: [
        briggsStratton,
        stiga,
        husqvarna,
        stihl,
        kohler,
        övriga,
        // Lägg till fler fabrikat här
    ]
};

export default productsDB;