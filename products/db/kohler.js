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
        Alternativ: "MTD 75110298, Honda 17211-ZG9-M00, Stihl 0002-140-4400"

      }
    },
    {
      name: "Luftfilter Kohler 2008306S",
      subcategory: "Luftfilter",
      subtype: "Panel typ",
      image: "images/kohler/2008306s.avif",
      info: "Luftfilter för Rider",
      productNumber: "2008306S",
      specs: {
        Fabrikat: "Kohler",
        Dimensioner: "196x135x35 mm",
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
        Alternativ: "Stihl 0002-124-1500"
      }
    },
    {
      name: "Oljefilter Kohler 1205001S",
      subcategory: "Oljefilter",
      image: "images/kohler/1205001s.avif",
      info: "Förfilter för 1205001S",
      productNumber: "1205001S",
      specs: {
        Fabrikat: "Kohler",
        Gänga: "3/4 in",
        Höjd: "70 mm",
        Diameter: "75 mm"
      }
    },
    {
      name: "Oljefilter Kohler 5205002S",
      subcategory: "Oljefilter",
      image: "images/kohler/5205002s.avif",
      info: "Oljefilter 5205002S",
      productNumber: "5205002S",
      specs: {
        Fabrikat: "Kohler",
        Gänga: "3/4 in",
        Höjd: "71,4 mm",
        Diameter: "76 mm"
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
        Alternativ: "NGK DCPR6E, NGK DCPR7E, Champion RA8HC"
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