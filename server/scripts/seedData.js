/**
 * The sample content `npm run seed` writes.
 *
 * Kept apart from the script that inserts it so the two concerns stay separate:
 * this file is data to edit, seed.js is the mechanism.
 *
 * Image URLs point at picsum.photos rather than Cloudinary — nothing here was
 * ever uploaded, so `publicId` is empty and the delete path correctly finds
 * nothing to destroy (`destroyAsset` no-ops on a non-Cloudinary URL).
 */

// A stable placeholder: the same seed always returns the same picture, so a
// re-seeded database looks identical to the last one.
const img = (seed, w = 1200, h = 800) => ({
  url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  publicId: "",
});

const projectImage = (seed) => ({ ...img(seed), position: "default" });

// Days before now, so seeded content keeps a sensible spread whenever it runs.
export const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

/* -------------------------------------------------------------- projects */

export const projects = [
  /* --- current --- */
  {
    name: "Daily Roti Kitchen — Nagpada",
    category: "current",
    description:
      "Every evening our kitchen in Nagpada cooks and packs 400 hot meals for " +
      "families living in the surrounding chawls, day-wage workers who eat only " +
      "when they find work, and patients' relatives camped outside the civic " +
      "hospital.\n\n" +
      "The menu rotates through the week — dal chawal, khichdi, chole with rice, " +
      "and biryani on Fridays — and everything is cooked fresh on site by six " +
      "cooks from the neighbourhood itself. Volunteers hand the packets out " +
      "between 7 and 9 pm at four fixed points, so people know exactly where and " +
      "when to come and nobody has to queue in the open for hours.\n\n" +
      "₹2,400 keeps the kitchen running for one full day.",
    images: [projectImage("kitchen-1"), projectImage("kitchen-2"), projectImage("kitchen-3")],
    createdAt: daysAgo(12),
  },
  {
    name: "Talimi Support — School Fees & Books",
    category: "current",
    description:
      "We pay the school fees, uniforms, books and exam charges for 214 children " +
      "from families that would otherwise pull them out mid-year. Most are the " +
      "first in their family to reach secondary school.\n\n" +
      "Support is renewed annually against attendance and the school's own " +
      "progress report — not against marks, because a child working through a " +
      "difficult year is exactly the one who must not be dropped. Alongside the " +
      "fees we run evening study circles four days a week where volunteer " +
      "teachers, many of them past beneficiaries, help with maths and English.\n\n" +
      "One child's full year — fees, books, uniform and stationery — costs ₹8,500.",
    images: [projectImage("talimi-1"), projectImage("talimi-2")],
    createdAt: daysAgo(34),
  },
  {
    name: "Medical Aid Fund",
    category: "current",
    description:
      "A standing fund for the bills that arrive without warning — dialysis " +
      "cycles, cancer treatment, emergency surgery, and the long tail of monthly " +
      "medicines that a daily-wage household simply cannot absorb.\n\n" +
      "Applications are verified against the hospital estimate and paid directly " +
      "to the hospital or the chemist, never in cash. Since April the fund has " +
      "covered 63 cases, of which 21 were ongoing dialysis patients whose " +
      "treatment would have stopped altogether.\n\n" +
      "The fund is held separately from our general account and is reported on " +
      "every quarter.",
    images: [projectImage("medical-1"), projectImage("medical-2")],
    createdAt: daysAgo(58),
  },
  {
    name: "Widow & Orphan Monthly Ration",
    category: "current",
    description:
      "128 households — widows raising children alone, and families that lost " +
      "their earning member — receive a monthly ration kit of wheat, rice, dal, " +
      "oil, tea, sugar and household essentials, enough to cover a family of five " +
      "for the month.\n\n" +
      "Kits are delivered to the door in the first week of every month. Delivery " +
      "matters as much as the ration itself: it spares the family a public queue, " +
      "and it means a volunteer sees the house each month and can flag a sick " +
      "child or a school dropout to us early.\n\n" +
      "One kit costs ₹1,850 a month, or ₹22,200 to sponsor a household for a year.",
    images: [projectImage("ration-1"), projectImage("ration-2"), projectImage("ration-3")],
    createdAt: daysAgo(76),
  },
  {
    name: "Evening Study Circles",
    category: "current",
    description:
      "Four evenings a week, in two rented rooms and one mosque hall, 180 " +
      "children from classes 4 to 10 sit down for two hours of supervised study " +
      "with volunteer teachers.\n\n" +
      "Most of them live in single-room homes where there is nowhere quiet to " +
      "open a book and nobody who can help with the homework. The circles are " +
      "not coaching classes: the volunteers work through whatever the school " +
      "actually set that day, with extra time given to maths and English, the " +
      "two subjects that decide whether a child clears the board exam.\n\n" +
      "Eleven of this year's volunteers came through the programme themselves. " +
      "Running costs — rent, lighting, stationery and a snack — come to ₹34,000 " +
      "a month.",
    images: [projectImage("study-1"), projectImage("study-2")],
    createdAt: daysAgo(45),
  },
  {
    name: "Legal Aid & Documentation Desk",
    category: "current",
    description:
      "A weekly desk that helps families obtain the documents everything else " +
      "depends on — Aadhaar corrections, birth and death certificates, ration " +
      "cards, widow pension applications and school transfer certificates.\n\n" +
      "A missing or misspelt document is one of the quietest causes of hardship " +
      "we see: a widow who cannot claim her pension because her husband's death " +
      "certificate was never collected, a child refused admission for want of a " +
      "birth certificate. Two volunteer advocates sit every Sunday morning, and " +
      "a paralegal follows the cases through the offices during the week.\n\n" +
      "The desk has closed 340 cases since it opened and currently carries 78 " +
      "open ones.",
    images: [projectImage("legal-1"), projectImage("legal-2")],
    createdAt: daysAgo(90),
  },

  /* --- upcoming --- */
  {
    name: "Skill Centre for Young Women",
    category: "upcoming",
    description:
      "A tailoring, embroidery and computer-basics centre for women aged 16 to " +
      "30, planned as three batches of 25 across a six-month course ending in a " +
      "recognised certificate.\n\n" +
      "The premises above the community hall have been secured; what remains is " +
      "20 machines, the computer lab, and two trainers' salaries for the first " +
      "year. We are partnering with two local boutiques and a garment unit that " +
      "have committed to interview every graduate of the first batch.\n\n" +
      "Target: ₹14,00,000. Enrolment opens once funding reaches 70%.",
    images: [projectImage("skill-1"), projectImage("skill-2")],
    createdAt: daysAgo(9),
  },
  {
    name: "Clean Water — 12 Borewells",
    category: "upcoming",
    description:
      "Twelve villages in the district have been surveyed and cleared by the " +
      "groundwater board for borewells with hand pumps and a raised platform.\n\n" +
      "At present each of these villages walks between 1.5 and 3 kilometres for " +
      "drinking water — work that falls almost entirely on women and girls, and " +
      "is the single commonest reason girls there stop attending school. A " +
      "village committee will be formed for each site before drilling begins, so " +
      "that maintenance has an owner from day one.\n\n" +
      "₹1,10,000 per borewell; ₹13,20,000 for all twelve.",
    images: [projectImage("water-1"), projectImage("water-2")],
    createdAt: daysAgo(21),
  },
  {
    name: "Winter Blanket Drive 2026",
    category: "upcoming",
    description:
      "5,000 blankets for pavement dwellers, construction-site families and the " +
      "old-age homes we work with, distributed across the first two weeks of " +
      "December before the cold sets in properly.\n\n" +
      "Last winter we managed 3,200 and still turned people away on the final " +
      "night. Collection points open in November at the four mosques and two " +
      "schools that hosted us last year, and we buy in bulk directly from the " +
      "mill so a ₹450 donation is one full blanket rather than most of one.",
    images: [projectImage("blanket-1")],
    createdAt: daysAgo(3),
  },
  {
    name: "Mobile Health Van",
    category: "upcoming",
    description:
      "A fitted-out van running a fixed six-day circuit through settlements that " +
      "have no clinic within reach — a doctor, a nurse, basic diagnostics and a " +
      "dispensary that hands out the month's medicines on the spot.\n\n" +
      "The plan is deliberately unambitious about what it treats: blood pressure, " +
      "diabetes, anaemia, skin and respiratory complaints, and antenatal checks. " +
      "These are the conditions that turn into emergencies purely because nobody " +
      "looked at them in time. The route is fixed so that a patient started on " +
      "treatment in one visit is seen again the next week at the same spot.\n\n" +
      "₹18,00,000 for the vehicle and fit-out, plus ₹95,000 a month to run it. " +
      "Two doctors have already committed one day a week each.",
    images: [projectImage("van-1"), projectImage("van-2")],
    createdAt: daysAgo(15),
  },
  {
    name: "Orphan Sponsorship — 100 Children",
    category: "upcoming",
    description:
      "A structured sponsorship scheme placing 100 orphaned children with a " +
      "single donor each, covering the child's education, clothing, medical care " +
      "and a monthly allowance to the guardian household.\n\n" +
      "The children stay with their extended families rather than in an " +
      "institution — an aunt, a grandmother, an elder sibling — and the allowance " +
      "is what makes that possible for households already stretched. Sponsors " +
      "receive a report twice a year with the school's progress card, and may " +
      "meet the family if both sides wish.\n\n" +
      "₹2,000 a month sponsors one child. The register of 100 has been verified " +
      "and is ready; sponsorships open next quarter.",
    images: [projectImage("orphan-1"), projectImage("orphan-2"), projectImage("orphan-3")],
    createdAt: daysAgo(27),
  },
  {
    name: "Community Library & Reading Room",
    category: "upcoming",
    description:
      "A lending library and quiet reading room on the ground floor of the " +
      "community building — 4,000 books in Urdu, Hindi, Marathi and English, " +
      "twenty study seats, and a competitive-exam section for students preparing " +
      "for police, railway and clerical recruitment.\n\n" +
      "The demand came from the study circles: older students kept asking for " +
      "somewhere to sit through the day, not just the evening. The room will be " +
      "open 8 am to 9 pm, free, with membership open to anyone from the ward.\n\n" +
      "₹9,50,000 covers the shelving, furniture, the opening collection and a " +
      "librarian for the first year. Book donations are welcome now.",
    images: [projectImage("library-1"), projectImage("library-2")],
    createdAt: daysAgo(33),
  },

  /* --- completed --- */
  {
    name: "Ramadan Food Distribution 2026",
    category: "completed",
    description:
      "Through Ramadan we distributed 18,400 iftar meals and 1,240 full-month " +
      "ration kits across eleven localities, and served daily iftar at three " +
      "mosques for anyone who came.\n\n" +
      "The kits went out in the first three days of the month so families could " +
      "plan the whole of Ramadan around them rather than eat into it waiting. " +
      "Eid clothing reached 900 children on the 27th night.\n\n" +
      "Total spent: ₹41,60,000, of which ₹38,90,000 came from Zakat and Fitr and " +
      "was accounted for separately. The full statement is available on request.",
    images: [projectImage("ramadan-1"), projectImage("ramadan-2"), projectImage("ramadan-3")],
    createdAt: daysAgo(150),
  },
  {
    name: "Flood Relief — Nanded District",
    category: "completed",
    description:
      "Within 48 hours of the river breaching we had four teams in the affected " +
      "villages with drinking water, dry rations, tarpaulin and a medical camp.\n\n" +
      "Over three weeks the operation reached 2,700 families: 6,000 water cans, " +
      "2,700 dry-ration kits, 850 tarpaulins, and a camp that treated 1,900 " +
      "people for the skin and stomach infections that follow standing water. In " +
      "the final phase we rebuilt 46 houses that had lost their roofs entirely.\n\n" +
      "Every rupee of the ₹28,00,000 raised for the appeal was spent on it, and " +
      "the surplus at close — ₹1,20,000 — was carried into the housing rebuild " +
      "rather than into general funds.",
    images: [projectImage("flood-1"), projectImage("flood-2")],
    createdAt: daysAgo(240),
  },
  {
    name: "Qurbani 2025",
    category: "completed",
    description:
      "412 shares of qurbani performed and distributed as fresh meat to 3,100 " +
      "households across the three days of Eid al-Adha.\n\n" +
      "Distribution followed the register we maintain year-round — the same " +
      "families the ration kits reach — with the remainder given at the " +
      "distribution points on a first-come basis. Nothing was frozen or held " +
      "back; for most of these households this is the only meat of the year.\n\n" +
      "Donors received the details of their share by SMS on the day it was " +
      "performed.",
    images: [projectImage("qurbani-1"), projectImage("qurbani-2")],
    createdAt: daysAgo(400),
  },
  {
    name: "Madrasa Roof Repair — Bhiwandi",
    category: "completed",
    description:
      "The roof over the two main classrooms had been leaking through three " +
      "monsoons, and the 140 children were being taught in the corridor whenever " +
      "it rained.\n\n" +
      "Work ran across the dry months: the sheeting was replaced, the trusses " +
      "treated, guttering added, and the classrooms replastered and painted. The " +
      "children moved back in before the June term.\n\n" +
      "Completed for ₹6,40,000 against an estimate of ₹7,00,000; the balance was " +
      "spent on new mats and fans for the same two rooms.",
    images: [projectImage("roof-1"), projectImage("roof-2")],
    createdAt: daysAgo(310),
  },
  {
    name: "Covid Oxygen & Ration Response",
    category: "completed",
    description:
      "Through the second wave we ran an oxygen concentrator bank and a helpline " +
      "that stayed open around the clock for eleven weeks.\n\n" +
      "42 concentrators were lent out free against nothing but a phone number, " +
      "collected and sanitised between patients, and cycled through 380 " +
      "households. Alongside it, 4,100 ration kits went to families where the " +
      "earning member was ill or had lost work, and volunteers arranged 96 " +
      "burials for households that could not manage them.\n\n" +
      "The concentrators were donated on to two charitable hospitals when the " +
      "wave passed, rather than left in a store room.",
    images: [projectImage("covid-1"), projectImage("covid-2"), projectImage("covid-3")],
    createdAt: daysAgo(520),
  },
  {
    name: "Sewing Machines for 60 Women",
    category: "completed",
    description:
      "Sixty women who had completed a tailoring course but had no machine of " +
      "their own were each given one, along with a starter kit of thread, " +
      "scissors and cloth.\n\n" +
      "A machine is the whole difference between a certificate and an income. " +
      "The follow-up survey at nine months found 48 of the sixty earning " +
      "regularly from home — most between ₹3,000 and ₹7,000 a month — and four " +
      "who had taken on work from a garment unit and were employing a second " +
      "woman each.\n\n" +
      "Total cost ₹5,40,000. The lesson from this project is what became the " +
      "Skill Centre now being funded.",
    images: [projectImage("sewing-1"), projectImage("sewing-2")],
    createdAt: daysAgo(365),
  },
];

