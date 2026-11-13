/* ===== سیستم زبان: EN / PS ===== */
const LANG = localStorage.getItem('hm_lang') || 'en';
document.documentElement.lang = LANG === 'ps' ? 'ps' : 'en';
document.documentElement.dir = LANG === 'ps' ? 'rtl' : 'ltr';

if (LANG === 'ps') {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap';
  document.head.appendChild(l);
}

const I18N = {
  ps: {
    'Home': 'کور', 'Products': 'محصولات', 'About Us': 'زموږ په اړه', 'Contact Us': 'اړیکه',
    'Login to Admin': 'اډمین ته ننوتل', 'Admin Panel': 'اډمین پینل', 'Logout': 'وتل',
    'Search products...': 'محصولات ولټوئ...',
    'Electronics & Mobile': 'برقي توکي او موبایل',
    'Details': 'جزئیات', 'View Details': 'جزئیات وګورئ', 'View all →': 'ټول وګورئ ←',
    'Latest Products': 'وروستي محصولات', 'All Products': 'ټول محصولات',
    'All Categories': 'ټولې کټګورۍ', 'Load more': 'نور وښيه',
    'No products have been added yet.': 'تر اوسه هیڅ محصول نه دی اضافه شوی.',
    'No products found.': 'هیڅ محصول ونه موندل شو.',
    'New Arrival': 'نوی راغلی', 'Loading...': 'لوډېږي...',
    'Quick Links': 'چټک لینکونه', 'Contact': 'اړیکه',
    'All rights reserved.': 'ټول حقوق خوندي دي.',
    'Description': 'تشریح', 'Specifications': 'مشخصات',
    'Contact us about this product': 'د دې محصول په اړه موږ سره اړیکه ونیسئ',
    'More Products': 'نور محصولات', 'No other products yet.': 'نور محصولات نشته.',
    'Comments': 'نظرونه', 'Your name': 'ستاسو نوم', 'Your comment': 'ستاسو نظر',
    'Write your comment...': 'خپل نظر ولیکئ...', 'Post Comment': 'نظر ولیږئ',
    'No comments yet. Be the first to comment!': 'تر اوسه نظر نشته. لومړی نظر ورکوونکی اوسئ!',
    'Please enter your name and comment.': 'مهرباني وکړئ نوم او نظر ولیکئ.',
    'Delete': 'ړنګول', 'Edit': 'سمول',
    'Contact Information': 'د اړیکې معلومات', 'Chat on WhatsApp': 'په واټس‌اپ خبرې وکړئ',
    'Email': 'ایمیل', 'Address': 'پته', 'Working Hours': 'د کار وختونه',
    'Send us a message': 'موږ ته پیغام ولیږئ',
    'Have a question about a product or price? Send us a message and we will reply as soon as possible.':
      'د محصول یا قیمت په اړه پوښتنه لرئ؟ موږ ته پیغام ولیږئ، موږ به ژر ځواب درکړو.',
    'Your Name *': 'ستاسو نوم *', 'Your Phone': 'ستاسو شمېره', 'Your Email': 'ستاسو ایمیل',
    'Send WhatsApp to': 'واټس‌اپ ته ولیږئ', 'Message *': 'پیغام *', 'Send Message': 'پیغام ولیږئ',
    'Your message will be sent by email and WhatsApp will open with the message ready to send.':
      'ستاسو پیغام به د ایمیل له لارې ولیږل شي او واټس‌اپ به د پیغام سره چمتو خلاص شي.',
    'Please enter your name and message.': 'مهرباني وکړئ نوم او پیغام ولیکئ.',
    'Thank you! Your message was sent by email and WhatsApp.': 'مننه! ستاسو پیغام د ایمیل او واټس‌اپ له لارې ولیږل شو.',
    'Thank you! Your message was received.': 'مننه! ستاسو پیغام ترلاسه شو.',
    'About': 'په اړه', 'Our Mission': 'زموږ ماموریت', 'Our Vision': 'زموږ لید',
    'Our History': 'زموږ تاریخچه', 'Why Choose Us': 'ولې موږ غوره کړئ',
    'What We Offer': 'موږ څه وړاندې کوو', 'Our Brands': 'زموږ برانډونه',
    'Branches & Agencies': 'څانګې او نمایندګۍ', 'Gallery': 'ګالرۍ', 'Management': 'مدیریت',
    'Get in Touch': 'اړیکه ونیسئ', 'Phone / WhatsApp': 'تلیفون / واټس‌اپ', 'Manager:': 'مدیر:',
    'Admin Login': 'د اډمین ننوتل', 'Back to website': 'ویب‌پاڼې ته ستنیدل',
    'Please login with your administrator account.': 'مهرباني وکړئ د اډمین حساب سره ننوځئ.',
    'Password': 'پاسورډ', 'Login': 'ننوتل',
    'Administrator area. Login to manage products, categories, users and messages.':
      'د اډمین ساحه. محصولات، کټګورۍ، کاروونکي او پیغامونه اداره کړئ.',
    'This account is not an administrator.': 'دا حساب د اډمین نه دی.',
    'Dashboard': 'ډشبورډ', 'Categories': 'کټګورۍ', 'Users': 'کاروونکي', 'Messages': 'پیغامونه',
    '+ Add Product': '+ محصول اضافه کړئ', '+ Add': '+ اضافه کړئ', '+ Create User': '+ کاروونکی جوړ کړئ',
    'Manage Products': 'محصولات اداره کړئ', 'Name': 'نوم', 'Category': 'کټګوري', 'Price': 'قیمت',
    'Role': 'رول', 'Joined': 'نیټه', 'Save': 'خوندي کړئ', 'Cancel': 'لغوه',
    'Edit Product': 'محصول سم کړئ', 'Add New Product': 'نوی محصول اضافه کړئ',
    'Main image': 'اصلي انځور', 'Gallery images (multiple)': 'د ګالرۍ انځورونه (څو)',
    'New category name': 'د نوې کټګورۍ نوم', 'Full name': 'بشپړ نوم',
    'Reset Password': 'پاسورډ بدل کړئ', 'Reply on WhatsApp': 'په واټس‌اپ ځواب ورکړئ',
    'Reply by Email': 'په ایمیل ځواب ورکړئ', 'No messages yet.': 'تر اوسه پیغام نشته.',
    'No products yet.': 'تر اوسه محصول نشته.', 'Latest': 'وروستي'
  }
};

