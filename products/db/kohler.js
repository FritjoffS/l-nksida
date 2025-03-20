const kohler = {
    name: "Kohler",
    subgroups: [
        {
            name: "Knivar", subtypes: ["WBH", "Rider"],
        },
        {
            name: "Luftfilter", subtypes: ["Panel typ", "Oval typ", "Rund typ", "Skumfilter", "Förfilter"],
        },
        {
            name: "Tändstift", //subtypes: ["WBH", "Rider"],
        },
        {
            name: "Oljefilter",
        },
    ],
    products: [
        {
            name: "Luftfilter Kohler 1408319S",
            subcategory: "Luftfilter",
            subtype: "Panel typ",
            image: "images/kohler/1408319s.avif",
            info: "Luftfilter för WBH. Passande Förfilter 1408302S",
            productNumber: "1408319S",
            specs: {
                Fabrikat: "Kohler",
                Dimensioner: "145x90x26 mm",
            }
        },
        {
            name: "Förfilter Kohler 1408302S",
            subcategory: "Luftfilter",
            subtype: "Förfilter",
            image: "images/kohler/1408302s.avif",
            info: "Förfilter för 1408319S",
            productNumber: "1408319S",
            specs: {
                Fabrikat: "Kohler",
                // Dimensioner: "145x90x26 mm"
            }
        },
        {
            name: "Tändstift Kohler 1413211S",
            subcategory: "Tändstift",
            // subtype: "Förfilter",
            image: "images/kohler/1413211s.avif",
            info: "Tändstift för..",
            productNumber: "1413211S",
            specs: {
                Fabrikat: "Kohler",
                // Dimensioner: "145x90x26 mm"
            }
        },
        {
            name: "Tändstift Kohler 1413214S",
            subcategory: "Tändstift",
            // subtype: "Förfilter",
            image: "images/kohler/1413214s.avif",
            info: "Tändstift för..",
            productNumber: "1413214S",
            specs: {
                Fabrikat: "Kohler",
                // Dimensioner: "145x90x26 mm"
            }
        },
    ]
};

export default kohler;