/* ------------------------------------------------------------- galleries */

export const galleries = [
  {
    title: "Ramadan Iftar 2026",
    images: [img("g-ramadan-1"), img("g-ramadan-2"), img("g-ramadan-3"), img("g-ramadan-4")],
    createdAt: daysAgo(148),
  },
  {
    title: "Eid Clothing Distribution",
    images: [img("g-eid-1"), img("g-eid-2"), img("g-eid-3")],
    createdAt: daysAgo(142),
  },
  {
    title: "Flood Relief Camp — Nanded",
    images: [
      img("g-flood-1"),
      img("g-flood-2"),
      img("g-flood-3"),
      img("g-flood-4"),
      img("g-flood-5"),
    ],
    createdAt: daysAgo(236),
  },
  {
    title: "Talimi Support — Annual Prize Day",
    images: [img("g-school-1"), img("g-school-2"), img("g-school-3")],
    createdAt: daysAgo(64),
  },
  {
    title: "Monthly Ration Distribution",
    images: [img("g-ration-1"), img("g-ration-2")],
    createdAt: daysAgo(30),
  },
  {
    title: "Medical Camp — Free Eye Checkup",
    images: [img("g-camp-1"), img("g-camp-2"), img("g-camp-3"), img("g-camp-4")],
    createdAt: daysAgo(17),
  },
  {
    title: "Volunteers' Meet 2026",
    images: [img("g-vol-1"), img("g-vol-2")],
    createdAt: daysAgo(6),
  },
];

