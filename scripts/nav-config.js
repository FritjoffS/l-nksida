/**
 * Navigationskonfiguration
 * Definierar alla länkar och hur de grupperas i navbaren
 */

const NAV_CONFIG = {
  // Huvudlänkar som alltid visas
  mainLinks: [
    {
      id: 'hem',
      label: 'Hem',
      href: '../index/index.html',
      icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640786/home_nqhk0v.png'
    }
  ],

  // Dropdown-kategorier med underlänkar
  categories: [
    {
      id: 'butik',
      label: 'Butik',
      icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770641642/store_8771944_laxxci.png',
      links: [
        {
          id: 'butik-start',
          label: 'Butik Start',
          href: '../butik/butik.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770641642/store_8771944_laxxci.png'
        },
        {
          id: 'hushall',
          label: 'Hushåll',
          href: '../hushall/hushall.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770641642/store_8771944_laxxci.png'
        },
        {
          id: 'fargBygg',
          label: 'Färg & Bygg',
          href: '../fargBygg/fargBygg.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770641642/store_8771944_laxxci.png'
        },
        {
          id: 'verktyg',
          label: 'Verktyg',
          href: '../verktyg/verktyg.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770641642/store_8771944_laxxci.png'
        },
        {
          id: 'presentkort',
          label: 'Presentkort',
          href: '../presentkort/presentkort.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640785/debet_pubkh4.png'
        },
        {
          id: 'lathund',
          label: 'Lathund',
          href: '../lathund/lathund.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640785/barcode_rzebgw.png'
        },
        {
          id: 'produkter',
          label: 'Produkter',
          href: '../products/products.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640791/under-construction_rn9b9y.png'
        }
      ]
    },
    {
      id: 'verkstad',
      label: 'Verkstad',
      icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640791/tools_ujccpd.png',
      links: [
        {
          id: 'verkstad-start',
          label: 'Verkstad Start',
          href: '../verkstad/verkstad.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640791/tools_ujccpd.png'
        },
        {
          id: 'aviseringar',
          label: 'Aviseringar',
          href: '../aviseringar/aviseringar.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640785/email_zsiymf.png'
        },
        {
          id: 'arbetsbeskrivningar',
          label: 'Arbetsbeskrivningar',
          href: '../arbetsbeskrivningar/arbetsbeskr.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640786/list_fa14n7.png'
        },
        {
          id: 'produkter',
          label: 'Produkter',
          href: '../products/products.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640791/under-construction_rn9b9y.png'
        }
      ]
    },
    {
      id: 'kontor',
      label: 'Kontor',
      icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640786/office_bs0iwl.png',
      links: [
        {
          id: 'kontor-start',
          label: 'Kontor Start',
          href: '../kontor/kontor.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640786/office_bs0iwl.png'
        },
        {
          id: 'schema',
          label: 'Schema',
          href: '../schema/schema.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640786/list_fa14n7.png'
        },
        {
          id: 'debetlappar',
          label: 'Debetlappar',
          href: '../debetlappar/debet.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640785/debet_pubkh4.png'
        }
      ]
    },
    {
      id: 'verktyg',
      label: 'Verktyg',
      icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640797/skylt_anthbc.png',
      links: [
        {
          id: 'skyltverktyg',
          label: 'Skyltverktyg',
          href: '../skyltverktyg/skylt.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640797/skylt_anthbc.png'
        },
        {
          id: 'guider',
          label: 'Guider',
          href: '../guider/guider.html',
          icon: 'https://res.cloudinary.com/dmtfxmepd/image/upload/v1770640786/guide_vofmkk.png'
        }
      ]
    }
  ]
};

// Exportera för användning i andra filer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NAV_CONFIG;
}
