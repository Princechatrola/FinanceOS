// ============================================================
// FINANCEOS - SAFE DATA MIGRATION FOR RECURRING DUE DATES
// ============================================================
//
// Rule:
// "If existing plans/investments already exist without a stored due day:
//  DO NOT invent a due date.
//  Determine whether a due-date value can safely be derived from existing data.
//  If it can: -> migrate/derive it.
//  If it cannot: -> require the user to configure the due schedule once.
//  Do NOT silently invent dates."
// ============================================================

const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");

async function migrateRecurringSchedules() {
  try {
    let migratedCount = 0;

    // 1. Investments: Migrate from reminder.contributionDay or nextContributionDate
    const investments = await Investment.find({
      dueDay: { $in: [null, undefined] },
      $or: [
        { "reminder.contributionDay": { $exists: true, $ne: null } },
        { nextContributionDate: { $exists: true, $ne: null } },
      ],
    });

    for (const inv of investments) {
      let derivedDay = null;
      if (inv.reminder && inv.reminder.contributionDay) {
        derivedDay = Number(inv.reminder.contributionDay);
      } else if (inv.nextContributionDate) {
        const d = new Date(inv.nextContributionDate);
        if (!Number.isNaN(d.getTime())) {
          derivedDay = d.getDate();
        }
      }

      if (derivedDay && derivedDay >= 1 && derivedDay <= 31) {
        inv.dueDay = derivedDay;
        await inv.save();
        migratedCount++;
      }
    }

    // 2. Insurances: Migrate from policy startDate
    const insurances = await Insurance.find({
      premiumDueDay: { $in: [null, undefined] },
      startDate: { $exists: true, $ne: null },
    });

    for (const ins of insurances) {
      const d = new Date(ins.startDate);
      if (!Number.isNaN(d.getTime())) {
        const derivedDay = d.getDate();
        if (derivedDay >= 1 && derivedDay <= 31) {
          ins.premiumDueDay = derivedDay;
          await ins.save();
          migratedCount++;
        }
      }
    }

    // 3. Liabilities: Migrate from nextDueDate or startDate
    const liabilities = await Liability.find({
      dueDay: { $in: [null, undefined] },
      $or: [
        { nextDueDate: { $exists: true, $ne: null } },
        { startDate: { $exists: true, $ne: null } },
      ],
    });

    for (const liab of liabilities) {
      let derivedDay = null;
      if (liab.nextDueDate) {
        const d = new Date(liab.nextDueDate);
        if (!Number.isNaN(d.getTime())) derivedDay = d.getDate();
      } else if (liab.startDate) {
        const d = new Date(liab.startDate);
        if (!Number.isNaN(d.getTime())) derivedDay = d.getDate();
      }

      if (derivedDay && derivedDay >= 1 && derivedDay <= 31) {
        liab.dueDay = derivedDay;
        await liab.save();
        migratedCount++;
      }
    }

    // 4. Saving Goals: Migrate from reminder.contributionDay or targetDate
    const goals = await SavingGoal.find({
      contributionDay: { $in: [null, undefined] },
      "reminder.contributionDay": { $exists: true, $ne: null },
    });

    for (const goal of goals) {
      const day = Number(goal.reminder?.contributionDay);
      if (day >= 1 && day <= 31) {
        goal.contributionDay = day;
        await goal.save();
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`[Migration] Safely migrated ${migratedCount} plans to recurring due-day schedule.`);
    }
  } catch (error) {
    console.warn("[Migration] Due-date schedule migration check error:", error.message);
  }
}

module.exports = { migrateRecurringSchedules };