/* -------------------------------------------------------- inbox messages */

export const contacts = [
  {
    name: "Ayesha Shaikh",
    email: "ayesha.shaikh@example.com",
    number: "9820114576",
    message:
      "Assalamu alaikum. I would like to sponsor one child's school fees for the " +
      "coming year under Talimi Support. Please let me know how to go about it " +
      "and whether I can receive the child's progress report.",
    createdAt: daysAgo(1),
  },
  {
    name: "Rakesh Menon",
    email: "rakesh.menon@example.com",
    number: "9930221145",
    message:
      "Our office CSR committee is looking for a partner for a mid-day meal " +
      "programme. Could you share your 80G certificate and last year's audited " +
      "statement? Happy to visit the kitchen before we decide.",
    createdAt: daysAgo(2),
  },
  {
    name: "Fatima Ansari",
    email: "fatima.ansari@example.com",
    number: "8767432109",
    message:
      "I donated ₹5,000 on Friday but did not receive the receipt on email. The " +
      "amount has been debited. Can you check and resend it? Thank you.",
    createdAt: daysAgo(3),
  },
  {
    name: "Imran Qureshi",
    email: "imran.qureshi@example.com",
    number: "9004556781",
    message:
      "I am a final-year MBBS student and would like to volunteer at the medical " +
      "camps on weekends. Please let me know if there is a form to fill or " +
      "someone I should speak to.",
    createdAt: daysAgo(5),
  },
  {
    name: "Sunita Deshpande",
    email: "sunita.deshpande@example.com",
    number: "9822345670",
    message:
      "We have around 60 blankets and some warm clothing in good condition to " +
      "give for the winter drive. Is there a collection point in Kothrud, or do " +
      "you arrange pickup?",
    createdAt: daysAgo(8),
  },
  {
    name: "Mohammed Farhan",
    email: "m.farhan@example.com",
    number: "7738119042",
    message:
      "Wanted to ask whether Zakat given here is kept separate from other " +
      "donations and how it is spent. Also, is there a way to specify that mine " +
      "should go to the medical fund?",
    createdAt: daysAgo(11),
  },
  {
    name: "Priya Nair",
    email: "priya.nair@example.com",
    number: "9167884320",
    message:
      "My grandmother's building in Byculla has four elderly residents living " +
      "alone with no family support. Is there any way they could be added to the " +
      "monthly ration list? I can share their details.",
    createdAt: daysAgo(15),
  },
  {
    name: "Abdul Rahman Khan",
    email: "ar.khan@example.com",
    number: "9821004433",
    message:
      "Jazakallah khair for the roof repair at the Bhiwandi madrasa. The children " +
      "are back in their classrooms. May Allah reward all the donors.",
    createdAt: daysAgo(22),
  },
  {
    name: "Nikhil Patil",
    email: "nikhil.patil@example.com",
    number: "8983221100",
    message:
      "I run a small printing press and can print your donation receipts, banners " +
      "and pamphlets at cost. Please contact me if that is useful for the winter " +
      "drive.",
    createdAt: daysAgo(29),
  },
  {
    name: "Zainab Merchant",
    email: "zainab.merchant@example.com",
    number: "9769552218",
    message:
      "Is the skill centre for young women open for enrolment yet? My sister is " +
      "18 and interested in the tailoring course. Please tell me when " +
      "registration starts and if there is any fee.",
    createdAt: daysAgo(38),
  },
  {
    name: "Joseph D'Souza",
    email: "joseph.dsouza@example.com",
    number: "9930778866",
    message:
      "Setting up a monthly standing instruction of ₹3,000. Does the site support " +
      "recurring donations, or should I do it from my bank each month?",
    createdAt: daysAgo(47),
  },
  {
    name: "Shabana Ali",
    email: "shabana.ali@example.com",
    number: "9702113344",
    message:
      "I am a retired schoolteacher and can take the evening study circle for " +
      "English twice a week. I live in Nagpada itself so timing is not a problem.",
    createdAt: daysAgo(55),
  },
];

