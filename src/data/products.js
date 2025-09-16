// sample product data used by categories page
export const PRODUCTS = [
  { id:'p1', title:'Dizüstü Bilgisayar i7', category:'Elektronik', price:12500, store:'Demo Mağaza', image:null },
  { id:'p2', title:'2+1 Kiralık Daire', category:'Gayrimenkul', price:3500, store:'Ev Sahibi', image:null },
  { id:'p3', title:'İkinci El Telefon', category:'Elektronik', price:2200, store:'Cep Dünyası', image:null },
  { id:'p4', title:'Spor Aracı', category:'Vasıta', price:85000, store:'Araç Galeri', image:null },
  { id:'p5', title:'Ofis Masası', category:'Ev & Bahçe', price:850, store:'Mobilya Dünyası', image:null },
  { id:'p6', title:'Kamp Sandalyesi', category:'Spor', price:120, store:'Outdoor Shop', image:null },
  { id:'p7', title:'Koleksiyon Saat', category:'Moda', price:4200, store:'Saatci', image:null },
  { id:'p8', title:'Küçük Ev Aleti', category:'Ev & Bahçe', price:260, store:'Elektronikçi', image:null }
];
export const CATEGORIES = Array.from(new Set(PRODUCTS.map(p=>p.category)));