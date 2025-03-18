const husqvarna = {
    name: "Husqvarna",
    subgroups: [
        {
            name: "Knivar",
            subtypes: ["Automower"]
        },
        {
            name: "Tanklock",
            subtypes: ["Bränsletank", "Oljetank"] },

        { name: "Tändstift", subtypes: [] },
        { name: "Övrigt", subtypes: [] }
    ],
    products: [
        {
            name: "Standardkniv Long Life för Automower st",
            subcategory: "Knivar",
            subtype: "Automower",
            image: "images/husqvarna/577864603.png",
            info: "Standardkniv Long Life för Automower",
            productNumber: "577864603",
            specs : {
                Vårat_Produktnummer: "868983",
            }
        },
        {
            name: "KlippoDäck 502945101",
            subcategory: "Övrigt",
            // subtype: "Automower",
            image: "images/husqvarna/502945101.png",
            info: "KlippoDäck",
            productNumber: "502945101",
            specs : {
                Vårat_Produktnummer: "498957",
            }
        },
 
    ]
};

export default husqvarna;