/* ------------------------------------------------------------- donations */

// Amounts are in rupees, as the model stores them. `status` defaults to paid —
// the admin records screen reads only those — with a few created/failed rows so
// the state machine's other outcomes are represented in the data too.
export const donations = [
  { name: "Ayesha Shaikh", mobile: "9820114576", amount: 8500, type: "lillah", days: 1 },
  { name: "Mohammed Farhan", mobile: "7738119042", amount: 25000, type: "zakat", days: 2 },
  { name: "Joseph D'Souza", mobile: "9930778866", amount: 3000, type: "lillah", days: 3 },
  { name: "Rakesh Menon", mobile: "9930221145", amount: 100000, type: "lillah", days: 4 },
  { name: "Zainab Merchant", mobile: "9769552218", amount: 1100, type: "fitr", days: 6 },
  { name: "Anonymous Donor", mobile: "9000000001", amount: 51000, type: "zakat", days: 7 },
  { name: "Sunita Deshpande", mobile: "9822345670", amount: 2500, type: "lillah", days: 9 },
  { name: "Abdul Rahman Khan", mobile: "9821004433", amount: 21000, type: "zakat", days: 12 },
  { name: "Priya Nair", mobile: "9167884320", amount: 1850, type: "lillah", days: 14 },
  {
    name: "Imran Qureshi",
    mobile: "9004556781",
    amount: 500,
    type: "lillah",
    days: 16,
    status: "failed",
  },
  { name: "Fatima Ansari", mobile: "8767432109", amount: 5000, type: "lillah", days: 18 },
  { name: "Yusuf Bhai Patel", mobile: "9825443311", amount: 250000, type: "zakat", days: 21 },
  { name: "Nikhil Patil", mobile: "8983221100", amount: 1000, type: "lillah", days: 24 },
  { name: "Shabana Ali", mobile: "9702113344", amount: 700, type: "fitr", days: 27 },
  { name: "Hamid Sheikh", mobile: "9820771122", amount: 11000, type: "zakat", days: 30 },
  {
    name: "Meera Iyer",
    mobile: "9845110022",
    amount: 4500,
    type: "lillah",
    days: 33,
    status: "created",
  },
  { name: "Salim Kapadia", mobile: "9930118877", amount: 31000, type: "zakat", days: 36 },
  { name: "Ruksana Begum", mobile: "9769004488", amount: 550, type: "fitr", days: 40 },
  { name: "Anonymous Donor", mobile: "9000000002", amount: 75000, type: "lillah", days: 44 },
  { name: "Vikram Chauhan", mobile: "9819443300", amount: 15000, type: "lillah", days: 48 },
  { name: "Tabassum Sayyed", mobile: "9702887744", amount: 2200, type: "fitr", days: 52 },
  { name: "Arif Motiwala", mobile: "9821556600", amount: 41000, type: "zakat", days: 57 },
  {
    name: "Deepa Krishnan",
    mobile: "9930442211",
    amount: 6000,
    type: "lillah",
    days: 61,
    status: "failed",
  },
  { name: "Sohail Merchant", mobile: "9820330099", amount: 18000, type: "zakat", days: 66 },
  { name: "Kavita Joshi", mobile: "9822667700", amount: 3500, type: "lillah", days: 71 },
  { name: "Ibrahim Ghanchi", mobile: "9724110055", amount: 90000, type: "zakat", days: 78 },
  { name: "Nasreen Khatoon", mobile: "9769221100", amount: 1200, type: "fitr", days: 85 },
  { name: "Anonymous Donor", mobile: "9000000003", amount: 500000, type: "lillah", days: 92 },
  { name: "Rehan Dalvi", mobile: "9930887766", amount: 7500, type: "lillah", days: 100 },
  { name: "Farida Contractor", mobile: "9820665544", amount: 65000, type: "zakat", days: 112 },
];
