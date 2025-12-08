export function drawNames(participants) {
  // participants = [{ user_id: 'A', group_id: '1' }, { user_id: 'B', group_id: '1' }, ...]
  
  let valid = false;
  let attempts = 0;
  let shuffled;

  // Try to shuffle up to 100 times to find a valid match
  while (!valid && attempts < 100) {
    attempts++;
    // Simple Fisher-Yates shuffle
    shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    // Check constraints
    valid = participants.every((p, i) => {
      const target = shuffled[i];
      // Rule 1: Cannot draw self
      if (p.user_id === target.user_id) return false;
      // Rule 2: Cannot draw someone from same sub-group (if group exists)
      if (p.group_id && target.group_id && p.group_id === target.group_id) return false;
      return true;
    });
  }

  if (!valid) throw new Error("Could not find a valid match! Try removing some constraints.");

  // Return updates for DB
  return participants.map((p, i) => ({
    user_id: p.user_id,
    target_id: shuffled[i].user_id
  }));
}