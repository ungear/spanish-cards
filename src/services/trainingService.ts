export function levelupCard(level: number) {
  const now = new Date();
  let newLevel = level;
  let newRepeatDate;
  
  switch(level) {
    case 0:
      newLevel++;
      newRepeatDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // +1 day
      break;
    case 1:
      newLevel++;
      newRepeatDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // +3 days
      break;
    case 2:
      newLevel++;
      newRepeatDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 days
      break;
    case 3:
      newLevel++;
      newRepeatDate = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // +14 days
      break;
    case 4:
      newLevel++;
      newRepeatDate = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)); // +28 days
      break;
    default:
      newRepeatDate = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)); // +28 days
  }
  return {newLevel, newRepeatDate};
}

export function leveldownCard() {
  let newLevel = 0;
  const now = new Date();
  let newRepeatDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // +1 day;
  return {newLevel, newRepeatDate};
}

