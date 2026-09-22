/**
 * Fill an empty database with sample projects, galleries, inbox messages and
 * donation records, so the website and the admin dashboard have something to
 * show on a fresh install or a demo deployment.
 *
 *   npm run seed              — insert, but refuse if a collection is non-empty
 *   npm run seed -- --reset   — wipe those four collections first
 *   npm run seed -- --force   — insert alongside whatever is already there
 *
 * Only the four content collections are touched. Settings and the admin
 * credentials are never read or written by this script.
 *
 * The refuse-by-default is the whole point: `--reset` deletes real donation
 * records and real inbox messages, and this script must not be the reason a
 * charity loses either. Nothing here can run against a database it did not
 * find empty unless a human typed one of those two flags.
 *
 * The images are picsum.photos placeholders, not Cloudinary uploads — see
 * seedData.js. Deleting a seeded project or gallery from the admin panel is
 * therefore safe: there is no asset behind it to orphan.
 */
import "dotenv/config";
import mongoose from "mongoose";

import Project from "../src/models/Project.js";
import Gallery from "../src/models/Gallery.js";
import Contact from "../src/models/Contact.js";
import Donation from "../src/models/Donation.js";
import { PAID } from "../src/services/donationStatus.js";

import { projects, galleries, contacts, donations, daysAgo } from "./seedData.js";

const flags = new Set(process.argv.slice(2));
const reset = flags.has("--reset") || flags.has("--fresh");
const force = flags.has("--force");

/**
 * Donations arrive from Razorpay in real life, so the ids and signatures are
 * invented here — prefixed `seed_` so a seeded record is never mistaken for a
 * real one in the records screen, in an export, or by anyone reconciling
 * against a Razorpay dashboard.
 *
 * `razorpayOrderId` is unique in the schema, which is also what makes a
 * `--force` re-run fail loudly instead of quietly duplicating the records.
 */
const buildDonation = ({ days, status = PAID, ...rest }, index) => {
  const id = String(index + 1).padStart(3, "0");
  const paid = status === PAID;

  return {
    ...rest,
    status,
    createdAt: daysAgo(days),
    razorpayOrderId: `order_seed${id}`,
    // A donation that never completed carries neither, exactly as in production.
    ...(paid
      ? { razorpayPaymentId: `pay_seed${id}`, razorpaySignature: `sig_seed${id}` }
      : {}),
  };
};

const collections = [
  { label: "projects", model: Project, docs: projects },
  { label: "galleries", model: Gallery, docs: galleries },
  { label: "inbox messages", model: Contact, docs: contacts },
  { label: "donations", model: Donation, docs: donations.map(buildDonation) },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set — check server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}\n`);

  const counts = await Promise.all(collections.map(({ model }) => model.estimatedDocumentCount()));
  const existing = collections
    .map((collection, i) => ({ ...collection, count: counts[i] }))
    .filter(({ count }) => count > 0);

  if (existing.length && !reset && !force) {
    console.error("Refusing to seed — this database already has content:\n");
    for (const { label, count } of existing) console.error(`  ${count} ${label}`);
    console.error(
      "\nRe-run with --reset to delete it first, or --force to add the sample\n" +
        "data alongside it. Both are destructive on a live database; be sure\n" +
        `you meant "${mongoose.connection.name}".`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (reset) {
    for (const { label, model } of collections) {
      const { deletedCount } = await model.deleteMany({});
      console.log(`  cleared ${deletedCount} ${label}`);
    }
    console.log("");
  }

  for (const { label, model, docs } of collections) {
    const inserted = await model.insertMany(docs);
    console.log(`  inserted ${inserted.length} ${label}`);
  }

  const byCategory = projects.reduce((acc, { category }) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `\n  projects by category: ` +
      ["current", "upcoming", "completed"].map((c) => `${c} ${byCategory[c] || 0}`).join(", ")
  );

  console.log("\n✅ Seed complete.");
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(`\n❌ Seed failed: ${err.message}`);
  // A duplicate order id is the one failure with an obvious cause and an
  // obvious fix, so name it rather than leaving a raw E11000 on screen.
  if (err.code === 11000) {
    console.error("   The sample donations are already in this database — use --reset.");
  }
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
