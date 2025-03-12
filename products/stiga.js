const stiga = {
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
};

export default stiga;