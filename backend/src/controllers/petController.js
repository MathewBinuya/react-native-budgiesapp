import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { todayStr, stageFromCare } from '../utils/helpers.js';

const DECAY_PER_DAY = 10;

function applyDecay(pet) {
  if (!pet.lastCare?.date) return;
  const last = new Date(pet.lastCare.date);
  const now = new Date(todayStr());
  const daysPassed = Math.floor((now - last) / 86400000);
  if (daysPassed > 0) {
    const drop = daysPassed * DECAY_PER_DAY;
    pet.fullness = Math.max(0, pet.fullness - drop);  
    pet.happiness = Math.max(0, pet.happiness - drop);
  }
}

function rolloverDailyCare(pet) {
  const today = todayStr();
  if (pet.lastCare?.date !== today) {
    pet.lastCare = { date: today, partnersWhoCared: [] };
  }
}

function refreshStage(pet) {
  pet.stage = stageFromCare(pet.careLevel);
}

async function careForPet(req, res, { fullnessDelta, happinessDelta }) {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const pet = couple.pet;
  applyDecay(pet);
  rolloverDailyCare(pet);

  pet.fullness = Math.min(100, Math.max(0, pet.fullness + fullnessDelta));
  pet.happiness = Math.min(100, Math.max(0, pet.happiness + happinessDelta));

  const uid = req.user._id.toString();
  const alreadyCared = pet.lastCare.partnersWhoCared.some(
    (id) => id.toString() === uid
  );
  if (!alreadyCared) pet.lastCare.partnersWhoCared.push(req.user._id);

  const bothCaredToday = pet.lastCare.partnersWhoCared.length >= 2;
  if (bothCaredToday) {
    if (!pet._grewToday) {
      pet.careLevel = Math.min(100, pet.careLevel + 10);
    }
  }
  refreshStage(pet);

  couple.markModified('pet');
  await couple.save();

  res.json({ pet: serializePet(pet, bothCaredToday) });
}

export const getPet = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const pet = couple.pet;
  applyDecay(pet);
  rolloverDailyCare(pet);
  refreshStage(pet);
  couple.markModified('pet');
  await couple.save();

  const bothCaredToday = pet.lastCare.partnersWhoCared.length >= 2;
  res.json({ pet: serializePet(pet, bothCaredToday) });
});

export const feedPet = asyncHandler((req, res) =>
  careForPet(req, res, { fullnessDelta: 15, happinessDelta: 5 })
);

export const playWithPet = asyncHandler((req, res) =>
  careForPet(req, res, { fullnessDelta: -5, happinessDelta: 15 })
);

function serializePet(pet, bothCaredToday) {
  const avg = (pet.fullness + pet.happiness) / 2;
  const mood = avg > 70 ? 'happy' : avg > 40 ? 'content' : 'sad';
  return {
    name: pet.name,
    fullness: pet.fullness,
    happiness: pet.happiness,
    careLevel: pet.careLevel,
    stage: pet.stage,
    mood,
    bothCaredToday,
    partnersWhoCaredToday: pet.lastCare?.partnersWhoCared?.length || 0,
  };
}