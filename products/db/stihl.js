const stihl = {
    name: "Stihl",
    subgroups: [
        {
            name: "Knivar", subtypes: ["WBH", "Robotgräsklippare", "Rider"],
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
        {
            name: "Motorsåg", subtypes: ["Tanklock", "Oljelock", "Bränslefilter", "Luftfilter"],
        },
    ],
    products: [
        {
            name: "Kniv Imow MI / RMI 4 series",
            subcategory: "Knivar",
            subtype: "Robotgräsklippare",
            image: "images/stihl/63017020101.png",
            info: "Standardkniv för Stihl Imow MI/RMI 4 series",
            productNumber: "63017020101",
            specs: {
                Vårat_Produktnummer: "820515",
                Längd: "24 cm"
            }
        },
        {
            name: "Kniv Imow MI / RMI 6 series",
            subcategory: "Knivar",
            subtype: "Robotgräsklippare",
            image: "images/stihl/63097020102.png",
            info: "Standardkniv för Stihl Imow MI / RMI 6 series",
            productNumber: "63097020102",
            specs: {
                Vårat_Produktnummer: "820375",
                Längd: "28 cm"
            }
        },
        {
            name: "Kniv Imow 5/5EVO, 6/6EVO, 7/7EVO series",
            subcategory: "Knivar",
            subtype: "Robotgräsklippare",
            image: "images/stihl/STIA000074201.png",
            info: "Standardkniv för Stihl Imow 5/5EVO, 6/6EVO, 7/7EVO series 3 st",
            productNumber: "STIA000074201",
            specs: {
                Vårat_Produktnummer: "1096642",
                Antal: "3 st"
            }
        },
        {
            name: "Luftfilter Kohler 0002-140-4400",
            subcategory: "Luftfilter",
            subtype: "Panel typ",
            image: "images/kohler/1408319s.avif",
            info: "Luftfilter för WBH. Passande Förfilter 0002-124-1500",
            productNumber: "0002-140-4400",
            specs: {
                Fabrikat: "Kohler",
                Dimensioner: "145x90x26 mm",
                Alternativ: "MTD 75110298, Honda 17211-ZG9-M00, Kohler 1408319S"

            }
        },
        {
            name: "Förfilter Kohler 0002-124-1500",
            subcategory: "Luftfilter",
            subtype: "Förfilter",
            image: "images/kohler/1408302s.avif",
            info: "Förfilter för 0002-140-4400",
            productNumber: "0002-124-1500",
            specs: {
                Fabrikat: "Kohler",
                Alternativ: "Kohler 1408302S, Stihl 0002-124-1500"
            }
        },
        {
            name: "Oljelock Stihl 0000-350-0532",
            subcategory: "Motorsåg",
            subtype: "Oljelock",
            image: "images/stihl/0000-350-0532.webp",
            info: "Oljelock för Stihl motorsåg",
            productNumber: "0000-350-0532",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 271, MS 291"
            }
        },
        {
            name: "Tanklock Stihl 0000-350-0532",
            subcategory: "Motorsåg",
            subtype: "Tanklock",
            image: "images/stihl/0000-350-0532.webp",
            info: "Tanklock för Stihl motorsåg",
            productNumber: "0000-350-0532",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 261, MS 271"
            }
        },
        {
            name: "Oljelock Stihl 0000-350-0533",
            subcategory: "Motorsåg",
            subtype: "Oljelock",
            image: "images/stihl/0000-350-0533.jpg",
            info: "Oljelock för Stihl motorsåg",
            productNumber: "0000-350-0533",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 171, MS 181, MS 181 C-BE, MS 192 C-E, MS 192 T, MS 193 C-E, MS 193 T, MS 194 C-E, MS 194 T, MS 194 TC-E, MS 210 C-B, MS 210 C-BE, MS 211, MS 211 C-BE, MS 230, MS 230 C-B, MS 230 C-BE, MS 250, MS 250 C-B, MS 250 C-BE, MS 290, MS 310, MS 390, MS 391"
            }
        },
        {
            name: "Tanklock Stihl 0000-350-0533",
            subcategory: "Motorsåg",
            subtype: "Tanklock",
            image: "images/stihl/0000-350-0533.jpg",
            info: "Tanklock för Stihl motorsåg",
            productNumber: "0000-350-0533",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 200, MS 231, MS 241, MS 251, MS 260, MS 270, MS 280, MS 341, MS 360, MS 362, MS 461, MS 462, MS 881"
            }
        },
        {
            name: "Oljelock Stihl 0000-350-0534",
            subcategory: "Motorsåg",
            subtype: "Oljelock",
            image: "images/stihl/0000-350-0534.webp",
            info: "OLjelock för Stihl motorsåg",
            productNumber: "0000-350-0534",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 150, MS 151"
            }
        },
        {
            name: "Tanklock Stihl 0000-350-0534",
            subcategory: "Motorsåg",
            subtype: "Tanklock",
            image: "images/stihl/0000-350-0534.webp",
            info: "Tanklock för Stihl motorsåg",
            productNumber: "0000-350-0534",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 201, MS 400.1"
            }
        },
        {
            name: "Oljelock Stihl 0000-350-0536",
            subcategory: "Motorsåg",
            subtype: "Oljelock",
            image: "images/stihl/0000-350-0536.webp",
            info: "Oljelock för Stihl motorsåg",
            productNumber: "0000-350-0536",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 150, MS 151, MS 161, MS 201,"
            }
        },
        {
            name: "Oljelock Stihl 0000-350-0537",
            subcategory: "Motorsåg",
            subtype: "Oljelock",
            image: "images/stihl/0000 350 0527.jpg",
            info: "Oljelock för Stihl motorsåg",
            productNumber: "0000-350-0537",
            specs: {
                Fabrikat: "Stihl",
                PassarTill: "MS 171, MS 181, MS 192, MS 193, MS 194, MS 200, MS 210, MS 211, MS 230, MS 231, MS 241, MS 250, MS 251, MS 260, MS 261, MS 360"
            }
        },
    ]
};

export default stihl;