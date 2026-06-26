/* =========================================================
   ATTENDIFY PRO — AUTO TRANSLATOR v2
   ترجمة تلقائية للبيانات المُدخلة من العربية للغة المختارة

   طبقات الترجمة (بالترتيب):
   1. القاموس المحلي (فوري — بدون إنترنت)
   2. الكاش في localStorage (فوري بعد أول ترجمة)
   3. MyMemory API (مجاني، بدون مفتاح)

   الميزات:
   - MutationObserver يرصد أي إضافة محتوى في الصفحة
   - يترجم نص <option> و placeholder و title
   - يتجنب إعادة ترجمة العناصر المُترجمة مسبقاً
   ========================================================= */

const Translator = {

  // ── قاموس عربي شامل لمصطلحات HR ────────────────────────
  _dict: {

    // المسميات الوظيفية — Job Titles
    'مدير': { en:'Manager', hi:'प्रबंधक', ur:'مدیر', fil:'Tagapamahala' },
    'مديرة': { en:'Manager', hi:'प्रबंधक', ur:'مدیر', fil:'Tagapamahala' },
    'مدير عام': { en:'General Manager', hi:'महाप्रबंधक', ur:'جنرل مینیجر', fil:'General Manager' },
    'مدير تنفيذي': { en:'Executive Manager', hi:'कार्यकारी निदेशक', ur:'ایگزیکٹو مینیجر', fil:'Executive Manager' },
    'مدير مبيعات': { en:'Sales Manager', hi:'बिक्री प्रबंधक', ur:'سیلز مینیجر', fil:'Sales Manager' },
    'مدير تسويق': { en:'Marketing Manager', hi:'मार्केटिंग प्रबंधक', ur:'مارکیٹنگ مینیجر', fil:'Marketing Manager' },
    'مدير مالي': { en:'Finance Manager', hi:'वित्त प्रबंधक', ur:'فنانس مینیجر', fil:'Finance Manager' },
    'مدير موارد بشرية': { en:'HR Manager', hi:'एचआर प्रबंधक', ur:'HR مینیجر', fil:'HR Manager' },
    'مدير الموارد البشرية': { en:'HR Manager', hi:'एचआर प्रबंधक', ur:'HR مینیجر', fil:'HR Manager' },
    'مدير تقنية المعلومات': { en:'IT Manager', hi:'आईटी प्रबंधक', ur:'IT مینیجر', fil:'IT Manager' },
    'مدير العمليات': { en:'Operations Manager', hi:'संचालन प्रबंधक', ur:'آپریشنز مینیجر', fil:'Operations Manager' },
    'مدير المشاريع': { en:'Project Manager', hi:'परियोजना प्रबंधक', ur:'پروجیکٹ مینیجر', fil:'Project Manager' },
    'مدير قسم': { en:'Department Manager', hi:'विभाग प्रबंधक', ur:'ڈیپارٹمنٹ مینیجر', fil:'Department Manager' },
    'مدير فرع': { en:'Branch Manager', hi:'शाखा प्रबंधक', ur:'برانچ مینیجر', fil:'Branch Manager' },
    'مشرف': { en:'Supervisor', hi:'पर्यवेक्षक', ur:'سپروائزر', fil:'Superbisor' },
    'مشرفة': { en:'Supervisor', hi:'पर्यवेक्षक', ur:'سپروائزر', fil:'Superbisor' },
    'رئيس قسم': { en:'Section Head', hi:'अनुभाग प्रमुख', ur:'سیکشن ہیڈ', fil:'Section Head' },
    'رئيس فريق': { en:'Team Leader', hi:'टीम लीडर', ur:'ٹیم لیڈر', fil:'Team Leader' },
    'قائد فريق': { en:'Team Leader', hi:'टीم लीडر', ur:'ٹیم لیڈر', fil:'Team Leader' },
    'نائب مدير': { en:'Deputy Manager', hi:'उप प्रबंधक', ur:'ڈپٹی مینیجر', fil:'Deputy Manager' },
    'مساعد مدير': { en:'Assistant Manager', hi:'सहायक प्रबंधक', ur:'اسسٹنٹ مینیجر', fil:'Assistant Manager' },
    'مهندس': { en:'Engineer', hi:'अभियंता', ur:'انجینیئر', fil:'Inhinyero' },
    'مهندسة': { en:'Engineer', hi:'अभियंता', ur:'انجینیئر', fil:'Inhinyero' },
    'مهندس برمجيات': { en:'Software Engineer', hi:'सॉफ्टवेयर अभियंता', ur:'سافٹ ویئر انجینیئر', fil:'Software Engineer' },
    'مهندس شبكات': { en:'Network Engineer', hi:'नेटवर्क अभियंता', ur:'نیٹ ورک انجینیئر', fil:'Network Engineer' },
    'مهندس أنظمة': { en:'Systems Engineer', hi:'सिस्टम अभियंता', ur:'سسٹم انجینیئر', fil:'Systems Engineer' },
    'مبرمج': { en:'Developer', hi:'डेवलपर', ur:'ڈویلپر', fil:'Developer' },
    'مطور': { en:'Developer', hi:'डेवलपर', ur:'ڈویلپر', fil:'Developer' },
    'مطور تطبيقات': { en:'App Developer', hi:'ऐप डेवलपर', ur:'ایپ ڈویلپر', fil:'App Developer' },
    'مطور ويب': { en:'Web Developer', hi:'वेब डेवलपर', ur:'ویب ڈویلپر', fil:'Web Developer' },
    'محلل أنظمة': { en:'Systems Analyst', hi:'सिस्टम विश्लेषक', ur:'سسٹم اینالسٹ', fil:'Systems Analyst' },
    'محاسب': { en:'Accountant', hi:'लेखाकार', ur:'اکاؤنٹنٹ', fil:'Accountant' },
    'محاسبة': { en:'Accountant', hi:'लेखाकार', ur:'اکاؤنٹنٹ', fil:'Accountant' },
    'محاسب أول': { en:'Senior Accountant', hi:'वरिष्ठ लेखाकार', ur:'سینئر اکاؤنٹنٹ', fil:'Senior Accountant' },
    'مراجع': { en:'Auditor', hi:'लेखापरीक्षक', ur:'آڈیٹر', fil:'Auditor' },
    'محلل مالي': { en:'Financial Analyst', hi:'वित्तीय विश्लेषक', ur:'فنانشل اینالسٹ', fil:'Financial Analyst' },
    'أخصائي موارد بشرية': { en:'HR Specialist', hi:'एचआर विशेषज्ञ', ur:'HR اسپیشلسٹ', fil:'HR Specialist' },
    'أخصائي': { en:'Specialist', hi:'विशेषज्ञ', ur:'اسپیشلسٹ', fil:'Espesyalista' },
    'موظف': { en:'Employee', hi:'कर्मचारी', ur:'ملازم', fil:'Empleyado' },
    'موظفة': { en:'Employee', hi:'कर्मचारी', ur:'ملازم', fil:'Empleyado' },
    'موظف إداري': { en:'Administrative Employee', hi:'प्रशासनिक कर्मचारी', ur:'ایڈمنسٹریٹو ملازم', fil:'Administrative Employee' },
    'سكرتير': { en:'Secretary', hi:'सचिव', ur:'سیکریٹری', fil:'Kalihim' },
    'سكرتيرة': { en:'Secretary', hi:'सचिव', ur:'سیکریٹری', fil:'Kalihim' },
    'مساعد إداري': { en:'Administrative Assistant', hi:'प्रशासनिक सहायक', ur:'ایڈمنسٹریٹو اسسٹنٹ', fil:'Administrative Assistant' },
    'منسق': { en:'Coordinator', hi:'समन्वयक', ur:'کوآرڈینیٹر', fil:'Coordinator' },
    'منسقة': { en:'Coordinator', hi:'समन्वयक', ur:'کوآرڈینیٹر', fil:'Coordinator' },
    'مسؤول': { en:'Officer', hi:'अधिकारी', ur:'آفیسر', fil:'Opisyal' },
    'مسؤولة': { en:'Officer', hi:'अधिकारी', ur:'آفیسر', fil:'Opisyal' },
    'مندوب مبيعات': { en:'Sales Representative', hi:'बिक्री प्रतिनिधि', ur:'سیلز ریپریزنٹیٹو', fil:'Sales Representative' },
    'مندوب': { en:'Representative', hi:'प्रतिनिधि', ur:'نمائندہ', fil:'Kinatawan' },
    'مستشار': { en:'Consultant', hi:'परामर्शदाता', ur:'کنسلٹنٹ', fil:'Consultant' },
    'مستشارة': { en:'Consultant', hi:'परामर्शदाता', ur:'کنسلٹنٹ', fil:'Consultant' },
    'مدرب': { en:'Trainer', hi:'प्रशिक्षक', ur:'ٹرینر', fil:'Tagapagsanay' },
    'مدربة': { en:'Trainer', hi:'प्रशिक्षक', ur:'ٹرینر', fil:'Tagapagsanay' },
    'فني': { en:'Technician', hi:'तकनीशियन', ur:'ٹیکنیشن', fil:'Teknisyan' },
    'فنية': { en:'Technician', hi:'तकनीशियन', ur:'ٹیکنیشن', fil:'Teknisyan' },
    'عامل': { en:'Worker', hi:'कामगार', ur:'ورکر', fil:'Manggagawa' },
    'سائق': { en:'Driver', hi:'चालक', ur:'ڈرائیور', fil:'Drayber' },
    'حارس': { en:'Security Guard', hi:'सुरक्षा गार्ड', ur:'سیکیورٹی گارڈ', fil:'Guwardya' },
    'حارس أمن': { en:'Security Guard', hi:'सुरक्षा गार्ड', ur:'سیکیورٹی گارڈ', fil:'Security Guard' },
    'طبيب': { en:'Doctor', hi:'डॉक्टर', ur:'ڈاکٹر', fil:'Doktor' },
    'ممرض': { en:'Nurse', hi:'नर्स', ur:'نرس', fil:'Nars' },
    'ممرضة': { en:'Nurse', hi:'नर्स', ur:'نرس', fil:'Nars' },
    'أمين مستودع': { en:'Storekeeper', hi:'भण्डार प्रभारी', ur:'اسٹور کیپر', fil:'Tagapag-ingat ng Bodega' },
    'رئيس': { en:'Chief', hi:'प्रमुख', ur:'چیف', fil:'Punong' },
    'نائب رئيس': { en:'Vice President', hi:'उपाध्यक्ष', ur:'نائب صدر', fil:'Vice President' },
    'مدير أول': { en:'Senior Manager', hi:'वरिष्ठ प्रबंधक', ur:'سینئر مینیجر', fil:'Senior Manager' },
    'محلل': { en:'Analyst', hi:'विश्लेषक', ur:'تجزیہ کار', fil:'Analyst' },
    'مخطط': { en:'Planner', hi:'योजनाकार', ur:'منصوبہ ساز', fil:'Planner' },
    'مدقق': { en:'Auditor', hi:'लेखापरीक्षक', ur:'آڈیٹر', fil:'Auditor' },

    // أسماء الأقسام — Department Names
    'الموارد البشرية': { en:'Human Resources', hi:'मानव संसाधन', ur:'انسانی وسائل', fil:'Human Resources' },
    'موارد بشرية': { en:'Human Resources', hi:'मानव संसाधन', ur:'انسانی وسائل', fil:'Human Resources' },
    'تقنية المعلومات': { en:'Information Technology', hi:'सूचना प्रौद्योगिकी', ur:'انفارمیشن ٹیکنالوجی', fil:'Information Technology' },
    'تكنولوجيا المعلومات': { en:'Information Technology', hi:'सूचना प्रौद्योगिकी', ur:'انفارمیشن ٹیکنالوجی', fil:'Information Technology' },
    'المالية': { en:'Finance', hi:'वित्त', ur:'مالیات', fil:'Finance' },
    'الإدارة المالية': { en:'Finance Department', hi:'वित्त विभाग', ur:'مالیاتی شعبہ', fil:'Finance Department' },
    'الحسابات': { en:'Accounting', hi:'लेखांकन', ur:'اکاؤنٹنگ', fil:'Accounting' },
    'المبيعات': { en:'Sales', hi:'बिक्री', ur:'سیلز', fil:'Benta' },
    'التسويق': { en:'Marketing', hi:'विपणन', ur:'مارکیٹنگ', fil:'Marketing' },
    'العمليات': { en:'Operations', hi:'संचालन', ur:'آپریشنز', fil:'Operations' },
    'الإنتاج': { en:'Production', hi:'उत्पादन', ur:'پروڈکشن', fil:'Produksyon' },
    'الجودة': { en:'Quality', hi:'गुणवत्ता', ur:'کوالٹی', fil:'Kalidad' },
    'ضمان الجودة': { en:'Quality Assurance', hi:'गुणवत्ता आश्वासन', ur:'کوالٹی اشورنس', fil:'Quality Assurance' },
    'خدمة العملاء': { en:'Customer Service', hi:'ग्राहक सेवा', ur:'کسٹمر سروس', fil:'Customer Service' },
    'الدعم الفني': { en:'Technical Support', hi:'तकनीकी सहायता', ur:'ٹیکنیکل سپورٹ', fil:'Technical Support' },
    'القانوني': { en:'Legal', hi:'कानूनी', ur:'قانونی', fil:'Legal' },
    'الشؤون القانونية': { en:'Legal Affairs', hi:'कानूनी मामले', ur:'قانونی معاملات', fil:'Legal Affairs' },
    'الإدارة': { en:'Administration', hi:'प्रशासन', ur:'انتظامیہ', fil:'Administrasyon' },
    'الشؤون الإدارية': { en:'Administrative Affairs', hi:'प्रशासनिक मामले', ur:'انتظامی معاملات', fil:'Administrative Affairs' },
    'التطوير': { en:'Development', hi:'विकास', ur:'ترقی', fil:'Pag-unlad' },
    'البحث والتطوير': { en:'Research & Development', hi:'अनुसंधान एवं विकास', ur:'ریسرچ اینڈ ڈویلپمنٹ', fil:'Research & Development' },
    'المشتريات': { en:'Procurement', hi:'क्रय', ur:'خریداری', fil:'Procurement' },
    'سلسلة التوريد': { en:'Supply Chain', hi:'आपूर्ति श्रृंखला', ur:'سپلائی چین', fil:'Supply Chain' },
    'اللوجستيات': { en:'Logistics', hi:'रसद', ur:'لاجسٹکس', fil:'Logistics' },
    'التخزين': { en:'Warehouse', hi:'भंडारण', ur:'گودام', fil:'Bodega' },
    'الأمن': { en:'Security', hi:'सुरक्षा', ur:'سیکیورٹی', fil:'Seguridad' },
    'الصيانة': { en:'Maintenance', hi:'रखरखाव', ur:'مینٹیننس', fil:'Maintenance' },
    'الخدمات': { en:'Services', hi:'सेवाएं', ur:'خدمات', fil:'Mga Serbisyo' },
    'العلاقات العامة': { en:'Public Relations', hi:'जनसंपर्क', ur:'پبلک ریلیشنز', fil:'Public Relations' },
    'التدريب': { en:'Training', hi:'प्रशिक्षण', ur:'ٹریننگ', fil:'Pagsasanay' },
    'الهندسة': { en:'Engineering', hi:'इंजीनियरिंग', ur:'انجینیئرنگ', fil:'Engineering' },
    'المستودعات': { en:'Warehousing', hi:'भंडारण', ur:'گودام', fil:'Bodega' },
    'الشراء': { en:'Purchasing', hi:'खरीदारी', ur:'خریداری', fil:'Pagbili' },
    'التخطيط': { en:'Planning', hi:'योजना', ur:'منصوبہ بندی', fil:'Pagpaplano' },

    // حالات الموظف والحضور — Statuses
    'نشط': { en:'Active', hi:'सक्रिय', ur:'فعال', fil:'Aktibo' },
    'نشطة': { en:'Active', hi:'सक्रिय', ur:'فعال', fil:'Aktibo' },
    'غير نشط': { en:'Inactive', hi:'निष्क्रिय', ur:'غیر فعال', fil:'Hindi aktibo' },
    'في إجازة': { en:'On Leave', hi:'छुट्टी पर', ur:'رخصت پر', fil:'Sa bakasyon' },
    'موقوف': { en:'Suspended', hi:'निलंबित', ur:'معطل', fil:'Suspendido' },
    'منتهي': { en:'Terminated', hi:'समाप्त', ur:'ختم', fil:'Tinanggal' },
    'منتهية': { en:'Terminated', hi:'समाप्त', ur:'ختم', fil:'Tinanggal' },
    'حاضر': { en:'Present', hi:'उपस्थित', ur:'حاضر', fil:'Naroroon' },
    'غائب': { en:'Absent', hi:'अनुपस्थित', ur:'غیر حاضر', fil:'Absent' },
    'متأخر': { en:'Late', hi:'देर', ur:'دیر', fil:'Huli' },
    'مبكر': { en:'Early', hi:'जल्दी', ur:'جلدی', fil:'Maaga' },
    'قيد المراجعة': { en:'Under Review', hi:'समीक्षाधीन', ur:'زیر جائزہ', fil:'Sa ilalim ng pagsusuri' },
    'في الانتظار': { en:'Pending', hi:'लंबित', ur:'زیر التواء', fil:'Nakabinbin' },
    'معتمد': { en:'Approved', hi:'स्वीकृत', ur:'منظور', fil:'Naaprubahan' },
    'مرفوض': { en:'Rejected', hi:'अस्वीकृत', ur:'مسترد', fil:'Tinanggihan' },
    'مكتمل': { en:'Completed', hi:'पूर्ण', ur:'مکمل', fil:'Kumpleto' },
    'ملغي': { en:'Cancelled', hi:'रद्द', ur:'منسوخ', fil:'Nakansela' },
    'ملغى': { en:'Cancelled', hi:'रद्द', ur:'منسوخ', fil:'Nakansela' },
    'مدفوع': { en:'Paid', hi:'भुगतान किया', ur:'ادا', fil:'Binayaran' },
    'غير مدفوع': { en:'Unpaid', hi:'अवैतनिक', ur:'غیر ادا', fil:'Hindi Binayaran' },
    'منجز': { en:'Done', hi:'पूरा हो गया', ur:'مکمل', fil:'Tapos na' },
    'جزئي': { en:'Partial', hi:'आंशिक', ur:'جزوی', fil:'Bahagyang' },
    'منتظر': { en:'Waiting', hi:'प्रतीक्षा', ur:'انتظار', fil:'Naghihintay' },
    'معالج': { en:'Processed', hi:'संसाधित', ur:'پروسس شدہ', fil:'Naproseso' },

    // أنواع الإجازات — Leave Types
    'إجازة سنوية': { en:'Annual Leave', hi:'वार्षिक अवकाश', ur:'سالانہ رخصت', fil:'Taunang Bakasyon' },
    'إجازة مرضية': { en:'Sick Leave', hi:'बीमारी की छुट्टी', ur:'بیماری کی رخصت', fil:'Sick Leave' },
    'إجازة طارئة': { en:'Emergency Leave', hi:'आपातकालीन छुट्टी', ur:'ہنگامی رخصت', fil:'Emergency Leave' },
    'إجازة أمومة': { en:'Maternity Leave', hi:'मातृत्व अवकाश', ur:'زچگی رخصت', fil:'Maternity Leave' },
    'إجازة أبوة': { en:'Paternity Leave', hi:'पितृत्व अवकाश', ur:'پدرانہ رخصت', fil:'Paternity Leave' },
    'إجازة بدون راتب': { en:'Unpaid Leave', hi:'बिना वेतन की छुट्टी', ur:'بغیر تنخواہ رخصت', fil:'Unpaid Leave' },
    'إجازة رسمية': { en:'Official Holiday', hi:'आधिकारिक अवकाश', ur:'سرکاری چھٹی', fil:'Official Holiday' },
    'إجازة خاصة': { en:'Personal Leave', hi:'व्यक्तिगत अवकाश', ur:'ذاتی رخصت', fil:'Personal Leave' },
    'إجازة دراسية': { en:'Study Leave', hi:'अध्ययन अवकाश', ur:'تعلیمی رخصت', fil:'Study Leave' },
    'إجازة زواج': { en:'Marriage Leave', hi:'विवाह अवकाश', ur:'شادی کی رخصت', fil:'Marriage Leave' },
    'راحة': { en:'Day Off', hi:'अवकाश', ur:'چھٹی', fil:'Pahinga' },

    // أنواع الطلبات — Request Types
    'إذن خروج': { en:'Exit Permission', hi:'बाहर जाने की अनुमति', ur:'خروج اجازت', fil:'Pahintulot na Lumabas' },
    'عمل إضافي': { en:'Overtime', hi:'ओवरटाइम', ur:'اوور ٹائم', fil:'Overtime' },
    'عمل من المنزل': { en:'Work From Home', hi:'घर से काम', ur:'گھر سے کام', fil:'Work From Home' },
    'تغيير مناوبة': { en:'Shift Change', hi:'पाली बदलना', ur:'شفٹ تبدیلی', fil:'Pagbabago ng Shift' },
    'سلفة': { en:'Advance', hi:'अग्रिम', ur:'پیشگی', fil:'Advance' },
    'قرض': { en:'Loan', hi:'ऋण', ur:'قرضہ', fil:'Utang' },
    'وثيقة': { en:'Document', hi:'दस्तावेज़', ur:'دستاویز', fil:'Dokumento' },
    'شهادة': { en:'Certificate', hi:'प्रमाण पत्र', ur:'سرٹیفکیٹ', fil:'Sertipiko' },

    // أسباب الإجازة — Common Reasons
    'مرض': { en:'Illness', hi:'बीमारी', ur:'بیماری', fil:'Sakit' },
    'مرض شخصي': { en:'Personal illness', hi:'व्यक्तिगत बीमारी', ur:'ذاتی بیماری', fil:'Personal na sakit' },
    'مرض عائلي': { en:'Family illness', hi:'पारिवारिक बीमारी', ur:'خاندانی بیماری', fil:'Sakit ng pamilya' },
    'سفر عائلي': { en:'Family travel', hi:'पारिवारिक यात्रा', ur:'خاندانی سفر', fil:'Paglalakbay ng pamilya' },
    'ظروف عائلية': { en:'Family circumstances', hi:'पारिवारिक परिस्थितियाँ', ur:'خاندانی حالات', fil:'Pangyayari sa pamilya' },
    'وفاة': { en:'Bereavement', hi:'मृत्यु', ur:'انتقال', fil:'Pagkamatay' },
    'زيارة طبية': { en:'Medical visit', hi:'चिकित्सा यात्रा', ur:'طبی معائنہ', fil:'Medikal na pagbisita' },
    'عملية جراحية': { en:'Surgery', hi:'शल्यक्रिया', ur:'آپریشن', fil:'Operasyon' },
    'أسباب شخصية': { en:'Personal reasons', hi:'व्यक्तिगत कारण', ur:'ذاتی وجوہات', fil:'Personal na dahilan' },
    'أسباب عائلية': { en:'Family reasons', hi:'पारिवारिक कारण', ur:'خاندانی وجوہات', fil:'Dahilan sa pamilya' },
    'التزامات شخصية': { en:'Personal commitments', hi:'व्यक्तिगत प्रतिबद्धताएं', ur:'ذاتی وعدے', fil:'Personal na pangako' },
    'دراسة': { en:'Study', hi:'अध्ययन', ur:'تعلیم', fil:'Pag-aaral' },
    'امتحان': { en:'Exam', hi:'परीक्षा', ur:'امتحان', fil:'Eksam' },
    'مؤتمر': { en:'Conference', hi:'सम्मेलन', ur:'کانفرنس', fil:'Kumperensya' },

    // العطل الرسمية — Holidays
    'اليوم الوطني': { en:'National Day', hi:'राष्ट्रीय दिवस', ur:'قومی دن', fil:'Pambansang Araw' },
    'عيد الفطر': { en:'Eid Al-Fitr', hi:'ईद उल-फितर', ur:'عید الفطر', fil:'Eid Al-Fitr' },
    'عيد الأضحى': { en:'Eid Al-Adha', hi:'ईद उल-अज़हा', ur:'عید الاضحیٰ', fil:'Eid Al-Adha' },
    'رأس السنة': { en:'New Year', hi:'नया साल', ur:'نیا سال', fil:'Bagong Taon' },
    'رأس السنة الميلادية': { en:'New Year\'s Day', hi:'नव वर्ष दिवस', ur:'نئے سال کا دن', fil:'Bagong Taon' },
    'اليوم التأسيسي': { en:'Foundation Day', hi:'स्थापना दिवस', ur:'یوم تاسیس', fil:'Foundation Day' },
    'يوم العمال': { en:'Labour Day', hi:'श्रमिक दिवस', ur:'یوم مزدور', fil:'Labor Day' },

    // أيام الأسبوع — Days of Week
    'الأحد': { en:'Sunday', hi:'रविवार', ur:'اتوار', fil:'Linggo' },
    'الاثنين': { en:'Monday', hi:'सोमवार', ur:'پیر', fil:'Lunes' },
    'الثلاثاء': { en:'Tuesday', hi:'मंगलवार', ur:'منگل', fil:'Martes' },
    'الأربعاء': { en:'Wednesday', hi:'बुधवार', ur:'بدھ', fil:'Miyerkules' },
    'الخميس': { en:'Thursday', hi:'गुरुवार', ur:'جمعرات', fil:'Huwebes' },
    'الجمعة': { en:'Friday', hi:'शुक्रवार', ur:'جمعہ', fil:'Biyernes' },
    'السبت': { en:'Saturday', hi:'शनिवार', ur:'ہفتہ', fil:'Sabado' },

    // الشهور — Months
    'يناير': { en:'January', hi:'जनवरी', ur:'جنوری', fil:'Enero' },
    'فبراير': { en:'February', hi:'फरवरी', ur:'فروری', fil:'Pebrero' },
    'مارس': { en:'March', hi:'मार्च', ur:'مارچ', fil:'Marso' },
    'أبريل': { en:'April', hi:'अप्रैल', ur:'اپریل', fil:'Abril' },
    'مايو': { en:'May', hi:'मई', ur:'مئی', fil:'Mayo' },
    'يونيو': { en:'June', hi:'जून', ur:'جون', fil:'Hunyo' },
    'يوليو': { en:'July', hi:'जुलाई', ur:'جولائی', fil:'Hulyo' },
    'أغسطس': { en:'August', hi:'अगस्त', ur:'اگست', fil:'Agosto' },
    'سبتمبر': { en:'September', hi:'सितम्बर', ur:'ستمبر', fil:'Setyembre' },
    'أكتوبر': { en:'October', hi:'अक्टूबर', ur:'اکتوبر', fil:'Oktubre' },
    'نوفمبر': { en:'November', hi:'नवम्बर', ur:'نومبر', fil:'Nobyembre' },
    'ديسمبر': { en:'December', hi:'दिसम्बर', ur:'دسمبر', fil:'Disyembre' },

    // مصطلحات الرواتب — Payroll Terms
    'راتب أساسي': { en:'Basic Salary', hi:'मूल वेतन', ur:'بنیادی تنخواہ', fil:'Pangunahing Sahod' },
    'بدل سكن': { en:'Housing Allowance', hi:'आवास भत्ता', ur:'رہائش الاؤنس', fil:'Housing Allowance' },
    'بدل مواصلات': { en:'Transportation Allowance', hi:'परिवहन भत्ता', ur:'ٹرانسپورٹ الاؤنس', fil:'Transportation Allowance' },
    'بدل هاتف': { en:'Phone Allowance', hi:'फोन भत्ता', ur:'فون الاؤنس', fil:'Phone Allowance' },
    'بدل خاص': { en:'Special Allowance', hi:'विशेष भत्ता', ur:'خصوصی الاؤنس', fil:'Special Allowance' },
    'بدل غذاء': { en:'Food Allowance', hi:'खाद्य भत्ता', ur:'کھانے کا الاؤنس', fil:'Food Allowance' },
    'مكافأة سنوية': { en:'Annual Bonus', hi:'वार्षिक बोनस', ur:'سالانہ بونس', fil:'Taunang Bonus' },
    'مكافأة أداء': { en:'Performance Bonus', hi:'प्रदर्शन बोनस', ur:'کارکردگی بونس', fil:'Performance Bonus' },
    'مكافأة نهاية خدمة': { en:'End of Service Gratuity', hi:'सेवानिवृत्ति लाभ', ur:'اینڈ آف سروس گریجویٹی', fil:'End of Service Gratuity' },
    'نهاية الخدمة': { en:'End of Service', hi:'सेवा की समाप्ति', ur:'اینڈ آف سروس', fil:'End of Service' },
    'ساعات إضافية': { en:'Overtime Hours', hi:'ओवरटाइम घंटे', ur:'اوور ٹائم گھنٹے', fil:'Overtime na Oras' },
    'تأمين طبي': { en:'Medical Insurance', hi:'चिकित्सा बीमा', ur:'طبی انشورنس', fil:'Medical Insurance' },
    'تأمين اجتماعي': { en:'Social Insurance', hi:'सामाजिक बीमा', ur:'سوشل انشورنس', fil:'Social Insurance' },
    'اقتطاع': { en:'Deduction', hi:'कटौती', ur:'کٹوتی', fil:'Bawas' },
    'سلفة': { en:'Advance', hi:'अग्रिम', ur:'پیشگی', fil:'Advance' },

    // فئات المصروفات — Expense Categories
    'سفر': { en:'Travel', hi:'यात्रा', ur:'سفر', fil:'Paglalakbay' },
    'وجبات': { en:'Meals', hi:'भोजन', ur:'کھانا', fil:'Pagkain' },
    'إقامة': { en:'Accommodation', hi:'आवास', ur:'قیام', fil:'Tirahan' },
    'مواصلات': { en:'Transport', hi:'परिवहन', ur:'ٹرانسپورٹ', fil:'Transportasyon' },
    'اتصالات': { en:'Communication', hi:'संचार', ur:'مواصلات', fil:'Komunikasyon' },
    'مستلزمات': { en:'Supplies', hi:'आपूर्ति', ur:'سامان', fil:'Mga Kagamitan' },
    'أخرى': { en:'Other', hi:'अन्य', ur:'دیگر', fil:'Iba pa' },
    'أخرى': { en:'Other', hi:'अन्य', ur:'دیگر', fil:'Iba pa' },

    // طرق الحضور — Attendance Methods
    'بصمة الوجه': { en:'Face Recognition', hi:'चेहरे की पहचान', ur:'چہرے کی پہچان', fil:'Face Recognition' },
    'بصمة الإصبع': { en:'Fingerprint', hi:'फिंगरप्रिंट', ur:'انگلی کا نشان', fil:'Fingerprint' },
    'رمز QR': { en:'QR Code', hi:'QR कोड', ur:'QR کوڈ', fil:'QR Code' },
    'يدوي': { en:'Manual', hi:'मैन्युअल', ur:'دستی', fil:'Manual' },
    'نظام تحديد المواقع': { en:'GPS', hi:'जीपीएस', ur:'جی پی ایس', fil:'GPS' },
    'تطبيق الجوال': { en:'Mobile App', hi:'मोबाइल ऐप', ur:'موبائل ایپ', fil:'Mobile App' },
    'الويب': { en:'Web', hi:'वेब', ur:'ویب', fil:'Web' },

    // نوع العقد — Contract Types
    'دوام كامل': { en:'Full Time', hi:'पूर्ण समय', ur:'فل ٹائم', fil:'Full Time' },
    'دوام جزئي': { en:'Part Time', hi:'अंशकालिक', ur:'پارٹ ٹائم', fil:'Part Time' },
    'عقد مؤقت': { en:'Temporary', hi:'अस्थायी', ur:'عارضی', fil:'Pansamantala' },
    'متعاقد': { en:'Contractor', hi:'ठेकेदार', ur:'کنٹریکٹر', fil:'Kontratista' },
    'متدرب': { en:'Intern', hi:'प्रशिक्षु', ur:'انٹرن', fil:'Intern' },

    // الجنسيات الشائعة — Common Nationalities
    'سعودي': { en:'Saudi', hi:'सऊदी', ur:'سعودی', fil:'Saudi' },
    'سعودية': { en:'Saudi', hi:'सऊदी', ur:'سعودی', fil:'Saudi' },
    'مصري': { en:'Egyptian', hi:'मिस्री', ur:'مصری', fil:'Ehipsiyo' },
    'مصرية': { en:'Egyptian', hi:'मिस्री', ur:'مصری', fil:'Ehipsiyo' },
    'أردني': { en:'Jordanian', hi:'जॉर्डनियन', ur:'اردنی', fil:'Jordanian' },
    'هندي': { en:'Indian', hi:'भारतीय', ur:'ہندوستانی', fil:'Indian' },
    'هندية': { en:'Indian', hi:'भारतीय', ur:'ہندوستانی', fil:'Indian' },
    'باكستاني': { en:'Pakistani', hi:'पाकिस्तानी', ur:'پاکستانی', fil:'Pakistani' },
    'فلبيني': { en:'Filipino', hi:'फिलिपिनो', ur:'فلپائنی', fil:'Pilipino' },
    'يمني': { en:'Yemeni', hi:'यमनी', ur:'یمنی', fil:'Yemenite' },
    'سوداني': { en:'Sudanese', hi:'सूडानी', ur:'سوڈانی', fil:'Sudanese' },
    'سوري': { en:'Syrian', hi:'सीरियाई', ur:'شامی', fil:'Syrian' },
    'إثيوبي': { en:'Ethiopian', hi:'इथियोपियाई', ur:'ایتھوپیائی', fil:'Ethiopian' },

    // الجنس — Gender
    'ذكر': { en:'Male', hi:'पुरुष', ur:'مرد', fil:'Lalaki' },
    'أنثى': { en:'Female', hi:'महिला', ur:'خاتون', fil:'Babae' },
    'رجل': { en:'Male', hi:'पुरुष', ur:'مرد', fil:'Lalaki' },
    'امرأة': { en:'Female', hi:'महिला', ur:'خاتون', fil:'Babae' },

    // الحالة الاجتماعية — Marital Status
    'متزوج': { en:'Married', hi:'विवाहित', ur:'شادی شدہ', fil:'Kasal' },
    'متزوجة': { en:'Married', hi:'विवाहित', ur:'شادی شدہ', fil:'Kasal' },
    'أعزب': { en:'Single', hi:'अविवाहित', ur:'غیر شادی شدہ', fil:'Walang asawa' },
    'عزباء': { en:'Single', hi:'अविवाहित', ur:'غیر شادی شدہ', fil:'Walang asawa' },
    'مطلق': { en:'Divorced', hi:'तलाकशुदा', ur:'طلاق یافتہ', fil:'Hiwalay' },
    'مطلقة': { en:'Divorced', hi:'तलाकशुदा', ur:'طلاق یافتہ', fil:'Hiwalay' },
    'أرمل': { en:'Widowed', hi:'विधुर', ur:'بیوہ', fil:'Balo' },
    'أرملة': { en:'Widowed', hi:'विधवा', ur:'بیوہ', fil:'Balo' },

    // مصطلحات عامة — General Terms
    'الشركة': { en:'Company', hi:'कंपनी', ur:'کمپنی', fil:'Kumpanya' },
    'المؤسسة': { en:'Organization', hi:'संगठन', ur:'ادارہ', fil:'Organisasyon' },
    'الفرع': { en:'Branch', hi:'शाखा', ur:'برانچ', fil:'Sangay' },
    'القسم': { en:'Department', hi:'विभाग', ur:'محکمہ', fil:'Departamento' },
    'الفريق': { en:'Team', hi:'टीम', ur:'ٹیم', fil:'Koponan' },
    'الموظف': { en:'Employee', hi:'कर्मचारी', ur:'ملازم', fil:'Empleyado' },
    'العقد': { en:'Contract', hi:'अनुबंध', ur:'معاہدہ', fil:'Kontrata' },
    'الراتب': { en:'Salary', hi:'वेतन', ur:'تنخواہ', fil:'Sahod' },
    'راتب': { en:'Salary', hi:'वेतन', ur:'تنخواہ', fil:'Sahod' },
    'مكافأة': { en:'Bonus', hi:'बोनस', ur:'بونس', fil:'Bonus' },
    'خصم': { en:'Deduction', hi:'कटौती', ur:'کٹوتی', fil:'Bawas' },
    'ضريبة': { en:'Tax', hi:'कर', ur:'ٹیکس', fil:'Buwis' },
    'تأمين': { en:'Insurance', hi:'बीमा', ur:'انشورنس', fil:'Insurance' },
    'الدرجة الوظيفية': { en:'Job Grade', hi:'नौकरी की श्रेणी', ur:'جاب گریڈ', fil:'Job Grade' },
    'تاريخ التعيين': { en:'Hire Date', hi:'नियुक्ति तिथि', ur:'تقرری کی تاریخ', fil:'Petsa ng Hire' },
    'تاريخ الميلاد': { en:'Date of Birth', hi:'जन्म तिथि', ur:'تاریخ پیدائش', fil:'Petsa ng Kapanganakan' },
    'رقم الهوية': { en:'ID Number', hi:'पहचान संख्या', ur:'شناختی نمبر', fil:'ID Number' },
    'الجنسية': { en:'Nationality', hi:'राष्ट्रीयता', ur:'قومیت', fil:'Nasyonalidad' },
    'الجنس': { en:'Gender', hi:'लिंग', ur:'جنس', fil:'Kasarian' },
    'العنوان': { en:'Address', hi:'पता', ur:'پتہ', fil:'Address' },
    'رقم الهاتف': { en:'Phone Number', hi:'फोन नंबर', ur:'فون نمبر', fil:'Numero ng Telepono' },
    'البريد الإلكتروني': { en:'Email', hi:'ईमेल', ur:'ای میل', fil:'Email' },
    'الملاحظات': { en:'Notes', hi:'नोट्स', ur:'نوٹس', fil:'Mga Tala' },
    'الوصف': { en:'Description', hi:'विवरण', ur:'تفصیل', fil:'Paglalarawan' },
    'السبب': { en:'Reason', hi:'कारण', ur:'وجہ', fil:'Dahilan' },
    'التعليق': { en:'Comment', hi:'टिप्पणी', ur:'تبصرہ', fil:'Komento' },
    'الكل': { en:'All', hi:'सभी', ur:'سب', fil:'Lahat' },
    'الجميع': { en:'All', hi:'सभी', ur:'سب', fil:'Lahat' },

    // واجهة عامة — UI Common
    'إضافة': { en:'Add', hi:'जोड़ें', ur:'شامل کریں', fil:'Idagdag' },
    'تعديل': { en:'Edit', hi:'संपादित करें', ur:'ترمیم', fil:'I-edit' },
    'حذف': { en:'Delete', hi:'हटाएं', ur:'حذف', fil:'Burahin' },
    'حفظ': { en:'Save', hi:'सहेजें', ur:'محفوظ کریں', fil:'I-save' },
    'إلغاء': { en:'Cancel', hi:'रद्द करें', ur:'منسوخ کریں', fil:'Kanselahin' },
    'تأكيد': { en:'Confirm', hi:'पुष्टि करें', ur:'تصدیق کریں', fil:'Kumpirmahin' },
    'بحث': { en:'Search', hi:'खोज', ur:'تلاش', fil:'Maghanap' },
    'تصفية': { en:'Filter', hi:'फ़िल्टर', ur:'فلٹر', fil:'I-filter' },
    'فلترة': { en:'Filter', hi:'फ़िल्टर', ur:'فلٹر', fil:'I-filter' },
    'تصدير': { en:'Export', hi:'निर्यात', ur:'ایکسپورٹ', fil:'I-export' },
    'استيراد': { en:'Import', hi:'आयात', ur:'امپورٹ', fil:'I-import' },
    'طباعة': { en:'Print', hi:'प्रिंट', ur:'پرنٹ', fil:'I-print' },
    'تحديث': { en:'Refresh', hi:'रीफ्रेश', ur:'ریفریش', fil:'I-refresh' },
    'نعم': { en:'Yes', hi:'हाँ', ur:'ہاں', fil:'Oo' },
    'لا': { en:'No', hi:'नहीं', ur:'نہیں', fil:'Hindi' },
    'موافق': { en:'OK', hi:'ठीक है', ur:'ٹھیک ہے', fil:'OK' },
    'إغلاق': { en:'Close', hi:'बंद करें', ur:'بند کریں', fil:'Isara' },
    'رجوع': { en:'Back', hi:'वापस', ur:'واپس', fil:'Bumalik' },
    'التالي': { en:'Next', hi:'अगला', ur:'اگلا', fil:'Susunod' },
    'السابق': { en:'Previous', hi:'पिछला', ur:'پچھلا', fil:'Nakaraan' },
    'عرض': { en:'View', hi:'देखें', ur:'دیکھیں', fil:'Tingnan' },
    'تفاصيل': { en:'Details', hi:'विवरण', ur:'تفصیلات', fil:'Detalye' },
    'ملخص': { en:'Summary', hi:'सारांश', ur:'خلاصہ', fil:'Buod' },
    'إجمالي': { en:'Total', hi:'कुल', ur:'کل', fil:'Kabuuan' },
    'المجموع': { en:'Total', hi:'कुल', ur:'کل', fil:'Kabuuan' },
    'المتوسط': { en:'Average', hi:'औसत', ur:'اوسط', fil:'Average' },
    'يوم': { en:'Day', hi:'दिन', ur:'دن', fil:'Araw' },
    'أيام': { en:'Days', hi:'दिन', ur:'دن', fil:'Mga Araw' },
    'ساعة': { en:'Hour', hi:'घंटा', ur:'گھنٹہ', fil:'Oras' },
    'ساعات': { en:'Hours', hi:'घंटे', ur:'گھنٹے', fil:'Mga Oras' },
    'شهر': { en:'Month', hi:'महीना', ur:'مہینہ', fil:'Buwan' },
    'سنة': { en:'Year', hi:'साल', ur:'سال', fil:'Taon' },
    'اليوم': { en:'Today', hi:'आज', ur:'آج', fil:'Ngayon' },
    'أمس': { en:'Yesterday', hi:'कल', ur:'کل', fil:'Kahapon' },
    'الأسبوع': { en:'Week', hi:'सप्ताह', ur:'ہفتہ', fil:'Linggo' },
    'هذا الشهر': { en:'This Month', hi:'इस महीने', ur:'اس مہینے', fil:'Ngayong Buwan' },
    'هذا العام': { en:'This Year', hi:'इस साल', ur:'اس سال', fil:'Ngayong Taon' },
    'جديد': { en:'New', hi:'नया', ur:'نیا', fil:'Bago' },
    'قديم': { en:'Old', hi:'पुराना', ur:'پرانا', fil:'Luma' },
    'نشط': { en:'Active', hi:'सक्रिय', ur:'فعال', fil:'Aktibo' },
    'غير محدد': { en:'Not specified', hi:'निर्दिष्ट नहीं', ur:'غیر متعین', fil:'Hindi tinukoy' },
    'لا يوجد': { en:'None', hi:'कोई नहीं', ur:'کوئی نہیں', fil:'Wala' },
    'غير متاح': { en:'Unavailable', hi:'अनुपलब्ध', ur:'دستیاب نہیں', fil:'Hindi available' },

    // الأولوية — Priority
    'عالية': { en:'High', hi:'उच्च', ur:'زیادہ', fil:'Mataas' },
    'متوسطة': { en:'Medium', hi:'मध्यम', ur:'درمیانہ', fil:'Katamtaman' },
    'منخفضة': { en:'Low', hi:'कम', ur:'کم', fil:'Mababa' },

    // الأنشطة — Activities
    'تسجيل دخول': { en:'Login', hi:'लॉगिन', ur:'لاگ ان', fil:'Login' },
    'تسجيل خروج': { en:'Logout', hi:'लॉगआउट', ur:'لاگ آؤٹ', fil:'Logout' },
    'تسجيل الحضور': { en:'Check In', hi:'चेक इन', ur:'چیک ان', fil:'Mag-check in' },
    'تسجيل الانصراف': { en:'Check Out', hi:'चेक आउट', ur:'چیک آؤٹ', fil:'Mag-check out' },
    'لم يتم تسجيل الانصراف': { en:'Not checked out', hi:'चेक आउट नहीं', ur:'چیک آؤٹ نہیں', fil:'Hindi nag-check out' },
  },

  // ── State ────────────────────────────────────────────────
  _cache: {},
  _pending: new Map(),
  _saveTimer: null,
  _ready: false,
  _observer: null,
  _observerDebounce: null,
  _observerActive: false,

  // ── Init ──────────────────────────────────────────────────
  init() {
    if (this._ready) return;
    this._ready = true;
    try {
      const raw = localStorage.getItem('attendify-xlat');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed._ts && Date.now() - parsed._ts < 30 * 24 * 60 * 60 * 1000) {
          this._cache = parsed.data || {};
        }
      }
    } catch { this._cache = {}; }
  },

  _saveCache() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try {
        localStorage.setItem('attendify-xlat', JSON.stringify({ _ts: Date.now(), data: this._cache }));
      } catch {}
    }, 2000);
  },

  // ── هل النص يحتوي على عربية؟ ────────────────────────────
  _isAr(s) {
    return typeof s === 'string' && /[؀-ۿݐ-ݿ]{2,}/.test(s.trim());
  },

  // ── ترجمة فورية (قاموس + كاش) ──────────────────────────
  getSync(text, lang) {
    if (!text || lang === 'ar') return null;
    const t = text.trim();
    if (!this._isAr(t)) return null;
    const d = this._dict[t] || this._dict[t.replace(/\s+/g,' ')];
    if (d?.[lang]) return d[lang];
    return this._cache[`${lang}:${t}`] || null;
  },

  // ── استدعاء MyMemory API ─────────────────────────────────
  async _apiTranslate(text, lang) {
    const langMap = { en:'en', hi:'hi', ur:'ur', fil:'tl' };
    const target  = langMap[lang] || 'en';
    const key     = `${lang}:${text}`;
    if (this._pending.has(key)) return this._pending.get(key);

    const promise = fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|${target}`
    )
    .then(r => r.json())
    .then(data => {
      const result = data?.responseData?.translatedText;
      if (result && result !== text && !/MYMEMORY WARNING/i.test(result)) {
        this._cache[key] = result;
        this._saveCache();
      }
      this._pending.delete(key);
      return result || text;
    })
    .catch(() => { this._pending.delete(key); return text; });

    this._pending.set(key, promise);
    return promise;
  },

  async translate(text, lang) {
    if (!text || lang === 'ar') return text;
    const t = text.trim();
    if (!this._isAr(t)) return t;
    const sync = this.getSync(t, lang);
    if (sync) return sync;
    return this._apiTranslate(t, lang);
  },

  // ── جمع عناصر DOM التي تحتاج ترجمة ─────────────────────
  _collectNodes(rootEl) {
    const skipTags = new Set(['SCRIPT','STYLE','CODE','PRE','NOSCRIPT','SVG','MATH']);
    const textNodes = [];
    const attrEls   = [];   // عناصر لها placeholder/title عربي
    const optionEls = [];   // عناصر <option>

    const walk = (el) => {
      if (!el) return;
      const tag = el.nodeName;
      if (skipTags.has(tag)) return;
      if (el.getAttribute?.('data-no-translate')) return;
      if (el.dataset?.xlated) return; // مُترجم مسبقاً

      // عناصر data-i18n: تخطي النص المباشر لكن لا نتوقف عن الأطفال
      const hasI18n = el.getAttribute?.('data-i18n');

      // <option>: ترجم textContent مباشرة
      if (tag === 'OPTION') {
        if (this._isAr(el.textContent)) optionEls.push(el);
        return;
      }

      // placeholder و title
      if (el.placeholder && this._isAr(el.placeholder)) attrEls.push({ el, attr: 'placeholder', val: el.placeholder });
      if (el.title      && this._isAr(el.title))       attrEls.push({ el, attr: 'title',       val: el.title });

      // نصوص النص إذا لم يكن العنصر data-i18n
      if (!hasI18n) {
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            const txt = child.textContent.trim();
            if (txt.length >= 2 && this._isAr(txt)) textNodes.push(child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        }
      } else {
        // data-i18n: لا نترجم النص المباشر لكن نمشي الأطفال
        for (const child of el.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) walk(child);
        }
      }
    };
    walk(rootEl);
    return { textNodes, attrEls, optionEls };
  },

  // ── ترجمة عنصر DOM وأبناءه ──────────────────────────────
  async translateEl(rootEl, lang) {
    if (!rootEl || lang === 'ar') return;
    this.init();

    const { textNodes, attrEls, optionEls } = this._collectNodes(rootEl);
    if (!textNodes.length && !attrEls.length && !optionEls.length) return;

    // ─── الجولة الأولى: فورية (قاموس + كاش) ─────────────
    const remainText   = [];
    const remainAttr   = [];
    const remainOption = [];

    for (const node of textNodes) {
      const txt  = node.textContent.trim();
      const sync = this.getSync(txt, lang);
      if (sync) {
        node.textContent = node.textContent.replace(txt, sync);
      } else {
        remainText.push(node);
      }
    }

    for (const item of attrEls) {
      const sync = this.getSync(item.val, lang);
      if (sync) {
        item.el[item.attr] = sync;
      } else {
        remainAttr.push(item);
      }
    }

    for (const opt of optionEls) {
      const txt  = opt.textContent.trim();
      const sync = this.getSync(txt, lang);
      if (sync) {
        opt.textContent = sync;
      } else {
        remainOption.push(opt);
      }
    }

    // ─── الجولة الثانية: API للنصوص غير المعروفة ─────────
    const allUnknown = [
      ...remainText.map(n  => n.textContent.trim()),
      ...remainAttr.map(a  => a.val),
      ...remainOption.map(o => o.textContent.trim()),
    ];
    if (!allUnknown.length) return;

    const unique  = [...new Set(allUnknown)];
    const results = await Promise.all(unique.map(t => this._apiTranslate(t, lang)));
    const map     = Object.fromEntries(unique.map((t, i) => [t, results[i]]));

    for (const node of remainText) {
      const txt = node.textContent.trim();
      const tr  = map[txt];
      if (tr && tr !== txt) node.textContent = node.textContent.replace(txt, tr);
    }
    for (const item of remainAttr) {
      const tr = map[item.val];
      if (tr && tr !== item.val) item.el[item.attr] = tr;
    }
    for (const opt of remainOption) {
      const txt = opt.textContent.trim();
      const tr  = map[txt];
      if (tr && tr !== txt) opt.textContent = tr;
    }
  },

  // ── MutationObserver: ترجمة تلقائية عند تغيير DOM ───────
  startObserver(lang) {
    this.stopObserver();
    if (lang === 'ar') return;

    const pageContent = document.getElementById('page-content');
    const sidebar     = document.getElementById('sidebar');
    if (!pageContent) return;

    const onMutation = (mutations) => {
      if (this._observerActive) return;
      clearTimeout(this._observerDebounce);
      this._observerDebounce = setTimeout(() => {
        const roots = new Set();
        for (const m of mutations) {
          if (m.addedNodes.length) {
            for (const n of m.addedNodes) {
              if (n.nodeType === Node.ELEMENT_NODE) roots.add(n);
            }
          }
        }
        if (roots.size) {
          this._observerActive = true;
          const promises = [...roots].map(r => this.translateEl(r, lang));
          Promise.all(promises).finally(() => { this._observerActive = false; });
        }
      }, 120);
    };

    this._observer = new MutationObserver(onMutation);
    const opts = { childList: true, subtree: true };
    this._observer.observe(pageContent, opts);
    if (sidebar) this._observer.observe(sidebar, opts);
  },

  stopObserver() {
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
    clearTimeout(this._observerDebounce);
    this._observerActive = false;
  },

  // ── مسح الكاش (للتطوير) ──────────────────────────────────
  clearCache() {
    this._cache = {};
    localStorage.removeItem('attendify-xlat');
  },
};

Translator.init();
