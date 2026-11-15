const COMPANY = {
  name: 'HM Trading Company',
  tagline: 'Electronics & Mobile',
  logo: '',                       // مثلا '/images/logo.png' وقتی لوگو داشتید
  founded: 2015,
  owner: 'Your Name',             // نام مدیر
  ownerTitle: 'Founder & CEO',
  email: 'info@hmtrading.com',
  phones: [
    { label: 'Sales',   display: '+93 785599457', wa: '93785599457' },
    { label: 'Support', display: '+93 700 000 002', wa: '93700000002' },
    { label: 'Manager', display: '+93 700 000 003', wa: '93700000003' }
  ],
  address: 'Main Market, Your City, Your Country',
  hours: 'Saturday – Thursday: 8:00 AM – 6:00 PM',
  social: { facebook: '#', instagram: '#', telegram: '#' },

  about: 'HM Trading Company is a trusted supplier of our own brand mobile phones, chargers, headphones, power banks and a wide range of electronic devices. We combine quality, fair prices and reliable service.',
  mission: 'To deliver high quality electronic products at fair prices and make modern technology accessible to everyone.',
  vision: 'To become the most trusted electronics brand in the region.',

  stats: [
    { n: '10+', t: 'Years of Experience' },
    { n: '5K+', t: 'Happy Customers' },
    { n: '100+', t: 'Products' },
  ],
  history: [
    { year: '2015', title: 'Company Founded', text: 'HM Trading Company started with a small shop selling mobile accessories.' },
    { year: '2018', title: 'Own Brand Launched', text: 'We launched our first mobile phones and chargers under our own brand.' },
    { year: '2021', title: 'New Branches', text: 'Opened new branches and agencies in several cities.' },
    { year: '2024', title: 'Expanded Range', text: 'Added headphones, power banks and smart electronic devices.' }
  ],
  features: [
    { t: 'Original Quality', d: 'Every product is tested before it reaches you.' },
    { t: 'Warranty', d: 'Reliable warranty and after-sales service.' },
    { t: 'Best Prices', d: 'Direct from the company, no middleman.' },
    { t: 'Fast Support', d: 'Our team is ready to help via phone and WhatsApp.' }
  ],
  brands: ['HM Mobile', 'HM Power', 'HM Sound', 'HM Charge'],
  branches: [
    { city: 'Main Branch', address: 'Main Market, Your City', phone: '+93 700 000 001', manager: 'Manager Name' },
    { city: 'Branch 2',    address: 'City Center, City 2',    phone: '+93 700 000 004', manager: 'Manager Name' },
    { city: 'Branch 3',    address: 'Bazaar Road, City 3',    phone: '+93 700 000 005', manager: 'Manager Name' }
  ],
  gallery: []   // مثلا ['/images/shop1.jpg','/images/shop2.jpg'] (عکس‌ها را در public/images بگذارید)
};

/* ===== نسخه پشتو (اختیاری: هر چه نوشتید جایگزین می‌شود) ===== */
const COMPANY_PS = {
  tagline: 'برقي توکي او موبایل',
  about: 'د HM Trading Company زموږ د خپل برانډ موبایلونو، چارجرونو، هیډفونونو، پاور بانکونو او ډیری نورو برقي وسایلو باوري عرضه کوونکی دی. موږ کیفیت، مناسب قیمتونه او باوري خدمات وړاندې کوو.',
  mission: 'د لوړ کیفیت برقي محصولات په مناسبو بیو وړاندې کول او عصري ټکنالوژي ټولو ته د لاسرسي وړ کول.',
  vision: 'په سیمه کې د باور وړ برقي برانډ ګرځېدل.',
  hours: 'ہفتہ – پنجشنبه: ۸:۰۰ سهار – ۶:۰۰ مازدیګر',
  address: 'اصلي بازار، ستاسو ښار، ستاسو هیواد',
  owner: 'ستاسو نوم',
  ownerTitle: 'بنسټ ایښودونکی او مدیر',
  stats: ['د تجربې کلونه', 'خوښ پیرودونکي', 'محصولات',],
  history: [
    { title: 'شرکت تاسیس شو', text: 'HM Trading Company د موبایل لوازمو د پلورلو له یوې کوچنۍ دوکان سره پیل شو.' },
    { title: 'خپل برانډ پیل شو', text: 'موږ خپل لومړي موبایلونه او چارجرونه د خپل برانډ لاندې معرفي کړل.' },
    { title: 'نوې څانګې', text: 'په څو ښارونو کې نوې څانګې او نمایندګۍ پرانیستل شوې.' },
    { title: 'د محصولاتو پراخېدل', text: 'هیډفونونه، پاور بانکونه او هوښیار برقي وسایل زیات شول.' }
  ],
  features: [
    { t: 'اصلي کیفیت', d: 'هر محصول مخکې له تاسو ته رسېدو ازمول کیږي.' },
    { t: 'تضمین', d: 'باوري تضمین او د پلور وروسته خدمات.' },
    { t: 'غوره بیې', d: 'مستقیم له شرکت څخه، بې واسطې.' },
    { t: 'چټک ملاتړ', d: 'زموږ ټیم د تلیفون او واټس‌اپ له لارې مرستې ته چمتو دی.' }
  ],
  phoneLabels: ['پلور', 'ملاتړ', 'مدیر'],
  branchCities: ['اصلي څانګه', 'دویمه څانګه', 'درېیمه څانګه']
};

/* د ژبې له مخې COMPANY اپډیټ کړه */
(function () {
  if (localStorage.getItem('hm_lang') !== 'ps') return;
  const P = COMPANY_PS;
  COMPANY.tagline = P.tagline; COMPANY.about = P.about; COMPANY.mission = P.mission;
  COMPANY.vision = P.vision; COMPANY.hours = P.hours; COMPANY.address = P.address;
  COMPANY.owner = P.owner; COMPANY.ownerTitle = P.ownerTitle;
  COMPANY.stats.forEach((s, i) => { if (P.stats[i]) s.t = P.stats[i]; });
  COMPANY.features.forEach((f, i) => { if (P.features[i]) Object.assign(f, P.features[i]); });
  COMPANY.phones.forEach((p, i) => { if (P.phoneLabels[i]) p.label = P.phoneLabels[i]; });
  COMPANY.branches.forEach((b, i) => { if (P.branchCities[i]) b.city = P.branchCities[i]; });
})();