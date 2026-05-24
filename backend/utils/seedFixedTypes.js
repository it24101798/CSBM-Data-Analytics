const DirectionType = require("../models/DirectionType");

const seedFixedTypes = async () => {
  const fixedTypes = [
    { name: "Ongoing Batches", code: "ONGOING_BATCHES" },
    { name: "Workshops", code: "WORKSHOPS" },
    { name: "New Registration", code: "NEW_REGISTRATION" },
  ];

  for (const item of fixedTypes) {
    await DirectionType.findOneAndUpdate(
      { code: item.code },
      item,
      { upsert: true, returnDocument: "after" }
    );
  }

  console.log("Fixed direction types seeded.");
};

module.exports = seedFixedTypes;