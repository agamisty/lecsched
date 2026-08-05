const TimeSlot = require('../models/TimeSlot');

const DEFAULT_BLOCKS = [
  { name: 'Block 1', startTime: '08:00', endTime: '10:00' },
  { name: 'Block 2', startTime: '10:30', endTime: '12:30' },
  { name: 'Block 3', startTime: '13:00', endTime: '15:00' },
  { name: 'Block 4', startTime: '15:00', endTime: '17:00' },
  { name: 'Block 5', startTime: '17:00', endTime: '19:00' }
];

async function ensureDefaultTimeSlots() {
  await TimeSlot.destroy({ where: { name: 'ALL DAY' } });

  const existing = await TimeSlot.findAll();
  const existingStarts = new Set(existing.map((s) => s.startTime));

  for (const block of DEFAULT_BLOCKS) {
    if (!existingStarts.has(block.startTime)) {
      await TimeSlot.create({
        ...block,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        active: true
      });
    }
  }

  return (await TimeSlot.count()) || 0;
}

module.exports = { DEFAULT_BLOCKS, ensureDefaultTimeSlots };