/* ترجمه یک متن (اگر پشتو نبود همان انگلیسی) */
function t(s) {
  if (LANG === 'en') return s;
  return (I18N.ps && I18N.ps[s]) || s;
}

/* ترجمه خودکار متن‌های ثابت صفحه (بعد از ساخته شدن DOM) */
function translateDom(root = document.body) {
  if (LANG === 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName)
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => {
    const raw = n.nodeValue, trimmed = raw.trim();
    if (trimmed && I18N.ps[trimmed]) n.nodeValue = raw.replace(trimmed, I18N.ps[trimmed]);
  });
  root.querySelectorAll('[placeholder]').forEach(el => {
    const p = el.getAttribute('placeholder');
    if (I18N.ps[p]) el.setAttribute('placeholder', I18N.ps[p]);
  });
  root.querySelectorAll('[title]').forEach(el => {
    const p = el.getAttribute('title');
    if (I18N.ps[p]) el.setAttribute('title', I18N.ps[p]);
  });
}

function setLang(l) {
  localStorage.setItem('hm_lang', l);
  location.reload();
}

/* ترجمه خودکار وقتی محتوای جدید به صفحه اضافه شود (کارت‌ها، مودال‌ها، ...) */
document.addEventListener('DOMContentLoaded', () => {
  if (LANG === 'en') return;
  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => translateDom(), 30);
  }).observe(document.body, { childList: true, subtree: true });
  translateDom();
});