const productsDB = {
    categories: [
        {
            name: "Briggs & Stratton",
            subgroups: [
                { name: "Luftfilter", subtypes: [] },
                { name: "Bränslefilter", subtypes: [] },
                { name: "Oljefilter", subtypes: [] },
                { name: "Tändstift", subtypes: [] },
                { name: "Packningar", subtypes: [] },
                { name: "Primerblåsor", subtypes: [] },
            ],
            products: [
                {
                    name: "B&S Luftfilter 795073",
                    subcategory: "Luftfilter",
                    image: "placeholder-luftfilter.jpg",
                    info: "Luftfilter för B&S motorer",
                    productNumber: "795073",
                    specs: {
                        Dimensioner: "150x100x25 mm"
                    }
                },
                {
                    name: "B&S Tändstift RJ19LM",
                    subcategory: "Tändstift",
                    image: "placeholder-tandstift.jpg",
                    info: "Tändstift för B&S motorer",
                    productNumber: "RJ19LM",
                    specs: {
                        Gänga: "14 mm"
                    }
                }
            ]
        },
        {
            name: "Stiga",
            subgroups: [
                {
                    name: "Luftfilter",
                    subtypes: ["Panel typ", "Oval typ", "Rund typ"]
                },
                { name: "Bränslefilter", subtypes: [] },
                { name: "Oljefilter", subtypes: [] }
            ],
            products: [
                {
                    name: "Stiga Luftfilter LF-200 Panel Typ",
                    subcategory: "Luftfilter",
                    subtype: "Panel typ",
                    image: "placeholder-luftfilter.jpg",
                    info: "Luftfilter för Stiga åkgräsklippare",
                    productNumber: "STG-LF200",
                    specs: {
                        Dimensioner: "200x150x30 mm"
                    }
                },
                {
                    name: "Stiga Luftfilter LF-200 Oval Typ",
                    subcategory: "Luftfilter",
                    subtype: "Oval typ",
                    image: "placeholder-luftfilter.jpg",
                    info: "Luftfilter för Stiga åkgräsklippare",
                    productNumber: "STG-LF200",
                    specs: {
                        Dimensioner: "200x150x30 mm"
                    }
                },
                {
                    name: "Stiga Oljefilter",
                    subcategory: "Oljefilter",
                    image: "placeholder-oljefilter.jpg",
                    info: "Oljefilter för Stiga åkgräsklippare",
                    productNumber: "STG-OF200",
                    specs: {
                        Dimensioner: "200x150x30 mm"
                    }
                }
            ]
        }
    ]
};